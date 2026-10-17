# Rascunho da mensagem 2 ao Lovable: botão e telas das aulas teste (NÃO ENVIADA)

Modo: plano (sem alterar código). Só enviar com OK explícito, depois de conferir `last_edited_at` do projeto, e registrar o envio no diário.

Base: mensagem 1 já implementada (commit `63e0910` e correção `6292c4a`). Colunas `students.lifecycle_stage`, `evo_prospect_id`, `lead_channel`, `lead_signup_type`, `student_sessions.evo_attendance`, `evo_finalized`, `type='experimental'` e a função `evo-sync-prospects` já existem.

---

As aulas teste (AT) do EVO já têm banco e função de sincronização (`evo-sync-prospects`). Agora quero o **botão para rodar o teste e as telas**. **Responda primeiro com um plano, sem alterar código.** No plano, liste cada arquivo que seria alterado.

**Regras gerais**
- Não crie tabelas nem colunas novas, e não mexa em `evo-sync`, `evo-sync-schedules`, `evo-sync-employees` nem `evo-sync-prospects`.
- Não crie arquivos nem dependências do Drizzle; o banco não muda nesta etapa.
- Não sobrescreva `.lovable/plan.md`: acrescente ao final.
- Não imprima dados pessoais em logs.
- Prospects têm `students.lifecycle_stage = 'prospect'` e `active = false`. Sessões de AT têm `student_sessions.type = 'experimental'`.

**1. Botão (Admin → Integrações → EVO)**
- Novo cartão "Sincronização de Aulas Teste", seguindo o padrão visual e de código de `EvoScheduleSyncCard`.
- Seletor de mês (padrão: mês atual). Para o mês escolhido M, chamar `evo-sync-prospects` **uma unidade por vez**, em sequência, com `registered_from` = primeiro dia do mês anterior a M, `registered_to` = último dia de M, `sessions_from` = primeiro dia de M, `sessions_to` = último dia de M.
- Mostrar progresso por unidade, o tempo gasto por unidade e, no fim, a soma e o detalhe por unidade das contagens que a função devolve (`prospects_read`, `trial_prospects`, `students_created`, `students_updated`, `sessions_created`, `sessions_updated`, `sessions_skipped`, `error_count` e `errors`). Se uma unidade passar de 100 s, avisar que pode ter estourado o limite da função.
- Não rodar sozinho: só ao clicar.

**2. Aba "Aulas teste" para coordenador e supervisor**
- Nas páginas `coordenador/Alunos` e `supervisor/Alunos`, acrescentar abas "Alunos" (como hoje) e "Aulas teste". Um componente compartilhado.
- Aba "Aulas teste": lista somente leitura de `student_sessions` com `type = 'experimental'`, filtro de unidades (o mesmo `UnitMultiSelect`), seletor de mês (padrão: mês atual) e filtro de situação. Ordenar por data e hora. Paginação como nas outras listas.
- Colunas: data e hora; nome; unidade; modalidade; professor; situação; canal (`lead_channel`); tipo de cadastro (`lead_signup_type`); data de cadastro (`evo_registered_at`); converteu (Sim se `lifecycle_stage = 'member'`, senão Não).
- Situação: `evo_finalized` não verdadeiro → "Agendada"; finalizada e `evo_attendance = 'present'` → "Compareceu"; `absent` → "Faltou"; `justified` → "Falta justificada".
- Clicar na linha abre a ficha do prospect (a mesma rota de ficha de aluno do perfil).

**3. Agenda**
- No tipo do evento da Agenda, aceitar `type: "experimental"`. Sessões de AT aparecem com o selo "Aula teste" (cor própria, como o "Reposição" tem), mostrando nome, modalidade, horário, professor e situação.
- Para AT, **não oferecer** iniciar treino, remarcar, marcar falta nem criar reposição: só visualizar. Também não marcar como "Pendente" uma AT passada.

**4. Ficha do prospect (`StudentDetail`)**
- Se `lifecycle_stage = 'prospect'`: no lugar do selo "Ativo/Inativo", mostrar "Prospect"; mostrar canal e tipo de cadastro; esconder a aba "Jornada" e os cartões de treino, avaliação e relacionamento; e listar as aulas teste da pessoa (data, modalidade, professor, situação).

**5. Prospects e AT fora de listas, contagens e indicadores**
- Procure todas as consultas a `students` e `student_sessions` no front e nas funções (`evaluate-rules`, `gamify-calculate`, `enroll-playbook`) e **liste no plano** cada uma, com a decisão.
- Listas e contagens de alunos (incluindo o interruptor "Inativos" de `coordenador/Alunos` e `supervisor/Alunos`, e listas do admin): excluir `lifecycle_stage = 'prospect'`.
- Todo cálculo de dashboard e de reposição sobre sessões (por exemplo `useCoordinatorDashboard`, `useSupervisorDashboard`, `useTeacherDashboardV2`, `usePendingSessions`, a lista de reposições pendentes da Agenda): excluir `type = 'experimental'`. Eles contam sessões do dia, presença, ocupação e faltas, e AT não pode inflar nem distorcer esses números nem entrar como reposição.
- Não excluir `experimental` na Agenda (calendário) nem na nova aba.
- Prospects não entram em régua, score de jornada nem pontuação de professor.

**6. Testes**
Testes de unidade para: situação da AT a partir de `evo_finalized` e `evo_attendance`; filtro que exclui `experimental` dos cálculos; e filtro que exclui `prospect` das listas.

Mostre o plano e a lista de arquivos, e não implemente ainda.
