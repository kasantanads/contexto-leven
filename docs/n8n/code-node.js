// Nó "Code" do n8n (modo: Run Once for All Items).
// Guarda SÓ ids, o tipo do evento e os NOMES dos campos recebidos. Nenhum valor pessoal passa adiante.
const item = $input.first().json;
const body = item.body ?? {};
const byBranch = { 1: 'UMI', 2: 'UP', 3: 'UCB', 4: 'UMP' };

const unit = String(item.query?.unit || byBranch[body.idBranch] || '').toUpperCase();
const eventType = body.eventType ?? body.event ?? body.type ?? null;

// Coleta campos de id (começam com "id" + letra maiúscula: idMember, idProspect...) até 3 níveis
const ids = {};
function walk(obj, depth = 0, prefix = '') {
  if (!obj || typeof obj !== 'object' || depth > 3) return;
  for (const [k, v] of Object.entries(obj)) {
    if (/^id[A-Z]/.test(k) && (typeof v === 'number' || typeof v === 'string')) {
      ids[prefix + k] = v;
    } else if (Array.isArray(v)) {
      v.slice(0, 5).forEach((x, i) => walk(x, depth + 1, `${prefix}${k}[${i}].`));
    } else if (v && typeof v === 'object') {
      walk(v, depth + 1, `${prefix}${k}.`);
    }
  }
}
walk(body);

if (!unit) {
  throw new Error('Unidade não identificada: use ?unit=UMI|UP|UCB|UMP na URL ou envie idBranch');
}

return [{
  json: {
    unit,
    event_type: eventType,
    ids,
    field_names: Object.keys(body).slice(0, 40), // só os nomes dos campos, para descobrirmos o formato do EVO
    received_at: new Date().toISOString(),
  },
}];
