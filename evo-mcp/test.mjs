// Teste sem credenciais: política, mascaramento e o servidor MCP de ponta a ponta.
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { classify, checkPolicy, maskPii, loadUnits, resolveUnits } from "./lib.mjs";

// ── política ──
assert.equal(classify("GET", "/api/v1/prospects"), "read");
assert.equal(classify("POST", "/api/v1/prospects"), "write");
assert.equal(classify("POST", "/api/v1/activities/schedule/experimental-class"), "write");
assert.equal(classify("DELETE", "/api/v2/activities/enroll"), "sensitive");
assert.equal(classify("POST", "/api/v1/webhook"), "sensitive");
assert.equal(classify("POST", "/api/v1/members/push"), "sensitive");
assert.equal(classify("POST", "/api/v1/receivables/charge"), "blocked");
assert.equal(classify("POST", "/api/v1/receivables/refund"), "blocked");
assert.equal(classify("POST", "/api/v2/sales"), "blocked");
assert.equal(classify("POST", "/api/v1/membermembership/cancellation"), "blocked");
assert.equal(classify("POST", "/api/v1/members/auth"), "blocked");
assert.equal(classify("GET", "/api/v1/members/resetPassword"), "blocked");
assert.equal(classify("GET", "/api/v1/receivables"), "read");

assert.match(checkPolicy({ method: "POST", templatePath: "/api/v1/prospects", resolvedPath: "/api/v1/prospects", env: {} }), /EVO_ALLOW_WRITES/);
assert.match(
  checkPolicy({ method: "POST", templatePath: "/api/v1/prospects", resolvedPath: "/api/v1/prospects", env: { EVO_ALLOW_WRITES: "1" } }),
  /EXECUTAR POST \/api\/v1\/prospects/,
);
assert.equal(
  checkPolicy({
    method: "POST",
    templatePath: "/api/v1/prospects",
    resolvedPath: "/api/v1/prospects",
    confirm: "EXECUTAR POST /api/v1/prospects",
    env: { EVO_ALLOW_WRITES: "1" },
  }),
  null,
);
assert.match(checkPolicy({ method: "POST", templatePath: "/api/v1/receivables/charge", resolvedPath: "/api/v1/receivables/charge", env: { EVO_ALLOW_WRITES: "1", EVO_ALLOW_SENSITIVE: "1" } }), /Bloqueado/);

// ── mascaramento ──
const masked = maskPii({
  name: "Atividade Personal",
  idActivity: 7,
  enrollments: [
    { idMember: 11, idProspect: null, name: "Maria Souza", status: 1 },
    { idProspect: 22, name: "João Lima", status: 0 },
  ],
  prospect: { firstName: "Ana", lastName: "Costa", document: "12345678900", email: "ana@x.com", birthDate: "1990-05-17", idProspect: 5, currentStep: "AT", contacts: [{ type: "mail", description: "ana@x.com" }] },
});
assert.equal(masked.name, "Atividade Personal"); // nome de atividade não é mascarado
assert.equal(masked.enrollments[0].name, "M***");
assert.equal(masked.enrollments[1].name, "J***");
assert.equal(masked.enrollments[0].status, 1);
assert.equal(masked.prospect.firstName, "A***");
assert.equal(masked.prospect.document, "1***");
assert.equal(masked.prospect.birthDate, "1990-**-**");
assert.equal(masked.prospect.currentStep, "AT");
assert.equal(masked.prospect.contacts[0].description, "a***");
// ── unidades ──
const four = loadUnits({
  EVO_UNIT_UMI_USER: "u1", EVO_UNIT_UMI_KEY: "k1",
  EVO_UNIT_UMP_USER: "u2", EVO_UNIT_UMP_KEY: "k2",
  EVO_UNIT_ucb_USER: "u3", EVO_UNIT_ucb_KEY: "k3",
  EVO_UNIT_UP_USER: "u4", EVO_UNIT_UP_KEY: "k4",
});
assert.deepEqual([...four.units.keys()].sort(), ["UCB", "UMI", "UMP", "UP"]);
assert.equal(four.units.get("UCB").user, "u3");
assert.deepEqual(four.warnings, []);
const legacy = loadUnits({ EVO_USER: "a", EVO_KEY: "b" });
assert.deepEqual([...legacy.units.keys()], ["PADRAO"]);
const mixed = loadUnits({ EVO_USER: "a", EVO_KEY: "b", EVO_UNIT_UMI_USER: "u", EVO_UNIT_UMI_KEY: "k" });
assert.deepEqual([...mixed.units.keys()], ["UMI"]);
assert.match(mixed.warnings.join(" "), /EVO_USER\/EVO_KEY ignorados/);
const half = loadUnits({ EVO_UNIT_UMI_USER: "u" });
assert.equal(half.units.size, 0);
assert.match(half.warnings[0], /EVO_UNIT_UMI_KEY/);
assert.match(resolveUnits(four.units, "").error, /Informe 'unit'/);
assert.match(resolveUnits(four.units, "zzz").error, /desconhecida/);
assert.deepEqual(resolveUnits(four.units, "umi").names, ["UMI"]);
assert.equal(resolveUnits(four.units, "Todas").all, true);
assert.equal(resolveUnits(four.units, "todas").names.length, 4);
assert.deepEqual(resolveUnits(legacy.units, "").names, ["PADRAO"]);
assert.match(resolveUnits(new Map(), "").error, /Nenhuma unidade/);
console.log("lib: ok");

// ── servidor MCP de ponta a ponta (credenciais falsas, sem rede para o EVO) ──
// EVO_ENV_FILE aponta para um arquivo inexistente: o teste nunca lê o seu .env real.
const here = path.dirname(fileURLToPath(import.meta.url));
const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("EVO_")));
async function connect(extra) {
  const c = new Client({ name: "teste", version: "0.0.0" });
  await c.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(here, "server.mjs")], env: { ...cleanEnv, EVO_ENV_FILE: path.join(here, "nao-existe.env"), ...extra } }));
  return c;
}
const client = await connect({});

const tools = (await client.listTools()).tools.map((t) => t.name).sort();
assert.deepEqual(tools, ["evo_call", "evo_describe_endpoint", "evo_list_endpoints", "evo_list_units"]);

const list = await client.callTool({ name: "evo_list_endpoints", arguments: { search: "experimental" } });
assert.match(list.content[0].text, /experimental-class \[write\]/);

const desc = await client.callTool({ name: "evo_describe_endpoint", arguments: { method: "GET", path: "/api/v1/activities/schedule/detail" } });
assert.match(desc.content[0].text, /idConfiguration/);

const denied = await client.callTool({ name: "evo_call", arguments: { method: "POST", path: "/api/v1/receivables/charge", body: {} } });
assert.equal(denied.isError, true);
assert.match(denied.content[0].text, /Bloqueado/);

const noCreds = await client.callTool({ name: "evo_call", arguments: { method: "GET", path: "/api/v1/prospects" } });
assert.equal(noCreds.isError, true);
assert.match(noCreds.content[0].text, /Nenhuma unidade configurada/);

const unknown = await client.callTool({ name: "evo_call", arguments: { method: "GET", path: "/api/v1/nao-existe" } });
assert.equal(unknown.isError, true);

const noUnits = await client.callTool({ name: "evo_list_units", arguments: {} });
assert.equal(noUnits.isError, true);
await client.close();

// quatro unidades configuradas
const multi = await connect({
  EVO_UNIT_UMI_USER: "u1", EVO_UNIT_UMI_KEY: "k1", EVO_UNIT_UMP_USER: "u2", EVO_UNIT_UMP_KEY: "k2",
  EVO_UNIT_UCB_USER: "u3", EVO_UNIT_UCB_KEY: "k3", EVO_UNIT_UP_USER: "u4", EVO_UNIT_UP_KEY: "k4",
  EVO_ALLOW_WRITES: "1",
});
const lu = JSON.parse((await multi.callTool({ name: "evo_list_units", arguments: {} })).content[0].text);
assert.deepEqual(lu.unidades.sort(), ["UCB", "UMI", "UMP", "UP"]);
assert.ok(!JSON.stringify(lu).includes("k1"), "não pode vazar chave");

const noUnit = await multi.callTool({ name: "evo_call", arguments: { method: "GET", path: "/api/v1/prospects" } });
assert.equal(noUnit.isError, true);
assert.match(noUnit.content[0].text, /Informe 'unit'/);

const badUnit = await multi.callTool({ name: "evo_call", arguments: { unit: "zzz", method: "GET", path: "/api/v1/prospects" } });
assert.match(badUnit.content[0].text, /desconhecida/);

const allWrite = await multi.callTool({ name: "evo_call", arguments: { unit: "todas", method: "POST", path: "/api/v1/prospects", body: {}, confirm: "EXECUTAR POST /api/v1/prospects" } });
assert.equal(allWrite.isError, true);
assert.match(allWrite.content[0].text, /só vale para GET/);
await multi.close();
console.log("servidor MCP: ok");
