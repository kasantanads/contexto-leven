# PA-07: plano de mudança × estado atual do Leven (23/11/2026)

Fontes: planilha `Matriz Desenvolvimento PA07 Leven.xlsx` (8 abas), protótipo `Anamnese PA 07 - pergunta aberta + resumo professor.html` (abas Aluno, Professor e Desenvolvedor) e o código atual lido no Lovable (`_shared/preanamnesisV2.ts` e demais). Estado atual: `docs/07-pre-anamnese-mapa.md`. Marcas: `[V]` verificado hoje. Nenhum dado pessoal.

## 1. O que muda
| Item | Hoje | Plano PA-07 |
|---|---|---|
| Quando aparece | só se o aluno marcou **mais de 5** objetivos na PA-06 | **sempre que houver ao menos 1 objetivo** marcado |
| O que o aluno faz | escolhe **até 5**, sem ordem (`dyn`) | **classifica** de 1ª a 5ª prioridade, cada posição uma única vez; não precisa usar as 5 |
| Pergunta | "…quais seriam?" | "…quais seriam **em ordem de prioridade de 1 a 5**?" |
| Perguntas extras | nenhuma | **PA-07.02** (texto aberto: o que espera que melhore no dia a dia) e **PA-07.03** (prazo: 1 a 3, 3 a 6, 6 a 9, 9 a 12 meses), **obrigatórias só para 1ª, 2ª e 3ª**; 4ª e 5ª não mostram nada |
| Regras | filtra pelos objetivos marcados | desmarcar na PA-06 remove o objetivo e seus dados da PA-07; mudar a posição liga ou desliga os campos extras (regras 09 e 10 da matriz) |
| Dado gravado | `PA-07` = lista de textos | matriz: um item por objetivo com `objetivo`, `prioridade`, `importancia_dia_a_dia`, `prazo_desejado`; protótipo: lista ordenada em `PA-07` e mapa em `PA-07·detalhes` |
| Resumo do professor | linha "Objetivos prioritários" (lista; se ≤5 objetivos mostra todos na ordem da PA-06) | **tabela** Prioridade, Objetivo, Por que é importante, Prazo esperado; **cartões de direcionamento** para as 3 primeiras; lista de **outros objetivos** marcados e não classificados; nota "prazos são expectativas" |
| IA | PA-07 entra só como lista | entra com ordem, importância e prazo; regras novas (síntese fiel, não inventar motivação, prazo como expectativa, sugerir pontos de conversa) |
| Régua de contato | não usa objetivos | PA-07 = acompanhamento principal; demais da PA-06 = complementar (futuro) |

**Também mudou no protótipo, sem constar na matriz:** dois rótulos da PA-06: "Emagrecer / reduzir gordura corporal" → **"Emagrecer"** e "Ganhar massa muscular" → **"Hipertrofia (aumentar a massa muscular)"**. Todo o resto das 27 perguntas, do PAR-Q, dos consentimentos e do roteiro AP-01 a AP-09 é idêntico ao que está no Leven (conferido pelo texto).

## 2. Pontos a decidir antes de implementar (com recomendação)
1. **Formato do dado.** Recomendo o da matriz: `PA-07` = lista de objetos (um por objetivo classificado), mantendo a leitura das 7 respostas antigas (lista de textos).
2. **Mínimo para concluir.** O protótipo exige ao menos 1 objetivo classificado; a matriz diz "obrigatório: sim" e permite menos de 5. Com 1 só objetivo marcado, o aluno terá de classificá-lo e responder o texto e o prazo. Confirmar.
3. **Limpeza de dados.** A matriz deixa em aberto ("regra de limpeza definida"). Recomendo: na tela, o texto digitado fica guardado enquanto o aluno edita (não perde por um clique); **ao enviar**, o servidor descarta resposta e prazo de quem ficou em 4ª, 5ª ou sem posição, e de objetivo que saiu da PA-06.
4. **Rótulos da PA-06.** Confirmar os dois novos. Hoje **apenas 1 dos 27 objetivos casa** com o catálogo `training_goals` do banco ("Melhorar a postura"); os demais ficam só no JSON da resposta e não geram `student_goals` [V]. O catálogo usa outros nomes ("Hipertrofia", "Emagrecimento", "Força"). Decidir: alinhar o catálogo aos rótulos do formulário (ou o contrário).
5. **Direcionamento ao professor.** O protótipo usa dois textos fixos; a matriz admite síntese por IA. Recomendo: texto fixo na primeira entrega e a IA no resumo que já existe.
6. **Limite do texto aberto.** O protótipo limita a 600 caracteres (a matriz não diz). O texto livre vai à IA; confirmar o limite e o aviso de consentimento.
7. ~~**Links já emitidos**~~ **Resolvido em 23/11/2026 (usuária): os links enviados antes eram testes**, então não há link real a preservar; a nova PA-07 vale para todo link novo. As 7 respostas antigas (testes) só precisam de uma leitura defensiva para não quebrar a tela.
8. **Régua de contato:** fora desta entrega; apenas deixar o dado consultável.

**Inconsistências no material a corrigir:**
- No protótipo, o dicionário diz "PA-07 só se PA-06 tiver mais de 5 opções", mas a tela aparece com 1 ou mais.
- No protótipo, `prios()` devolve **todos os objetivos na ordem da PA-06** quando há 5 ou menos; deve usar sempre a ordem classificada (o Leven tem o mesmo defeito hoje).
- O protótipo cita uma aba "Anamnese ajustada" da planilha que **não veio** no arquivo (8 abas: Matriz, Regras, Perguntas, Exibição condicional, Estrutura JSON, Integração professor IA, Testes, Fluxo).
- A matriz chama PA-07.01 de "lista suspensa" por objetivo; o protótipo usa um seletor por objetivo ("Não priorizar" ou 1ª a 5ª). Equivalentes.

## 3. O que implementar, por camada
| # | Camada | Trabalho | Onde |
|---|---|---|---|
| 1 | Regras puras do formulário | novo tipo de campo `priority`; PA-07 aparece com ≥1 objetivo; PA-07.02 e PA-07.03; validação (posição única, extras obrigatórios nas 1ª a 3ª, limite de texto); `sanitize` com a limpeza; `optionsOf`, `validateAll`, `derive` | `_shared/preanamnesisV2.ts` (compartilhado: página, servidor e resumo) |
| 2 | Página pública | tela de classificação (um cartão por objetivo, seletor de posição, campos extras que aparecem e somem), contador "até 5 prioridades", mensagens de erro | `src/pages/public/PreAnamnesis.tsx` |
| 3 | Servidor | aceitar e validar o novo formato; tamanho do payload (32 KB) já comporta | `preanamnesis-public`, RPCs `submit_trial_preanamnesis` e `submit_member_preanamnesis` (a gravação em `student_goals` usa só a PA-06) |
| 4 | Modelos de anamnese | PA-07.02 e PA-07.03 entram e saem **junto** com a PA-07; textos editáveis dos novos campos (lista de textos permitidos) | `anamnesis_models` (vazia hoje), tela de configuração, snapshot do link |
| 5 | Resumo do professor | tabela de prioridades, cartões das 3 primeiras, "outros objetivos", nota; `prios()` e `prioText()` (usado em AP-02) passam a usar a ordem classificada | `summary()` no módulo compartilhado e `PreAnamnesisSummaryCard.tsx` |
| 6 | IA | mapeador com lista permitida inclui PA-07 com ordem, importância e prazo; prompt com as regras novas; reverificar o limite de 800 tokens (até 3 textos de 600 caracteres a mais) | `src/lib/anamnesisAI.ts`, `ai-run`, `docs/anamnesis-summary-prompt.md` |
| 7 | Correção da pré-anamnese pela equipe | o editor compartilhado de respostas precisa editar o novo tipo | componente do editor e RPC `review_preanamnesis_answers` |
| 8 | Dados legados | as 7 respostas (lista de textos) continuam exibidas; leitura dos dois formatos em resumo, IA e editor | mapeadores |
| 9 | Catálogo de objetivos | alinhar rótulos de `training_goals` (decisão 4) | dados de configuração, sem migração de estrutura |
| 10 | Testes | os 12 cenários da matriz como testes automáticos do módulo puro; SQL em transação revertida para o envio de prospect e de membro; regressão do formulário antigo | `src/test` |
| 11 | Publicação | `preanamnesis-public` e o site (e as pendências anteriores: `member-preanamnesis`, `send-transactional-email`) | |

Banco: **nenhuma tabela nova**; a resposta fica no JSONB da versão. Migração só se a decisão 4 pedir coluna de prioridade em `student_goals` (não recomendo agora).

## 4. Ordem sugerida
1. Fechar as decisões 1 a 7.
2. Camadas 1, 3 e 10 (regras, servidor e testes) em um pedido ao Lovable em modo plano.
3. Camadas 2 e 5 (página e resumo).
4. Camada 6 (IA) com reteste de tokens.
5. Camadas 4, 7, 8 e 9; publicação.
