# Quadro de tarefas

Regra: escreva seu nome em **Dono** antes de começar. Um dono por tarefa. Status: `a fazer`, `em andamento`, `aguardando decisão`, `feito`.
Atualizado em 23/10/2026. **Antes de enviar algo ao Lovable, conferir `list_edits`** (houve edições de outra pessoa em 22 e 23/10 sem registro no diário).

## Já feito
| # | Tarefa | Status | Notas |
|---|---|---|---|
| 1 | Entender a AT e o EVO (4 unidades, só leitura) | feito | 16/10. `02-evo-api.md` |
| 2 | Presença do EVO no Leven (A1) | feito no código | 22/10, commit `22eed9a`: presença finalizada vira `done`, falta `absent`, justificada `canceled`. **Falta:** nova sincronização do histórico e decidir o que fazer com os 1.743 eventos críticos antigos |
| 3 | Agenda completa: aulas só com justificada (A15) e agregadores inativos (A16) | feito no código | 23/10. **Falta:** nova sincronização e conferência com dados |
| 4 | AT de outubro: colunas, função `evo-sync-prospects`, botão, aba "Aulas teste", selo na Agenda, ficha de prospect | feito | 22/10; carga de teste: 69 prospects e 32 sessões (UCB 14, UMI 5, UMP 6, UP 7) |
| 5 | Chave de pessoa (`person_key`), parte "agora" | feito | 23/10: coluna, cálculo, gravação só em linha nova, aviso na ficha, contagem da rede. A corrigir já feito: A17 |

## Em aberto
| # | Tarefa | Status | Notas |
|---|---|---|---|
| 6 | Conclusão automática da sessão (nasce agendada, conclui no fim da aula) | aguardando decisão | `06-fase-1-especificacao.md`. Decidir: tolerância, eventos de jornada, carga do histórico (1.438 sessões passadas ainda `scheduled`), AT na mesma regra |
| 7 | Captura do primeiro contato (prospect, agregador, membro) | aguardando decisão | Desenho em `06`. Decidir: importar todo inativo novo, ignorar bloqueios, Cortesia como AT, consultor, fundir duplicatas |
| 8 | Conversão da AT / fechamento do plano | a fazer | Captura por contrato novo (`membershipStartDateStart`) + ligação por CPF, telefone, e-mail; só 3 de 6 prospects recentes têm CPF |
| 9 | Cortesia com pessoa real conta como AT? | aguardando decisão | Medição mínima em uma unidade ainda não feita; janela de cadastro de set e out deixa AT de prospects antigos de fora |
| 10 | Carga: `person_key`, `first_contact_at`, `registered_at`, telefone (do `evo_data`, sem chamar o EVO), regra de conflito, clínicos entre unidades, lista da rede por pessoa | aguardando decisão | Combinado: sem carga por enquanto |
| 11 | Webhooks do EVO (`EndedSessionActivity`, `Entries`, `CreateMember`, reservas) | aguardando decisão | Documentação lida em 22/10; nenhum cadastrado; cadastrar é escrita sensível: decisão em `05-decisoes.md` |
| 12 | Sincronização automática por consulta periódica (agenda do dia, prospects, membros novos, entradas) | a fazer | Substitui o botão; 40 req/min por chave compartilhada entre as duas pessoas |
| 13 | Lista de ativos (A2, D17): desativar quem saiu | a fazer | Pré-requisito de dashboards confiáveis |

## Etapas do desenho ainda sem desenho técnico
| # | Tarefa | Status | Notas |
|---|---|---|---|
| 14 | Aula experimental: pré-anamnese, anamnese, finalizar AT, resumo do aluno para o Coordenador | a fazer | Anamnese existe (versões, resumo por IA, PDF) mas está vazia (0 registros); hoje AT é só leitura na Agenda |
| 15 | Aula: nota de intensidade ao finalizar | a fazer | Não existe; existe RPE por exercício |
| 16 | Régua de contato automática, por pessoa, a partir da 1ª aula ou do início do plano | a fazer | Hoje: inscrição manual contada de "hoje"; definir "Leven Performance" |
| 17 | Novo ciclo de treino: resumo de resultados e renovação guiada | a fazer | |
| 18 | 1º contato no RD Station: entra no sistema ou fica fora? | aguardando decisão | O "primeiro contato" que o Leven captura é o cadastro no EVO, não o do RD Station |

## Higiene
| # | Tarefa | Status | Notas |
|---|---|---|---|
| 19 | Funções sem autenticação (`evaluate-rules`, `gamify-calculate`) e triggers (A11, A12) | a fazer | |
| 20 | Gerar nova chave do EVO (a primeira foi colada no chat) | a fazer | |
| 21 | Publicar os documentos no GitHub (commit e push das alterações locais) | a fazer | docs 02 a 06, DIARIO, QUADRO, `evo-mcp` (máscara), `docs/n8n`, rascunhos `lovable-msg-*` |
| 22 | Segunda pessoa aceitar o convite do GitHub e configurar o próprio `evo-mcp/.env` | a fazer | Combinar quem edita o Lovable e quando |
