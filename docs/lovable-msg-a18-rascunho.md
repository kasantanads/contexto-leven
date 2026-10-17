# Rascunho da mensagem ao Lovable: só gravar `done` depois do fim da aula (A18) (NÃO ENVIADA)

Modo: implementação direta (correção pequena e delimitada). Só enviar com OK explícito, depois de conferir `list_edits` (conferido em 24/10: último commit `c603962`, sem edições novas) e registrar o envio no diário.

---

Correção em duas sincronizações: **só gravar `done` depois que o fim da aula já passou.**

**Problema (verificado no banco e no EVO).** O EVO devolve algumas **aulas de amanhã** como finalizadas (`statusName: "Finalized"`, `isFinalized: true`). Hoje presença + finalizada vira `done` na hora, então o Leven grava `done` antes da aula acontecer. No banco há **4 sessões `done` com data futura** (1 aula teste e 3 regulares, todas de 24/10); uma delas é a aula teste de 24/10 às 12:00 do prospect 59312, que no EVO está **não finalizada**.

**Mudança**
1. `supabase/functions/evo-sync-schedules/mapping.ts` (`mapEvoScheduleStatus`): receber o **fim da aula** (início mais duração, em ISO) e o **agora** (injetável para teste). Presença com aula finalizada só vira `done` se `fim <= agora`; antes disso, `scheduled`. **Continuar gravando `finalized` e `attendance` como o EVO devolve** (o dado bruto não muda). Falta (`absent`) e falta justificada (`canceled`) **não mudam**: seguem o EVO a qualquer hora. Atualizar o chamador em `evo-sync-schedules/index.ts` (ele já conhece `scheduled_at` e `duration_minutes`).
2. A aula teste: `mapSessionStatus` em `supabase/functions/_shared/trialMapping.ts` **e a cópia legada em `supabase/functions/evo-sync-prospects/mapping.ts`** (existe teste que confere que as duas são iguais; mantenha as duas iguais), com o mesmo critério. Atualizar o chamador em `_shared/trialSync.ts`.
3. **Reconciliação que impediria a correção.** Hoje `reconcileEvoStatus` (`_shared/trialRules.ts`) e o gatilho `reconcile_trial_evo_update` **preservam `done` quando o EVO manda `scheduled`**. Isso travaria a correção das 4 sessões. Ajuste os dois para preservar `done` **só se** houver treino ligado à sessão **ou** o fim da aula já passou; sem treino ligado e com a aula no futuro, o status volta para `scheduled`. Altere o gatilho com `CREATE OR REPLACE FUNCTION` numa migração nova, mantendo o resto do comportamento. **Não mexa na regra das observações nem em mais nada do gatilho.**
4. **Não faça `UPDATE` direto nas 4 sessões existentes.** Elas se corrigem sozinhas na próxima sincronização; diga no relatório que linhas serão corrigidas por ela.

**Testes**
- Presença finalizada com fim no futuro → `scheduled`; com fim no passado → `done`; justificada no futuro → `canceled`; falta no futuro → `absent` (sem mudança); `finalized` e `attendance` continuam como o EVO manda.
- Reconciliação: `done` sem treino ligado e aula futura + EVO `scheduled` → vira `scheduled`; `done` com treino ligado → preservado; `done` com aula já terminada → preservado.
- As cópias de `mapSessionStatus` continuam iguais.

**Combinados**
- Não altere nenhuma outra função, tela, tabela ou coluna. **Não execute nenhuma sincronização** nem chame o EVO. Não altere linhas existentes.
- Publique apenas as funções que importam os arquivos alterados (`evo-sync-schedules`, `evo-sync-prospects`, `evo-trial-incremental` e as demais que dependam de `_shared/trialMapping.ts` ou `_shared/trialRules.ts`) e liste quais foram.
- Releia o código atual antes de editar. Registre no `CHANGELOG.md` no mesmo commit (regra do `AGENTS.md`). Sem dados pessoais em logs; não sobrescreva `.lovable/plan.md`.
- Ao terminar, liste os arquivos alterados, o total de testes da suíte inteira (passados e falhos) e o que foi publicado.
