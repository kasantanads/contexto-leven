# Decisões

Formato: ID, pergunta, opções, o que muda conforme a resposta. Quando decidir, preencha **Decisão**, **Quem** e **Data**. Não reabra sem evidência nova.

## Decididas
| ID | Decisão | Quem | Data |
|---|---|---|---|
| D0.1 | O sistema começa no **Agendamento da AT**. O 1º contato (RD Station) fica fora do sistema. | (preencher) | 2026-10-16 |
| D0.2 | O conector do EVO é **somente leitura** por padrão; escrita exige flag e confirmação por chamada. Movimentação de dinheiro é bloqueada. | (preencher) | 2026-10-16 |
| D0.3 | Uma credencial do EVO por unidade (UMI, UP, UCB, UMP), guardada só no `.env` de cada pessoa. | (preencher) | 2026-10-16 |

## Propostas aguardando confirmação
| ID | Proposta | Detalhe |
|---|---|---|
| P1 | **Fixo = plano vigente** no EVO | `docs/03-regras-de-negocio.md` |
| P2 | **Agregador = sem plano vigente + check-in em Totalpass ou Wellhub** | idem. Depende de D6 (janela). |
| P3 | **AT = prospect com serviço de aula teste (Personal ou Pilates)** | idem. "Cortesia" não é AT. |
| P4 | Presença lida de `presenca` / `falta` / `faltaJustificada` | corrige o achado A1 |

## Pendentes
| ID | Pergunta | Opções | Impacto |
|---|---|---|---|
| D1 | **Quem faz AT e não fecha** continua no Leven? | (a) fica com status "não fechou"; (b) sai | Define a conversão da AT do Miro. Com (b) perde-se o histórico. |
| D2 | A **AT tem treino** no Leven? | (a) só presença e anamnese; (b) treino padrão; (c) mini-plano da AT | Hoje não dá para iniciar sessão sem plano ativo. |
| D3 | A AT é **sempre** um prospect marcado numa aula de Personal ou Pilates? Existe outro jeito de agendar? | confirmar com a recepção | Validamos só pelos dados. |
| D4 | **AT reagendada** (falta justificada e reposição) conta como a mesma AT ou como outra? | mesma / nova | Conta de "ATs realizadas" e de conversão. |
| D5 | **Qual professor** vale na AT reagendada? | o da 1ª marcação / o da aula realizada / cada sessão | O instrutor é da sessão. |
| D6 | **Janela do agregador** | 30, 60 ou 90 dias de check-in | O número muda muito. Em 30 dias: 1.666 pessoas. |
| D7 | **Chave para ligar prospect → membro** (fechamento) | nome + telefone? e-mail? exigir CPF na recepção? | O CPF falhou (0 ligações). Sem isso o fechamento não é automático. |
| D8 | O que é a **régua de contato** do Miro | check-in de percepções com resultado mostrado ao aluno, ou sequência de tarefas de contato (o que existe hoje)? | Muda a Fase 5. |
| D9 | De que data contam os **marcos da régua** (30 d, 75 d, 4 a 11 meses) | início do plano / 1ª aula / fechamento | |
| D10 | **Nota de intensidade da aula**: quem dá e em que escala | professor ou aluno; 0–10 (já existe RPE por exercício)? | |
| D11 | Manter o **fechamento automático** 10 min após o tempo planejado? | manter / remover | O Miro não prevê. |
| D12 | O que é **"Leven Performance"** (1ª aula) no sistema | | |
| D13 | O Leven **escreve no EVO** (criar AT, converter prospect) ou só lê? | só lê / escreve com confirmação | Começamos só lendo. |
| D14 | **Webhook ou sincronização agendada** | cron primeiro, webhook depois | Tipos de evento do webhook não documentados. |
| D15 | Como marcar **permuta** | pela categoria VIP + nome? campo próprio? | |
| D16 | **Nome do sistema** | Evolution / Leven Treinos / outro | |
| D17 | O que fazer com os **6.631 "ativos"** do Leven (achado A2) | recalcular pelo EVO e desativar | Pré-requisito da Fase 1. |
