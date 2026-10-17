# Rascunho da mensagem 1 ao Lovable: banco e função das aulas teste (NÃO ENVIADA)

Modo: plano (sem alterar código). Só enviar com OK explícito, depois de conferir `last_edited_at` do projeto, e registrar o envio no diário.

---

Quero trazer as **aulas teste (AT) do EVO** para o Leven, como teste só do mês de outubro/2026. Nesta mensagem: **banco e função de sincronização**. As telas virão numa mensagem separada. **Responda primeiro com um plano, sem alterar código.**

**Regras gerais**
- Não crie tabelas novas. Só colunas.
- Não mexa em nenhum dado existente. Os 7.200 alunos atuais continuam como estão.
- Não crie arquivos nem dependências do Drizzle. Use apenas migração do Supabase.
- Não sobrescreva `.lovable/plan.md`: se precisar registrar o plano, acrescente ao final.
- Não imprima dados pessoais nos logs.

**1. Colunas novas**
- `students`: `lifecycle_stage text not null default 'member'` (prospect = `'prospect'`), `evo_prospect_id text null`, `lead_channel text null`, `lead_signup_type text null`. Índice único em (`primary_unit_id`, `evo_prospect_id`) onde `evo_prospect_id` não é nulo.
- `student_sessions`: `evo_attendance text null` (`present`, `absent` ou `justified`) e `evo_finalized boolean null`.

**2. Triggers**
- `validate_student_session`: aceitar `type = 'experimental'`. Para `experimental`, **não** aplicar a checagem de conflito de professor (aula em grupo tem vários alunos no mesmo horário).
- `create_journey_event_on_session_status`: não criar evento para sessões `experimental`.
- Tudo o mais continua igual.

**3. Nova função `evo-sync-prospects`**
- Só administrador pode chamar (mesma checagem das outras funções `evo-sync*`; exija o cabeçalho de autorização). Aceita `unit_id`, `registered_from` e `registered_to` (datas) e `sessions_from` e `sessions_to` (datas).
- Para a unidade pedida, com **1,7 s entre chamadas** e tratamento de 429 (aguardar e tentar de novo, no máximo 3 vezes):
  1. `GET /api/v1/prospects?registerDateStart=&registerDateEnd=&take=100&skip=` (paginar até vir menos de 100).
  2. Para cada prospect: `GET /api/v1/prospects/services?idProspect=`. É AT se o serviço tiver `nameService` começando com "Aula Teste" (PERSONAL ou PILATES). Ignore os demais prospects.
  3. Para cada AT: `GET /api/v2/activities/member/sessions?idProspect=&dateStart=&dateEnd=` com as datas de `sessions_*`.
- Gravação:
  - `students`: uma linha por prospect AT, com `origin='evo'`, `lifecycle_stage='prospect'`, `active=false`, `evo_prospect_id`, `primary_unit_id`, `name` (firstName + lastName), `email`, `cpf` (document), `phone` (cellphone, só dígitos), `birth_date`, `sex` (F→Feminino, M→Masculino), `evo_registered_at` (registerDate, interpretar como horário de Brasília), `lead_channel` (mktChannel), `lead_signup_type` (signupType) e `evo_data` com o JSON do prospect. **Não** preencher `evo_member_id`.
  - `student_sessions`: uma linha por sessão, `type='experimental'`, `evo_schedule_id = "{idActivitieSession}-p{idProspect}"`, `scheduled_at` (date + startTime, Brasília), `duration_minutes` (endTime − startTime, entre 15 e 240), `modality_value` (pelo mapeamento atividade→modalidade da unidade; senão pelo nome "pilates"/"personal"), `teacher_id` (pelo nome do `instructor`, como em `evo-sync-schedules`) e `unit_id`.
  - `evo_attendance`: `statusID` 0 → `present`, 1 → `absent`, 2 → `justified`. `evo_finalized` = `isFinalized`.
  - `status`: se não finalizada → `scheduled`; finalizada e presente → `done`; falta → `absent`; falta justificada → `canceled`.
- **Idempotente**: rodar de novo atualiza em vez de duplicar (prospect por `primary_unit_id` + `evo_prospect_id`; sessão por `evo_schedule_id`). Uma atualização **não pode apagar** com NULL um campo que já tinha valor.
- Resposta: só contagens (prospects lidos, ATs, linhas criadas e atualizadas, sessões, erros truncados). Nada de dados pessoais.
- Se uma chamada falhar, registre o erro e continue; não aborte tudo.

**4. Testes**
Testes unitários para o mapeamento de status, o formato do `evo_schedule_id` e a identificação de AT pelo nome do serviço.

Mostre o plano e o que seria alterado, e não implemente ainda.
