# Rascunho da mensagem ao Lovable: status exibido das aulas (NÃO ENVIADA)

Modo: **plano primeiro**. Enviar só depois que o agente terminar a paleta B (commit pendente após `f7fa11d`), com OK explícito, conferindo `list_edits`. Regra de origem: `docs/05-decisoes.md`, D2.2. A cor de "Concluída" vem da paleta B (contorno verde).

---

Vamos corrigir o **status exibido** das aulas na Agenda, no painel do professor, no cartão "Próxima sessão" e nos selos. **Responda primeiro com um plano, sem alterar código.** Liste arquivos, riscos e perguntas.

## Regra (calculada na tela, **sem gravar nada no banco**)
1. **"Em andamento"** só para aula **iniciada pelo Leven** (AT: `trial_started_at`; aula comum: o registro de início que o Leven já grava, diga qual) e ainda não finalizada. Nunca por relógio e nunca vindo da sincronização com o EVO.
2. Aula sem início, **antes do horário de término**: **"Agendada"**. Em nenhum lugar deve aparecer como "pendente".
3. Aula **comum** sem início, **depois do horário de término**, e sem falta ou cancelamento gravados: **"Concluída"**, com o mesmo estilo de "Realizado". O rótulo "Realizado" passa a "Concluída" em todo o Leven.
4. **AT (aula teste)** sem início depois do fim continua **"Sem registro"** (regra D2.1). Não vira "Concluída".
5. O que está gravado (realizado, faltou, cancelada, falta justificada) **sempre prevalece** sobre o cálculo.
6. Uma função pura e testada (por exemplo em `sessionStatusColors.ts` ou novo `sessionDisplayStatus.ts`) decide o status exibido, e **todas** as telas usam essa função. Fuso America/Sao_Paulo; término = `scheduled_at + duration_minutes` (padrão 60 se vazio).

## Perguntas que quero ver no plano
- Aula **iniciada pelo Leven e ainda não finalizada depois do fim**: proposta é continuar "Em andamento" até alguém finalizar. Alguma objeção?
- Onde hoje aparece "pendente" ou "em andamento" calculado por relógio? Liste cada lugar.
- Algum relatório, contagem, filtro ou a gamificação diária lê o status exibido? (Não pode mudar.)

## Combinados
- Só front, **sem banco, funções, sync, EVO ou e-mail. Não publicar.** Nada de `UPDATE` em `student_sessions`.
- Não sobrescreva `.lovable/plan.md`: acrescente ao final. Releia o código atual antes de editar. Registre no `CHANGELOG.md` no mesmo commit.
- Testes: virada no horário de término, fuso, duração vazia, AT versus aula comum, gravado prevalece. Informe o total da suíte inteira.
