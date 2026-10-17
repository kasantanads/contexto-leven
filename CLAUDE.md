# Leven: Jornada do Aluno (EVO ↔ Leven)

Projeto de duas pessoas, cada uma com a sua conta Claude. **Leia este arquivo e `docs/00-como-colaborar.md` antes de qualquer coisa.**

## Objetivo
Fazer o sistema de treino **Leven** (app no Lovable, workspace "Sistema Treinos", projeto "Leven Treinos") cobrir a **jornada do aluno** do mapa mental do Miro ("Sistema Treino"), a partir dos dados do **EVO** (sistema de gestão das academias, API da W12).

A jornada começa no **Agendamento da AT (aula teste)** e segue: aula experimental → fechamento do plano → 1ª aula → aulas → régua de contato → novo ciclo de treino.

## Onde está cada coisa
| O quê | Onde |
|---|---|
| Como trabalhar em dupla (regras, dono de tarefa, diário) | `docs/00-como-colaborar.md` |
| Quadro de tarefas e quem está em cada uma | `docs/QUADRO.md` |
| Diário (append-only, o que cada um fez e descobriu) | `docs/DIARIO.md` |
| Etapas do Miro × estado atual do Leven × lacunas × fases | `docs/01-jornada-do-aluno.md` |
| API do EVO: endpoints, limites, ids, significado dos status | `docs/02-evo-api.md` |
| Definições de negócio (fixo, agregador, AT, prospect…) | `docs/03-regras-de-negocio.md` |
| Bugs e achados, com evidência e data | `docs/04-achados-e-bugs.md` |
| Decisões tomadas e pendentes | `docs/05-decisoes.md` |
| Rascunho da especificação da Fase 1 | `docs/06-fase-1-especificacao.md` |
| Conector MCP do EVO (código) | `evo-mcp/` (veja `evo-mcp/README.md`) |

## Regras que valem sempre
1. **Nenhum segredo no repositório nem no chat.** As chaves do EVO ficam só no `evo-mcp/.env` de cada pessoa (ignorado pelo git). Se uma chave vazar, gere outra.
2. **Dados pessoais de alunos nunca entram nos arquivos.** Só ids, contagens, regras e exemplos mascarados.
3. **EVO: leitura por padrão.** Escrita no EVO só com decisão registrada em `docs/05-decisoes.md` e confirmação da pessoa. Movimentação de dinheiro o conector bloqueia.
4. **Lovable: um de cada vez, e só com OK explícito.** Antes de mandar mensagem ao agente do Lovable, confira `last_edited_at` do projeto e registre o envio no diário.
5. **Fato verificado é diferente de hipótese.** Marque `[V]` (verificado, com data e como) e `[H]` (hipótese). Não misture.
6. **Limite do EVO: 40 requisições por minuto por chave.** Se as duas pessoas usam a mesma chave, o limite é dividido. Avise no diário antes de varreduras grandes.

## Glossário
- **AT**: aula teste. É um prospect com um serviço "Aula Teste" inscrito numa aula comum da grade.
- **Prospect / OP (oportunidade)**: cadastro no EVO de quem ainda não é cliente. Não tem plano.
- **Membro**: cliente cadastrado no EVO (`idMember`). Pode estar ativo ou inativo.
- **Fixo**: membro com plano vigente.
- **Agregador**: sem plano vigente, com check-in em Totalpass ou Wellhub.
- **Permuta**: plano de categoria VIP com "Permuta" no nome. Conta como plano vigente.
- **UMI / UP / UCB / UMP**: as quatro unidades (filiais 1, 2, 3 e 4). Veja `docs/02-evo-api.md`.
- **Régua de contato**: no Miro, o acompanhamento periódico do aluno (conceito a confirmar, veja `docs/05-decisoes.md`).

## Estado atual
Fase 0 (entender o EVO) concluída. Próximo: fechar as decisões pendentes e escrever a Fase 1. Veja `docs/QUADRO.md`.
