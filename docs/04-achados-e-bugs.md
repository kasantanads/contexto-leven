# Achados e bugs (com evidência)

Cada item: o que é, evidência, data, como foi verificado. `[V]` verificado, `[H]` hipótese. Números datados de 16/10/2026 salvo indicação.

## A1. Presença do EVO é gravada como falta no Leven [V no efeito, H na causa]
- **Efeito:** sessões vindas do EVO em março/2026 no Leven: `scheduled` 1.242, `no_show` 1.065, `absent` 232, `done` 169 (só 6% "done"). Consulta agregada ao banco do Leven. [V]
- **Causa provável:** `evo-sync-schedules` trata `status 0` como "agendado" e, em horário finalizado, converte em `no_show`; espera status 3 e 4 como "done", que **não existem** (o enum só tem 0, 1 e 2). Mas no EVO `status 0` = **Presente**. [V na API, H no mecanismo exato]
- **Agregadores:** em 15/10 na UCB, as 70 inscrições de agregadores estavam todas com status 0 (Presente).
- **Correção proposta:** usar `presenca` / `falta` / `faltaJustificada` e `isFinalized` de `member/sessions`.
- **Impacto:** comparecimento, "faltas consecutivas", score de risco, rankings.

## A2. "Alunos ativos" do Leven estão inflados [V]
| Unidade | Ativos no Leven | Ativos no EVO |
|---|---|---|
| UCB | 1.569 | 183 |
| UMI | 1.310 (de 1.727) | 191 |
| UMP | 2.412 | 239 |
| UP | 1.340 | 291 |
| **Total** | **6.631** | **904** |
- Só na UCB, o EVO tem 3.954 cadastros: 183 ativos e 3.771 inativos.
- **Causa provável [H]:** o `evo-sync` insere e atualiza, mas nunca desativa quem saiu da lista de ativos.
- **Correção proposta:** a fonte de "ativo" é plano vigente no EVO, atualizada a cada sincronização, desativando quem não voltou.

## A3. A AT nunca entra no Leven [V]
- `evo-sync` importa só membros com `status=1`. `evo-sync-schedules` ignora inscrições sem `idMember` (a AT tem `idProspect`).

## A4. Quase não há sessões do EVO no Leven [V]
- Sessões com `evo_schedule_id`: 2.710, quase todas de **março/2026**. A última sessão no banco é de 21/08/2026. Os dashboards baseados em sessões estão praticamente vazios para os meses recentes.

## A5. Sincronização horário a horário é inviável [V]
- Limite de 40 req/min por chave. Um mês de uma unidade seriam ~3.300 chamadas de detalhe (mais de 80 minutos). Precisa ser incremental (prospects por data de cadastro, sessões por pessoa, membros por data de atualização).

## A6. "Dias sem treinar" usa duas fontes [V no código]
- O score da jornada usa `workout_sessions` (aula iniciada no app). Os dashboards usam `student_sessions` (também preenchida pelo EVO). Quem treinou e o professor não iniciou a aula no app aparece inativo no score e ativo no dashboard.

## A7. Score da jornada calculado no navegador [H]
- Só grava no aluno quando alguém clica em "Recalcular". Os dashboards leem o valor gravado, que pode estar velho. Não verificamos se a função `evaluate-rules` recalcula em lote.

## A8. Régua de contato [V no código]
- `enroll-playbook` inscreve **todos** os alunos ativos que batem com o critério, com início **hoje**, e só admin/supervisor pode chamar. Não há inscrição automática de aluno novo.

## A9. Mapeamento de modalidade por atividade [V]
- Os ids de atividade do EVO mudam por unidade (Personal: 1, 21…). O mapeamento atividade→modalidade do Leven precisa ser por unidade.

## A10. Qualidade da origem do prospect [V]
- "Não identificado" em ~16% dos prospects, grafias diferentes do mesmo canal, listas de canais diferentes por unidade.
