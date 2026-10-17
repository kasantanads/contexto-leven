# Decisões

Formato: ID, pergunta, opções, o que muda conforme a resposta. Quando decidir, preencha **Decisão**, **Quem** e **Data**. Não reabra sem evidência nova.

## Decididas
| ID | Decisão | Quem | Data |
|---|---|---|---|
| D0.1 | O sistema começa no **Agendamento da AT**. O 1º contato (RD Station) fica fora do sistema. | (preencher) | 2026-10-16 |
| D0.2 | O conector do EVO é **somente leitura** por padrão; escrita exige flag e confirmação por chamada. Movimentação de dinheiro é bloqueada. | (preencher) | 2026-10-16 |
| D0.3 | Uma credencial do EVO por unidade (UMI, UP, UCB, UMP), guardada só no `.env` de cada pessoa. | (preencher) | 2026-10-16 |
| D0.4 | **Teste de cadastro de webhook no EVO com tipo de evento inventado, só na UMI**, para descobrir os tipos válidos pela mensagem de erro. Se o EVO aceitar, remover em seguida (`DELETE`). Exige `EVO_ALLOW_SENSITIVE=1` no `.env` (voltar a 0 depois) e a frase de confirmação na chamada. Sem segredo no corpo; URL de produção do n8n. | usuária, no chat | 2026-10-21 |
| D2.1 | **Início e término da AT (só no Leven, nada no EVO).** Estados `agendada → em andamento → concluída`, mais `faltou` e `cancelada`. **Iniciar:** professor da unidade, coordenador ou admin, de 15 min antes até o fim da aula (fora disso só admin); pré-anamnese pendente só avisa. **Roteiro presencial:** leitura antes de iniciar (admin edita sempre); edição em andamento; correção pelo professor até 24h após concluir, depois só coordenador/admin. **Encerrar:** conduta (AP-08) obrigatória só quando houver alerta (PAR-Q "sim", dor, lesão, medicamento, 70+, menor de 15); demais campos opcionais. **Sem registro:** 30 min após o fim da aula sem início, AT aparece como "sem registro" e o professor/coordenador confirma `faltou` ou `cancelada` (sem automação). **Reabrir:** só coordenador/admin, com motivo. Colunas novas em `student_sessions`: `started_at`, `started_by`, `ended_at`, `ended_by`, `no_show_at`. Fuso America/Sao_Paulo. | usuária, no chat ("ok" às recomendações) | 2026-10-27 |
| D2.2 | **Status exibido das aulas no Leven (calculado na tela, sem gravar no banco).** "Em andamento" só aparece para aula **iniciada pelo Leven** (AT: `trial_started_at`; aula comum: início registrado no Leven) e ainda não finalizada (**continua "Em andamento" mesmo depois do horário de término, até alguém finalizar; confirmado pela usuária em 28/10/2026, "por enquanto"**); nunca por relógio nem por sincronização. Sem início e antes do fim: **"Agendada"** (nunca "pendente"). Aula **comum** sem início depois do horário de término e sem falta ou cancelamento: **"Concluída"** (mesmo estilo de "Realizado", e o rótulo "Realizado" passa a "Concluída"). **AT** (aula teste) sem início depois do fim continua **"Sem registro"** (D2.1), não "Concluída". O que o professor ou o sistema gravou (realizado, faltou, cancelada) sempre prevalece. Não muda `status` no banco nem dispara gamificação ou presença. | usuária, no chat | 2026-10-28 |
| D2.3 | **Pré-anamnese para membro ativo e quem envia.** Membro ativo (`lifecycle_stage = 'member'` e `active`) recebe a pré-anamnese **só por clique da equipe** (enviar, reenviar, copiar link; nenhum disparo automático), com o mesmo formulário v2 e as mesmas regras de privacidade do prospect. Solicitação própria (`preanamnesis_requests`), validade de 7 dias, uma aberta por aluno, nova solicitação permitida depois de preenchida (reavaliação). A resposta do membro **não sobrescreve** a anamnese vigente: fica só como versão do aluno até o professor revisar; aplicar a versão à anamnese vigente fica para um passo seguinte. Sem aviso ao coordenador para membro. Membro sem unidade principal não recebe envio. **Quem envia: Administrador, Coordenador e Supervisor da unidade e também o Professor da unidade, tanto para AT/prospect quanto para membro** (muda a regra anterior, que excluía professor). E-mail continua em modo de teste até uma unidade ser liberada. | usuária, no chat | 2026-10-28 |
| D3.1 | **Sincronização com o EVO pelo usuário do painel web, automática a cada 5 minutos.** As requisições de agenda e presença passam a ser feitas pelo **usuário do painel EVO** (`EVO_WEB_DNS`, `EVO_WEB_LOGIN`, `EVO_WEB_PASSWORD`, já usados por `evo-web-sync-schedules`), que **não cobra por consulta**, e não mais pela API paga; a API paga fica como contingência. Isso **substitui** o combinado de 27/10/2026 de que "inicialmente será tudo manual". Detalhes (janelas, prospects/ATs, usuário dedicado, alertas, interruptores) pendentes de confirmação da usuária. Segredos só nos segredos do Lovable, nunca no chat nem nos arquivos. | usuária, no chat | 2026-11-10 |

## Propostas aguardando confirmação
| ID | Proposta | Detalhe |
|---|---|---|
| P1 | **Fixo = plano vigente** no EVO | `docs/03-regras-de-negocio.md` |
| P2 | **Agregador = sem plano vigente + check-in em Totalpass ou Wellhub** | idem. Depende de D6 (janela). |
| P3 | **AT = prospect com serviço de aula teste (Personal ou Pilates)** | idem. "Cortesia" não é AT. |
| P4 | Presença lida de `presenca` / `falta` / `faltaJustificada` | corrige o achado A1 |
| P5 | **Cadastrar no EVO, pela API, webhooks de aulas da grade para o n8n** (escrita no EVO, `POST /api/v1/webhook`, uma unidade por vez, **começando pela UMI**): `AppointmentEnroll` (agendamento criado), `CancelAppointment` (cancelado), `EndedSessionActivity` e `EndedSessionAppointment` (aula finalizada), `ActivityEnroll` (check-in) e opcionalmente `SpotAvailable` (vaga). Destino: URL de produção do n8n. Pedido da usuária em 10/11/2026 ("cria webhook para aulas da grade, criação e alteração"); **a lista é interpretação minha**, porque o EVO não tem evento de criação ou alteração da própria grade. | `02-evo-api.md` (seção Webhooks). Depende de `EVO_ALLOW_SENSITIVE=1` no `.env` e da frase de confirmação por chamada. Os 20 webhooks existentes (outro sistema) não são tocados. **Executado em 10/11/2026 só em parte e depois desfeito, a pedido da usuária: `AppointmentEnroll` (53603) e `ActivityEnroll` (53604) foram criados na UMI e apagados em seguida (23:00); nenhum webhook nosso resta no EVO.** Os demais tipos e unidades não foram criados. |

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
