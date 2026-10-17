# Achados e bugs (com evidência)

Cada item: o que é, evidência, data, como foi verificado. `[V]` verificado, `[H]` hipótese. Números datados de 16/10/2026 salvo indicação.

## A1. Presença do EVO é gravada como falta no Leven [V no efeito, H na causa]
- **Efeito:** sessões vindas do EVO em março/2026 no Leven: `scheduled` 1.242, `no_show` 1.065, `absent` 232, `done` 169 (só 6% "done"). Consulta agregada ao banco do Leven. [V]
- **Causa provável:** `evo-sync-schedules` trata `status 0` como "agendado" e, em horário finalizado, converte em `no_show`; espera status 3 e 4 como "done", que **não existem** (o enum só tem 0, 1 e 2). Mas no EVO `status 0` = **Presente**. [V na API, H no mecanismo exato]
- **Agregadores:** em 15/10 na UCB, as 70 inscrições de agregadores estavam todas com status 0 (Presente).
- **Correção proposta:** usar `presenca` / `falta` / `faltaJustificada` e `isFinalized` de `member/sessions`.
- **Impacto:** comparecimento, "faltas consecutivas", score de risco, rankings.
- **Confirmado em 22/10/2026 [V] com um caso real (aluno da UCB, aula de 05/10 06:00, sessão `1012401`):** o EVO devolve `statusID 0 / Presente / presenca true / isFinalized true`; o Leven gravou `no_show` ("Falta" na tela). Em `evo-sync-schedules`, `enrollment.status` 0 vira `scheduled`, e como o horário está `finalized` vira `no_show`; falta (1) também vira `no_show`; só 2 (justificada) vira `absent`; os valores 3 e 4, que viram `done`, não existem. Resultado: **presença nunca vira `done`**. Banco em 22/10/2026: sessões do EVO (sem AT) em outubro até agora: `no_show` 678, `absent` 216, `scheduled` 169, **`done` 0** (de 1.063); no total geral: `no_show` 1.743, `absent` 471, `done` 172, `scheduled` 1.495. O número de eventos críticos "Não compareceu" na jornada é **1.743**, igual ao de `no_show`.
- **Segundo defeito no mesmo caso [V]:** duas sessões do Leven (01/10 e 03/10) não existem mais na lista do EVO para esse aluno (inscrição retirada); o sync nunca cancela nem remove sessão que sumiu, e 'removed' é só ignorado, então o Leven fica com o status antigo (a de 01/10 continua `scheduled` no passado).

- **Atualização (22/10/2026, 23:37 UTC):** o mapeamento foi **corrigido no código** por outra pessoa (commit `22eed9a`, `supabase/functions/evo-sync-schedules/mapping.ts`): presença (0) com aula finalizada vira `done`, sem finalização vira `scheduled`; falta (1) vira `absent`; falta justificada (2) vira `canceled`; inscrição removida ou suspensa preserva a situação anterior; `evo_attendance` e `evo_finalized` passam a ser gravados. Os registros antigos só mudam com **nova sincronização** (parcial em 23/10 00:05 UTC: outubro passado com `done` 296, `no_show` 639). Os **1.743 eventos críticos** antigos continuam na jornada.

## A15. Aulas só com falta justificada não entram na sincronização [V no código e em um caso, 22/10/2026]
- `evo-sync-schedules` só lê o detalhe de horários com `ocupation > 0`. Uma falta justificada **libera a vaga** (`ocupation` 0): num horário da UCB (22/10 06:00, Michele Fernandes, capacidade 1, ocupação 0, 1 inscrição justificada) a sessão **não existe no Leven**.

- **Alcance medido [V, UCB em 22/10/2026]:** de 142 horários, 16 têm `ocupation` 0 e **9 deles têm inscrição** (8 falta justificada e 1 falta): 9 de 205 inscrições do dia (4%) ficam fora da sincronização. No payload do dia, o campo `justifiedAbsence` vem `false` mesmo com `status` 2, e `replacement` vem `false` em todas (o `member/sessions` marca reposição por conta própria): a justificada só se reconhece pelo `status` 2.

## A16. Agregadores e professores fora do Leven deixam a agenda incompleta [V, 22/10/2026]
- `evo-sync` importa só membros ativos. Agregador sem contrato é membro **inativo** (ex.: membro 21923 da UCB: `Inactive`, `gympassId` preenchido, 0 contratos): a inscrição dele na grade é descartada (`memberToStudent` não o encontra). No horário de 22/10 06:00 da UCB, o horário do instrutor Davi Fiuza Rosado (1 inscrito, agregador) **não aparece no Leven**.
- **Confirmação com o mesmo membro 21923 (UCB) [V, 22/10/2026]:** `Inactive`, 0 contratos, `gympassId` preenchido, cadastro em 26/09; **7 agendamentos** de 28/09 a 22/10, todos com status 0, e **7 check-ins Wellhub `Validated`** nos mesmos 7 dias (um por aula, entre ~06:00 e ~06:53). Ou seja: "inativo" no EVO significa só **sem contrato vigente**; o agregador reserva e treina normalmente.
- Instrutores que não são importados como professor (UCB: Veronica Costa e Adriano Oliveira) deixam as sessões **sem professor** (3 de 9 nesse horário).
- Pior caso para a Agenda: o Leven mostra 9 de 11 inscrições nesse horário (82%).

## A17. O resolvedor de alunos agendados lê o endpoint de detalhe e perde o código de agregador [V, 23/10/2026, 1 requisição]
- `evo-sync-schedules/students.ts` busca o membro faltante em `GET /api/v2/members/{idMember}`. Para o membro 21923 (agregador, UCB) o detalhe devolve `membershipStatus: "Inactive"` (a situação do contrato vem certa), mas **não traz `gympassId`, `codeTotalpass` nem `status`**, e `document` vem vazio.
- **Efeito:** aluno agregador criado por esse caminho fica sem `person_key` (sem CPF e sem código), sem o código de agregador em `evo_data` (nem para o `plan_type` Wellhub ou Totalpass) e sem como casar com o mesmo agregador em outra unidade.
- **Correção proposta:** trocar a consulta por `GET /api/v2/members?idsMembers={id}` (lista, mesmo custo: 1 chamada por membro faltante), que traz `status`, `gympassId` e `codeTotalpass`. Já estava registrado em `02-evo-api.md` (21/10) que o detalhe não serve para classificar.
- **Corrigido no código (23/10/2026, commit `14c6b2c`, testes relatados 86 de 86, deploy só de `evo-sync-schedules`).** Alunos já criados pelo detalhe (~35 em 23/10) seguem sem o código e entram na carga.

## A18. Aula futura marcada como `done` porque o EVO a devolve como finalizada [V, 24/10/2026]
- O EVO devolve `isFinalized: true` (e `statusName: "Finalized"`) para **algumas aulas de amanhã** (em 22/10 à noite, o dia 23/10 tinha 6 horários `Finalized`, todos nas primeiras horas). O mapeamento do Leven (presença + finalizada = `done`, nas duas sincronizações) grava `done` **antes de a aula acontecer**.
- **Medido no banco:** 4 sessões `done` com data futura (1 aula teste, 3 regulares), todas de 24/10. Caso: a AT de 24/10 às 12:00 do prospect 59312 (UCB) está `done` e `evo_finalized true` no Leven; consultada no EVO em 23/10 à noite, a mesma aula está **não finalizada**.
- **Correção proposta:** só gravar `done` quando o **fim da aula já passou** (`scheduled_at` mais a duração menor ou igual a agora), em `mapEvoScheduleStatus` e em `mapSessionStatus`; antes disso, `scheduled`. Combina com a regra de conclusão automática por horário.

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

## A11. O banco rejeita parte do que o EVO tem [V no código das funções, 21/10/2026]
- `validate_student_session` só aceita `type` em `regular`, `makeup` e `reschedule`: **`experimental` (AT) é rejeitado**.
- Recusa uma sessão cujo professor já tenha outra sessão sobreposta (status `scheduled`, `in_progress` ou `done`), **de qualquer aluno**. Aula em grupo (Pilates) tem vários alunos no mesmo horário e professor: do 2º em diante a inserção falha. Isso ajuda a explicar a pouca presença de Pilates e os erros do sync.
- `status` só aceita `scheduled`, `in_progress`, `done`, `absent`, `canceled` e `no_show`: **falta justificada não tem valor próprio**.

## A12. Cada mudança de status gera um evento na jornada [V no código]
- `create_journey_event_on_session_status`: `done` vira "Treino concluído" (info); `absent`, "Falta registrada" (warn); `canceled`, "Sessão cancelada" (warn); `no_show`, "Não compareceu" (**critical**). Com o erro A1, o EVO produz milhares de eventos críticos falsos. Uma carga histórica de ~100 mil sessões criaria ~100 mil eventos.
- `validate_journey_event` só aceita `event_type` em `session`, `absence`, `assessment`, `alert`, `plan`, `relationship` e `system`.
- `validate_assignment_with_teacher_schedule` recusa vínculo aluno-professor com dia e hora que não caibam na escala do professor (sem dia e hora, não valida).

## A13. Estado dos dados do Leven (21/10/2026) [V, contagens]
- `students`: 7.200. Com telefone: **2**. E-mail 6.631 (92%), CPF 6.835 (95%), nascimento 6.970 (97%), modalidade 7, `plan_type` 2, login 0.
- `student_teacher_assignments`: 7 vínculos (5 alunos). `student_training_slots`: 37 (6 alunos). O professor responsável está praticamente vazio.
- `teachers`: 242. `users` com `evo_employee_id`: 237 de 247 (dá para ligar o instrutor do EVO ao professor pelo id).
- `units.evo_branch_id` está vazio nas 4 unidades.
- 372 sessões do EVO sem professor.
- O índice único de `students.evo_member_id` é **global** (não por unidade).

## A14. "Plano" no Leven é o plano de treino, não o plano comercial [V, 21/10/2026]
- **Não existe coluna do plano comercial do aluno** (nome, início, fim, frequência). Só `students.plan_type` (classe), preenchida em 2 de 7.200.
- `training_plans` é a prescrição de treino: **7 linhas, 1 ativa, 3 alunos**. Tem `plan_origin_item_id` e datas, mas é outra coisa.
- `gamify-calculate` dá pontos só a alunos com **plano de treino ativo** (`training_plans.active`): hoje isso é **1 aluno**, então a pontuação dos professores quase não anda. A regra `plan_expiring` do score também lê `training_plans.end_date`, e não o fim do plano comercial.
- **Correção proposta:** o plano comercial vigente vem do EVO (`students.plan_type`, `plan_end_date`, resumo em `evo_data`), e as regras de gamificação e de score passam a usá-lo.
