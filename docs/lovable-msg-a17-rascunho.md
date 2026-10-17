# Rascunho da mensagem ao Lovable: corrigir a consulta do resolvedor de alunos agendados (A17) (NÃO ENVIADA)

Modo: implementação direta (correção pequena, de uma função). Só enviar com OK explícito, depois de conferir `list_edits` (conferido em 23/10: último commit `1d2050b`, sem edições novas) e registrar o envio no diário.

---

Correção pequena em `supabase/functions/evo-sync-schedules/students.ts` (resolvedor de alunos agendados).

**Problema (verificado numa resposta real do EVO).** O resolvedor busca o membro faltante em `GET /api/v2/members/{idMember}` (endpoint de detalhe). Para um membro agregador inativo, esse detalhe devolve `membershipStatus: "Inactive"` mas **não traz `gympassId`, `codeTotalpass` nem `status`**, e `document` vem vazio. Resultado: o aluno é criado sem o código de agregador em `evo_data` e com `person_key` nulo. O endpoint de lista `GET /api/v2/members?idsMembers=ID` traz esses campos.

**Mudança**
1. Trocar a consulta por `GET {evoUrl}/api/v2/members?idsMembers={memberId}` (com `encodeURIComponent`), pela **mesma fila de requisições**, com as **mesmas 3 tentativas**. Uma chamada por membro faltante, como hoje. **Não** usar `showMemberships`.
2. A resposta é uma **lista**. Escolher o elemento cujo `idMember` (como texto) seja igual a `memberId`. Se a lista vier vazia ou sem esse elemento, falhar como hoje falha uma consulta ruim (mensagem curta, sem dados pessoais) e marcar a chave como falha na etapa. Passar o elemento escolhido para `scheduledMemberRecord`.
3. **Tudo o mais fica igual:** `scheduledMemberRecord` (inclusive a regra de `active` e o `person_key` só no insert), cache por unidade, conjunto de falhas, tratamento de corrida no insert e a busca prévia do aluno existente.

**Testes** (`src/test/evoScheduledStudents.test.ts`)
- Ajustar os mocks do resolvedor para devolver uma **lista** com o membro (formato do endpoint de lista) e conferir que a URL pedida contém `/api/v2/members?idsMembers=21923`.
- Novo teste: membro com `gympassId` e `document` vazio → o registro inserido tem `person_key` igual a `agg:wellhub:CODIGO`.
- Novo teste: lista vazia ou sem o `idMember` pedido → o resolvedor falha e não insere.
- Os testes atuais continuam passando (status inativo preservado, cache da unidade, não reutilizar identidade de outra unidade).

**Combinados**
- Não altere nenhuma outra função, tela, tabela ou coluna. Não altere linhas existentes de `students` (as ~35 criadas hoje pelo detalhe ficam como estão; serão tratadas na carga).
- **Não execute nenhuma sincronização com o EVO.** Só testes unitários.
- Deploy apenas de `evo-sync-schedules`. Releia o código atual antes de editar (outras pessoas editam esse arquivo).
- Não sobrescreva `.lovable/plan.md`. Sem CPF nem códigos de agregador nos logs.
- Ao terminar, liste os arquivos alterados e o total de testes da suíte inteira (passados e falhos).
