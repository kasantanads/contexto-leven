# Como colaborar (duas pessoas, duas contas Claude)

Objetivo: cada pessoa trabalha com o seu Claude, sem se atropelar e sem perder o que a outra descobriu.

## Ao começar uma sessão
1. O Claude lê `CLAUDE.md` (automático), `docs/QUADRO.md` e as **últimas 10 entradas** de `docs/DIARIO.md`.
2. Peça: "o que mudou desde a minha última sessão?". O diário responde.

## Regras
1. **Um dono por tarefa.** Antes de mexer, escreva seu nome na linha da tarefa no `QUADRO.md` e mude o status para "em andamento". Se a tarefa já tem dono, combine antes.
2. **Um assunto por arquivo, e cada um edita o que é seu.** Se precisar mudar um arquivo da outra pessoa, registre no diário o motivo.
3. **`DIARIO.md` é só de acrescentar.** Nunca apague nem reescreva entradas de outra pessoa. Entradas novas vão no **topo**.
4. **Decisões ficam em `05-decisoes.md`**, com data e quem decidiu. Não reabra uma decisão sem evidência nova.
5. **Marque fatos:** `[V]` verificado (diga como e quando) e `[H]` hipótese. Quando uma hipótese for confirmada, troque a marca e anote no diário.
6. **Datar números.** "904 ativos (16/10/2026)", nunca só "904 ativos".
7. **Segredos e dados pessoais:** nunca nos arquivos, no diário nem no chat. Veja `CLAUDE.md`.

## EVO
- Cada pessoa tem o **seu** `evo-mcp/.env`. O código do conector é compartilhado, as chaves não.
- Se as duas usarem a mesma chave, o limite de 40 requisições por minuto é dividido. **Avise no diário antes de varreduras grandes** (mais de umas 100 chamadas).
- Leitura é o padrão. Escrita no EVO exige decisão registrada.

## Lovable (projeto "Leven Treinos", workspace "Sistema Treinos")
- O projeto aceita edição de qualquer membro do workspace. **Só uma pessoa edita por vez.**
- Antes de enviar algo ao agente do Lovable: `get_project` e veja `last_edited_at`. Se foi editado há pouco, pergunte à outra pessoa.
- Registre no diário cada mensagem enviada ao Lovable, com a tag `[LOVABLE]`, o resumo do pedido e o resultado.
- Mensagens ao agente consomem créditos do workspace. Use plan mode antes de pedir código.
- Mudanças de banco (migrations) e de regra de negócio passam por `05-decisoes.md` primeiro.

## Git (se este repositório estiver no GitHub)
- Uma branch por pessoa e por tarefa (`nome/assunto`). Mudanças pequenas e frequentes.
- Não faça commit de `.env`, `node_modules` nem `audit.log` (o `.gitignore` já cobre).
- Conflito em `DIARIO.md`: mantenha as duas entradas, a mais nova em cima.

## Modelo de entrada no diário
```
## AAAA-MM-DD HH:MM — <nome> — <assunto curto>
- O que fiz / descobri:
- Evidência (endpoint, consulta, arquivo):
- Efeito em outros arquivos:
- Pendências para a outra pessoa:
```

## Modelo de passagem de bastão
Ao parar no meio de uma tarefa, escreva no diário: o que está feito, o que falta, onde estão os arquivos, e o que **não** funcionou.
