import fs from "node:fs";

// ─── .env (sem dependências; não sobrescreve variáveis já definidas) ───────────
export function loadEnv(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

// ─── Unidades (uma credencial por unidade) ─────────────────────────────────────
// Formato: EVO_UNIT_<NOME>_USER e EVO_UNIT_<NOME>_KEY (NOME: letras e números, ex.: UMI).
// Compatibilidade: sem nenhuma unidade configurada, EVO_USER/EVO_KEY viram a unidade "PADRAO".
export function loadUnits(env = process.env) {
  const partial = {};
  for (const [k, v] of Object.entries(env)) {
    const m = k.match(/^EVO_UNIT_([A-Za-z0-9]+)_(USER|KEY)$/);
    if (!m || !v) continue;
    const name = m[1].toUpperCase();
    partial[name] = { ...(partial[name] ?? {}), [m[2].toLowerCase()]: v };
  }
  const units = new Map();
  const warnings = [];
  for (const [name, c] of Object.entries(partial)) {
    if (c.user && c.key) units.set(name, c);
    else warnings.push(`Unidade ${name} ignorada: falta ${c.user ? "EVO_UNIT_" + name + "_KEY" : "EVO_UNIT_" + name + "_USER"}.`);
  }
  const hasLegacy = !!(env.EVO_USER && env.EVO_KEY);
  if (!units.size && hasLegacy) units.set("PADRAO", { user: env.EVO_USER, key: env.EVO_KEY });
  else if (units.size && hasLegacy) warnings.push("EVO_USER/EVO_KEY ignorados porque há unidades configuradas; remova essas duas linhas do .env.");
  return { units, warnings };
}

// Decide em quais unidades a chamada roda. Retorna { names, all } ou { error }.
export function resolveUnits(units, requested) {
  const names = [...units.keys()];
  if (!names.length) {
    return { error: "Nenhuma unidade configurada. Preencha EVO_UNIT_<NOME>_USER e EVO_UNIT_<NOME>_KEY no .env e reinicie o conector." };
  }
  const r = (requested ?? "").trim().toUpperCase();
  if (!r) {
    if (names.length === 1) return { names, all: false };
    return { error: `Informe 'unit'. Unidades configuradas: ${names.join(", ")} (ou 'todas' para rodar um GET em todas).` };
  }
  if (r === "TODAS" || r === "ALL") return { names, all: true };
  if (!units.has(r)) return { error: `Unidade desconhecida: ${requested}. Configuradas: ${names.join(", ")}.` };
  return { names: [r], all: false };
}

// ─── Política de acesso ────────────────────────────────────────────────────────
// blocked   : nunca executa por este conector (movimentação de dinheiro, login de membro)
// sensitive : exige EVO_ALLOW_SENSITIVE=1 + frase de confirmação
// write     : exige EVO_ALLOW_WRITES=1 + frase de confirmação
// read      : GET, liberado
const BLOCKED = [
  { methods: ["POST", "PUT", "PATCH", "DELETE"], re: /^\/api\/v\d+\/receivables/i },
  { methods: ["POST", "PUT", "PATCH", "DELETE"], re: /^\/api\/v\d+\/PaymentType/i },
  { methods: ["POST", "PUT", "PATCH", "DELETE"], re: /^\/api\/v\d+\/bank-accounts/i },
  { methods: ["POST", "PUT", "PATCH", "DELETE"], re: /^\/api\/v\d+\/carts/i },
  { methods: ["POST", "PUT", "PATCH", "DELETE"], re: /^\/api\/v\d+\/sales/i },
  { methods: ["PUT"], re: /^\/api\/v\d+\/members\/fitcoins/i },
  { methods: ["POST"], re: /^\/api\/v\d+\/membermembership\/cancellation/i },
  { methods: ["POST"], re: /^\/api\/v\d+\/members\/(auth|member-id-auth)$/i },
  { methods: ["GET"], re: /^\/api\/v\d+\/members\/resetPassword$/i },
];

const SENSITIVE = [
  { methods: ["DELETE"], re: /.*/ },
  { methods: ["POST", "PUT", "PATCH"], re: /^\/api\/v\d+\/(members\/(multiple-)?push|notifications)/i },
  { methods: ["POST", "PUT", "PATCH"], re: /^\/api\/v\d+\/accessControl/i },
  { methods: ["POST", "PUT", "PATCH"], re: /^\/api\/v\d+\/(members|prospects)\/transfer/i },
  { methods: ["PUT", "PATCH"], re: /^\/api\/v\d+\/members\/block-unblock/i },
  { methods: ["POST", "PUT", "PATCH"], re: /^\/api\/v\d+\/employees/i },
  { methods: ["PATCH"], re: /^\/api\/v\d+\/configuration/i },
  { methods: ["POST"], re: /^\/api\/v\d+\/webhook/i },
];

export function classify(method, path) {
  const m = method.toUpperCase();
  if (BLOCKED.some((r) => r.methods.includes(m) && r.re.test(path))) return "blocked";
  if (m === "GET") return "read";
  if (SENSITIVE.some((r) => r.methods.includes(m) && r.re.test(path))) return "sensitive";
  return "write";
}

export function confirmPhrase(method, resolvedPath) {
  return `EXECUTAR ${method.toUpperCase()} ${resolvedPath}`;
}

// Retorna null se liberado, ou uma mensagem explicando o bloqueio.
export function checkPolicy({ method, templatePath, resolvedPath, confirm, env = process.env }) {
  const tier = classify(method, templatePath);
  if (tier === "read") return null;
  if (tier === "blocked") {
    return `Bloqueado: ${method.toUpperCase()} ${templatePath} movimenta dinheiro ou autentica membros e não é executado por este conector.`;
  }
  const flag = tier === "sensitive" ? "EVO_ALLOW_SENSITIVE" : "EVO_ALLOW_WRITES";
  if (env[flag] !== "1") {
    return `Bloqueado (${tier}): defina ${flag}=1 no .env do conector para permitir este tipo de chamada.`;
  }
  const phrase = confirmPhrase(method, resolvedPath);
  if (confirm !== phrase) {
    return `Confirmação necessária (${tier}). Para executar, repita a chamada com confirm exatamente igual a: ${phrase}`;
  }
  return null;
}

// ─── Mascaramento de dados pessoais ────────────────────────────────────────────
const ALWAYS_MASK = new Set([
  "firstname", "lastname", "membername", "registername", "registerlastname",
  "document", "cpf", "rg", "email", "cellphone", "phone", "telephone", "celular",
  "address", "complement", "neighborhood", "zipcode", "photo", "instructorphoto",
  "whatsappusername", "whatsappbsuid", "gympassid", "responsiblename",
]);
const PERSON_ID_KEYS = ["idMember", "idProspect", "idResponsible"];

function maskString(s) {
  if (typeof s !== "string" || s.length === 0) return s;
  return s.length <= 1 ? "*" : `${s[0]}***`;
}

function maskBirth(s) {
  if (typeof s !== "string") return s;
  const m = s.match(/^(\d{4})-/);
  return m ? `${m[1]}-**-**` : "****";
}

export function maskPii(value) {
  if (Array.isArray(value)) return value.map(maskPii);
  if (value && typeof value === "object") {
    const isPerson = PERSON_ID_KEYS.some((k) => value[k] != null);
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const lk = k.toLowerCase();
      if (ALWAYS_MASK.has(lk) && typeof v === "string") out[k] = maskString(v);
      else if (lk === "birthdate" || lk === "birthday") out[k] = maskBirth(v);
      else if (isPerson && lk === "name" && typeof v === "string") out[k] = maskString(v);
      else if (lk === "contacts" && Array.isArray(v)) {
        out[k] = v.map((c) =>
          c && typeof c === "object"
            ? Object.fromEntries(
                Object.entries(c).map(([ck, cv]) =>
                  ["description", "value", "email"].includes(ck) && typeof cv === "string" ? [ck, maskString(cv)] : [ck, cv],
                ),
              )
            : c,
        );
      } else out[k] = maskPii(v);
    }
    return out;
  }
  return value;
}

// ─── Especificação OpenAPI ─────────────────────────────────────────────────────
export function resolveRef(spec, schema) {
  let s = schema;
  let guard = 0;
  while (s && s.$ref && guard++ < 10) {
    const name = s.$ref.split("/").pop();
    s = spec.components?.schemas?.[name];
  }
  return s;
}

export function describeSchema(spec, schema, depth = 2) {
  const s = resolveRef(spec, schema);
  if (!s) return null;
  if (s.enum) return { type: s.type, enum: s.enum };
  if (s.type === "array") return { type: "array", items: depth > 0 ? describeSchema(spec, s.items, depth - 1) : "…" };
  if (s.properties) {
    if (depth <= 0) return { type: "object", properties: Object.keys(s.properties) };
    const props = {};
    for (const [k, v] of Object.entries(s.properties)) {
      props[k] = describeSchema(spec, v, depth - 1) ?? v.type ?? "any";
    }
    return { type: "object", required: s.required, properties: props };
  }
  return { type: s.type, format: s.format };
}

export function findOperation(spec, method, path) {
  const item = spec.paths?.[path];
  return item?.[method.toLowerCase()] ?? null;
}
