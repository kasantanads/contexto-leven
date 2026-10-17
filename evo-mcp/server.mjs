import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, loadUnits, resolveUnits, classify, checkPolicy, maskPii, describeSchema, findOperation, resolveRef } from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv(process.env.EVO_ENV_FILE || path.join(here, ".env"));
const { units, warnings: unitWarnings } = loadUnits();

const SPEC_URL = process.env.EVO_SPEC_URL || "https://evo-integracao.w12app.com.br/swagger/v1/swagger.json";
const SPEC_CACHE = path.join(here, "spec.json");
const AUDIT_LOG = path.join(here, "audit.log");
const MAX_CHARS = 60_000;
const MIN_GAP_MS = 1_700; // o EVO limita a 40 req/min por credencial

let specPromise = null;
function getSpec() {
  if (!specPromise) {
    specPromise = (async () => {
      try {
        const res = await fetch(SPEC_URL, { signal: AbortSignal.timeout(30_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const spec = await res.json();
        fs.writeFileSync(SPEC_CACHE, JSON.stringify(spec));
        return spec;
      } catch (err) {
        if (fs.existsSync(SPEC_CACHE)) return JSON.parse(fs.readFileSync(SPEC_CACHE, "utf8"));
        throw new Error(`Não foi possível carregar a especificação do EVO: ${err.message}`);
      }
    })();
    specPromise.catch(() => {
      specPromise = null;
    });
  }
  return specPromise;
}

function audit(line) {
  try {
    fs.appendFileSync(AUDIT_LOG, `${new Date().toISOString()} ${line}\n`);
  } catch {
    /* auditoria é melhor-esforço */
  }
}

// Espaça as chamadas de cada unidade para respeitar o limite do EVO.
const lastCall = new Map();
const chains = new Map();
function throttle(name) {
  const prev = chains.get(name) ?? Promise.resolve();
  const next = prev.then(async () => {
    const wait = (lastCall.get(name) ?? 0) + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall.set(name, Date.now());
  });
  chains.set(name, next);
  return next;
}

async function request({ unitName, method, url, body }) {
  const creds = units.get(unitName);
  await throttle(unitName);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.user}:${creds.key}`).toString("base64")}`,
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = rawText;
  }
  return { status: res.status, ok: res.ok, data };
}

const text = (t, isError = false) => ({ content: [{ type: "text", text: t }], ...(isError ? { isError: true } : {}) });

const server = new McpServer({ name: "evo", version: "1.1.0" });

// 0) Unidades configuradas ─────────────────────────────────────────────────────
server.tool(
  "evo_list_units",
  "Lista as unidades configuradas no conector (só os rótulos, nunca as chaves). Com check=true, faz um GET leve em cada unidade para validar a credencial e mostrar a filial (idBranch e nome) a que ela dá acesso.",
  { check: z.boolean().optional().describe("Valida cada credencial com um GET leve") },
  async ({ check }) => {
    const names = [...units.keys()];
    const out = { unidades: names, avisos: unitWarnings };
    if (!names.length) return text(JSON.stringify({ ...out, aviso: "Nenhuma unidade configurada." }, null, 2), true);
    if (check) {
      const spec = await getSpec();
      const base = (process.env.EVO_BASE_URL || spec.servers?.[0]?.url || "").replace(/\/$/, "");
      out.verificacao = {};
      for (const name of names) {
        try {
          const r = await request({ unitName: name, method: "GET", url: `${base}/api/v2/members?take=1` });
          const first = Array.isArray(r.data) ? r.data[0] : null;
          out.verificacao[name] = r.ok
            ? { status: r.status, idBranch: first?.idBranch ?? null, filial: first?.branchName ?? null }
            : { status: r.status, erro: r.status === 401 ? "credencial recusada (usuário ou chave incorretos)" : r.status === 403 ? "autenticou, mas sem permissão neste endpoint" : r.status === 429 ? "limite de requisições; tente em 1 minuto" : "falha" };
          audit(`unit=${name} CHECK status=${r.status}`);
        } catch (err) {
          out.verificacao[name] = { erro: `falha de rede: ${err.message}` };
        }
      }
    }
    return text(JSON.stringify(out, null, 2));
  },
);

// 1) Descobrir endpoints ───────────────────────────────────────────────────────
server.tool(
  "evo_list_endpoints",
  "Lista os endpoints da API do EVO (W12) com a classificação de acesso: read, write, sensitive ou blocked. Use 'search' para filtrar por trecho do caminho, resumo ou tag.",
  {
    search: z.string().optional().describe("Trecho do caminho, resumo ou tag, ex.: 'prospect' ou 'schedule'"),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
    tier: z.enum(["read", "write", "sensitive", "blocked"]).optional(),
  },
  async ({ search, method, tier }) => {
    const spec = await getSpec();
    const q = search?.toLowerCase();
    const rows = [];
    for (const [p, item] of Object.entries(spec.paths ?? {})) {
      for (const [m, op] of Object.entries(item)) {
        if (!["get", "post", "put", "patch", "delete"].includes(m)) continue;
        const M = m.toUpperCase();
        const t = classify(M, p);
        if (method && M !== method) continue;
        if (tier && t !== tier) continue;
        const hay = `${p} ${op.summary ?? ""} ${(op.tags ?? []).join(" ")}`.toLowerCase();
        if (q && !hay.includes(q)) continue;
        rows.push(`${M} ${p} [${t}] — ${op.summary ?? ""}`);
      }
    }
    const shown = rows.slice(0, 200);
    return text(`${rows.length} endpoint(s)${rows.length > shown.length ? ` (mostrando ${shown.length})` : ""}\n` + shown.join("\n"));
  },
);

// 2) Detalhar um endpoint ──────────────────────────────────────────────────────
server.tool(
  "evo_describe_endpoint",
  "Mostra parâmetros, corpo esperado e a forma da resposta de um endpoint do EVO. 'path' é o caminho exatamente como listado (com {parametros}).",
  {
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    path: z.string().describe("Ex.: /api/v1/activities/schedule/detail"),
  },
  async ({ method, path: p }) => {
    const spec = await getSpec();
    const op = findOperation(spec, method, p);
    if (!op) return text(`Endpoint não encontrado na especificação: ${method} ${p}`, true);
    const params = (op.parameters ?? []).map((x) => ({
      name: x.name,
      in: x.in,
      required: !!x.required,
      type: x.schema?.$ref ? x.schema.$ref.split("/").pop() : x.schema?.type,
      enum: resolveRef(spec, x.schema)?.enum,
      description: x.description,
    }));
    const bodyContent = op.requestBody ? Object.values(op.requestBody.content ?? {})[0]?.schema : null;
    const okContent = op.responses?.["200"]?.content ? Object.values(op.responses["200"].content)[0]?.schema : null;
    return text(
      JSON.stringify(
        {
          method,
          path: p,
          tier: classify(method, p),
          summary: op.summary,
          description: op.description,
          params,
          body: bodyContent ? describeSchema(spec, bodyContent, 3) : null,
          response200: okContent ? describeSchema(spec, okContent, 2) : null,
        },
        null,
        2,
      ),
    );
  },
);

// 3) Chamar ────────────────────────────────────────────────────────────────────
server.tool(
  "evo_call",
  "Chama um endpoint da API do EVO numa unidade. Use 'unit' para escolher a unidade (veja evo_list_units); 'todas' roda o mesmo GET em todas. GET é liberado. POST/PUT/PATCH/DELETE seguem a política: write e sensitive exigem flag no .env do conector e a frase de confirmação, e só rodam em uma unidade por vez; blocked nunca executa. Dados pessoais são mascarados na resposta.",
  {
    unit: z.string().optional().describe("Rótulo da unidade (ex.: UMI) ou 'todas' (só GET). Opcional se houver uma única unidade."),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    path: z.string().describe("Caminho como na especificação, ex.: /api/v2/members/{idMember}"),
    pathParams: z.record(z.union([z.string(), z.number()])).optional(),
    query: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
    body: z.any().optional(),
    confirm: z.string().optional().describe("Frase de confirmação exigida para write/sensitive"),
    raw: z.boolean().optional().describe("Só funciona com EVO_UNMASK=1 no .env: devolve sem mascarar dados pessoais"),
  },
  async ({ unit, method, path: p, pathParams, query, body, confirm, raw }) => {
    const spec = await getSpec();
    const op = findOperation(spec, method, p);
    if (!op) return text(`Endpoint não encontrado na especificação: ${method} ${p}. Use evo_list_endpoints.`, true);

    let resolved = p;
    for (const [k, v] of Object.entries(pathParams ?? {})) {
      resolved = resolved.replace(`{${k}}`, encodeURIComponent(String(v)));
    }
    if (/\{[^}]+\}/.test(resolved)) return text(`Faltam pathParams para: ${resolved}`, true);

    const blocked = checkPolicy({ method, templatePath: p, resolvedPath: resolved, confirm });
    if (blocked) {
      audit(`${method} ${p} POLICY-DENIED`);
      return text(blocked, true);
    }

    const target = resolveUnits(units, unit);
    if (target.error) return text(target.error, true);
    if (target.all && classify(method, p) !== "read") {
      return text("'todas' só vale para GET. Escritas rodam em uma unidade por vez, informando o rótulo da unidade.", true);
    }

    const q = { ...(query ?? {}) };
    const hasTake = (op.parameters ?? []).some((x) => x.name === "take");
    if (hasTake) q.take = Math.min(Number(q.take ?? 20), 100);

    const base = (process.env.EVO_BASE_URL || spec.servers?.[0]?.url || "").replace(/\/$/, "");
    const qs = new URLSearchParams(Object.entries(q).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => [k, String(v)])).toString();
    const url = `${base}${resolved}${qs ? `?${qs}` : ""}`;
    const unmask = raw === true && process.env.EVO_UNMASK === "1";

    const results = {};
    for (const name of target.names) {
      try {
        const r = await request({ unitName: name, method, url, body });
        audit(`unit=${name} ${method} ${p} keys=${Object.keys(q).join(",")} status=${r.status}`);
        results[name] = {
          status: r.status,
          ...(r.status === 429 ? { aviso: "limite de 40 requisições por minuto atingido nesta unidade; aguarde cerca de 1 minuto" } : {}),
          masked: !unmask,
          data: unmask ? r.data : maskPii(r.data),
          _ok: r.ok,
        };
      } catch (err) {
        audit(`unit=${name} ${method} ${p} NETWORK-ERROR`);
        results[name] = { status: 0, erro: `falha de rede: ${err.message}`, _ok: false };
      }
    }

    const anyOk = Object.values(results).some((r) => r._ok);
    for (const r of Object.values(results)) delete r._ok;
    const payload = target.all ? { unidades: results } : { unidade: target.names[0], ...results[target.names[0]] };
    let json = JSON.stringify(payload, null, 2);
    let truncated = false;
    if (json.length > MAX_CHARS) {
      json = json.slice(0, MAX_CHARS);
      truncated = true;
    }
    return text(json + (truncated ? "\n…(resposta truncada; reduza take/período ou consulte uma unidade por vez)" : ""), !anyOk);
  },
);

await server.connect(new StdioServerTransport());
