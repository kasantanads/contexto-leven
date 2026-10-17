# API do EVO (W12): o que sabemos

Fonte: Swagger público `https://evo-integracao.w12app.com.br/swagger/index.html` e testes de leitura em 16/10/2026. Marcas: `[V]` verificado, `[H]` hipótese.

## Acesso
- Base: `https://evo-integracao-api.w12app.com.br` [V]
- Autenticação: Basic Authentication. **Usuário = DNS da filial, senha = Secret Key.** [V]
- **Uma credencial por unidade.** Cada chave só enxerga a própria filial. [V]
- **Limite: 40 requisições por minuto por credencial** (erro 429). [V]
- `GET /api/v1/configuration` devolve 403 com as nossas chaves (sem permissão). [V]
- Conector local: `evo-mcp/` (ferramentas `evo_list_units`, `evo_list_endpoints`, `evo_describe_endpoint`, `evo_call`).

## Unidades
| Rótulo | Filial | idBranch |
|---|---|---|
| UMI | LEVEN MOEMA ÍNDIOS | 1 |
| UP | Paraíso - Academia Leven | 2 |
| UCB | LEVEN CAMPO BELO | 3 |
| UMP | LEVEN MOEMA PÁSSAROS | 4 |

## Serviços de aula teste (idService, por unidade) [V 16/10/2026]
Catálogo: `GET /api/v1/service`. Os ids **mudam por unidade**. A regra é pela flag `experimentalClass = true` + valor 0 + grupo Personal ou Pilates, não pelo id fixo.

| Unidade | Aula Teste PERSONAL | Aula Teste PILATES |
|---|---|---|
| UMI | 14 | 17 |
| UP | 30 | 33 |
| UCB | 21 | 24 |
| UMP | 39 | 42 |

Também têm `experimentalClass = true`, mas **não são AT da academia**: UCB 54 "Aula Teste Small Group" (inativo); UMP 116 "AVALIAÇÃO Fisioterapia" (R$ 265), 118 "Recovery EXPERIMENTAL", 122 "AVALIAÇÃO Osteopatia" (R$ 415).

"Cortesia" é outro serviço (valor 0), usado por parceiros (ex.: Totalpass), e **não é AT**.

## Endpoints de leitura mais usados
| Para quê | Endpoint | Observações |
|---|---|---|
| Prospects | `GET /api/v1/prospects` | `registerDateStart` e `registerDateEnd` (inclusivos no dia), `take` até 100, `skip` |
| Serviços do prospect | `GET /api/v1/prospects/services?idProspect=` | devolve `idService` e `nameService` |
| Aulas de uma pessoa | `GET /api/v2/activities/member/sessions` | `idProspect` ou `idMember`. **Sem `dateEnd`, só devolve o passado**; passe `dateEnd` no futuro para ver aulas agendadas |
| Grade do dia | `GET /api/v1/activities/schedule?date=` | ~111 horários/dia por unidade |
| Inscritos de um horário | `GET /api/v1/activities/schedule/detail` | exige `idConfiguration`, `activityDate`, `idActivitySession` |
| Catálogo de atividades | `GET /api/v1/activities` | |
| Membros | `GET /api/v2/members` | `status=1` ativos; `showMemberships=true` traz os planos; `conversionDateStart`; `idsMembers` (lista) |
| Planos (catálogo) | `GET /api/v3/membership`, `GET /api/v1/membership/category` | |
| Check-ins de agregadores | `GET /api/v1/management/aggregators/checkins/search` | `DtStart`, `DtEnd`, `IdBranch`, `Skip`, `Take`. Resposta `{ total, list }` |
| Webhooks cadastrados | `GET /api/v2/webhook` | nenhum cadastrado [V]; tipos de evento **não documentados** |

## Relatórios de gestão do EVO (arquivos Excel) [V, 10/11/2026, UMI, só colunas e contagens]
Seis relatórios da API são de leitura. Os três de `management` devolvem **um arquivo `.xlsx`** (tipo `application/vnd.ms-excel`), uma consulta por unidade. O conector MCP **corrompe arquivos binários**: para ler, baixe com um script local (ex.: `fetch` + `arrayBuffer`) ou em uma função de borda que leia o xlsx. No Git Bash use `MSYS_NO_PATHCONV=1`, senão o caminho que começa com `/` vira caminho do Windows.

| Relatório | Endpoint | Parâmetros | Colunas |
|---|---|---|---|
| **Prospects** | `GET /api/v2/management/prospects` | `dtStart`, `dtEnd` | IdFilial, NomeFilial, Status, **IdProspect**, Nome, DtCadastro, PrimeiraVisita, **ConvertidoPor**, **DtConversao**, **IdCliente**, Descricao, PrimeiroContrato, Apelido, Marketing, EmailAtual, CelularAtual |
| **Clientes ativos** | `GET /api/v2/management/activeclients` | nenhum | IdFilial, Filial, IdCliente, NomeCompleto, Telefone, Email, IdClienteContratoAtivo, ContratoAtivo, DtInicioContratoAtivo, DtFimContratoAtivo, IdClienteContratoFuturo, ContratoFuturo, DtInicioContratoFuturo, DtFimContratoFuturo |
| **Não renovados** | `GET /api/v2/management/not-renewed` | `dtStart`, `dtEnd` | IdFilial, NomeFilial, IdCliente, Status, ContratoAtivo, Nome, Sobrenome, ContratoVencido, DataInicio, DataFim, MesesPermanencia, **Valor**, FlCancelado, DtCancelamento, ContratoCancelado, MotivoCancelamento, NomeConsultor, Celular, Email |
| Check-ins de agregadores | `GET /api/v1/management/aggregators/checkins/search` | `DtStart`, `DtEnd`, `IdBranch`, `Skip`, `Take` | JSON `{ total, list }` (já usado) |
| Último treino por membro ativo | `GET /api/v2/workout/management-workouts` | filial | último treino da versão nova do EVO (`workoutStatus` 0 = sem treino) |
| Avaliações físicas | `GET /api/v2/fitness-assessment/management` | | lista de avaliações |

Também existem relatórios financeiros (`/api/v1/receivables/debtors`, `/receivables-conciliation`): **fora do escopo do Leven**.

**Achado principal:** o relatório de **Prospects traz a conversão** (`ConvertidoPor`, `DtConversao`, `IdCliente`, `PrimeiroContrato`, `PrimeiraVisita`), com o **vínculo prospect → membro** (`IdProspect` ↔ `IdCliente`). A API `GET /api/v1/prospects` **nunca** preenche `idMember` nem `conversionDate`. Teste na UMI, janela 08/11 a 10/11: 5 prospects, 3 com conversão preenchida e 1 com primeiro contrato.
- **Em aberto [H]:** se `dtStart`/`dtEnd` filtram pela data de cadastro ou pela de conversão; quantos prospects o relatório devolve por janela (limite); por que Clientes ativos da UMI traz só 177 linhas (a base de ativos da UMI era ~900 em 16/10): pode ser só quem tem contrato ativo naquele momento.
- **Cuidados:** os arquivos têm nome, telefone e e-mail; Não renovados tem **valor do contrato** (não gravar). Cada relatório é uma consulta da API paga.

## Como ler os campos
- **Status de presença** (`status` na inscrição e `statusID` em `member/sessions`): `0` = Presente, `1` = Falta (provável [H]), `2` = Falta justificada. **0 é o padrão de quem está agendado**; só vira falta se o professor marcar ausência. Depois de "Finalizar", 0 continua significando comparecimento. [V]
- `member/sessions` traz `presenca`, `falta`, `faltaJustificada` e `isFinalized`: **é a forma mais clara de ler presença**. [V]
- **`idConfiguration`** = grade recorrente (dia da semana + hora + instrutor + capacidade). Cada data gera uma **sessão** (`idAtividadeSessao`). Sessões futuras distantes podem vir com id 0. [V]
- **`idActivity`** = tipo de atividade da unidade (ex.: "1 - Personal Trainer"). **Os ids mudam por unidade** (UMI: Personal 1, Pilates 2; UMP: Personal 21, Pilates 23). Mapear modalidade por unidade. [V]
- O **instrutor é da sessão**, não da pessoa. Se a AT for reagendada, o professor muda. [V]
- Inscrições (`enrollments`) **não têm campo de tipo** (AT, fixo, agregador). O que existe: `idProspect` sem `idMember` = prospect. [V]
- O rótulo "(Aula Experimental)" da tela da grade vem do **serviço** que o prospect possui, não da aula. [V]
- Prospect: `mktChannel` = canal de origem; `signupType` = Personal, Telephone, E-mail, Other; `currentStep` e `temperature` **vêm sempre vazios**; `idMember` e `conversionDate` **nunca preenchidos** nos prospects. [V]
- Membro: `status` = `Active` ou `Inactive`; `memberships[]` com `startDate`, `endDate`, `cancelDate`, `name`, `membershipStatus` (`active`, `expired`, `in queue`). **`weeklyLimit` vem vazio**: a frequência (1x, 2x, 3x) só existe no **nome do plano**. [V]
- `allowExperimentalClass` é `false` em todos os horários e `appointments` está vazio: **a AT não usa o recurso "aula experimental" da grade do EVO**. [V]
- **Formato da resposta varia por endpoint:** `GET /api/v2/members` devolve uma **lista simples**; `GET /api/v3/membership` devolve um **objeto `{ qtde, lista, list }`** (os itens estão em `list`); o relatório de check-ins devolve `{ total, list }`. Um leitor que só espera lista enxerga "zero planos". [V]
- **Catálogo de planos** (`/api/v3/membership`): `active=true` devolve só os ativos (UMI 77); sem o filtro, todos (UMI 362, incluindo inativos, que ainda podem ter contratos). Cada plano traz `activitiesGroups` (grupos de atividade: "Personal Trainer", "Pilates"). [V, 21/10/2026]
- **Classificar UMA pessoa com UMA chamada:** usar `GET /api/v2/members?idsMembers={idMember}&showMemberships=true` (na unidade da pessoa). Ela devolve `status`, `memberships[]` (planos vigentes) e os códigos `codeTotalpass` e `gympassId`. **Não usar `GET /api/v2/members/{idMember}`**: o detalhe **não traz `status` nem os códigos de agregador**, mesmo com `showMemberships=true`. Testado com um fixo (UMI: Active, 2 planos vigentes) e um agregador (UCB: Inactive, 0 contratos, `codeTotalpass` preenchido). [V, 21/10/2026]
- **O relatório de check-ins não filtra por pessoa** (só por período, unidade e agregador): confirmar atividade recente exige ler a lista, e não uma consulta por pessoa. [V]

- **Entradas (`GET /api/v1/entries`) = registro de presença [V, 22/10/2026, caso real e contagens de 19/10]:** filtros `registerDateStart`/`registerDateEnd`, `idMember`, `idProspect`, `take` até **10.000**, `skip`. Cada registro tem `date` (igual ao **horário de início da aula**, de 06:00 a 21:00), `idMember` ou `idProspect`, `entryType` (só `Agendamento` nos dados vistos), `entryAction` (`entry`), `device` e `blockReason` vazios, `idBranch`. Não traz o id da sessão: o vínculo é por `idMember` + data e hora de início. Num membro da UCB, as 10 aulas de outubro batem: aulas **finalizadas com presença** (8) geraram entrada (inclusive uma que `member/sessions` não listou), e **falta**, **falta justificada** e aula **não finalizada** (5, mais as futuras) não geraram. Em 19/10 houve 142 (UCB), 121 (UMI), 166 (UMP) e 179 (UP) entradas; na UMI, 121 das 148 pessoas inscritas tinham entrada e nenhuma entrada ficou sem inscrição. A entrada **só existe depois que o professor finaliza a aula**.
- **A inscrição nasce com presença (status 0) [V, UCB, 20, 22, 23 e 26/10/2026, só contagens]:** em dias futuros, **88% (23/10) e 90% (26/10)** das inscrições estão em 0; o restante é falta justificada marcada **antes** da aula (12% e 9%); falta (1) quase não existe antes da aula (0 em 23/10; 1 prospect em 26/10). No passado (20/10, aulas finalizadas): presença 77%, justificada 18%, falta 5%. **Aulas passadas nunca finalizadas** em 20/10: 5 de 142 horários (3,5%), com 6 inscrições que seguem em 0 por padrão. Só uma unidade e quatro dias medidos.
- **Check-ins de agregador (`checkins/search`):** campos `idMember`, `idProspect`, `checkinDate`, `checkinTime`, `status`, `product`, `tokenUsed`, `aggregator` (`Wellhub`, `Totalpass`). Em 19/10, 285 das 290 pessoas com check-in também estavam inscritas na grade (98%).
- **`member/sessions` não é completo [V, um caso]:** uma aula de 03/10 com entrada registrada e sessão no Leven não apareceu na lista do membro.

## Webhooks (documentação oficial, lida em 22/10/2026) [V na documentação; nenhum webhook foi criado]
Fonte: `https://api.abcevo.com/add-new-webhook-32242774e0`.
- **Cadastro:** `POST https://evo-integracao-api.w12app.com.br/api/v1/webhook`, Basic, corpo `application/json-patch+json`: `idBranch` (só vale com chave multiunidade; **cada filial cadastra o seu**), `eventType`, `urlCallback` (recebe POST), `headers` (opcional; o texto diz `name`/`value`, o esquema `nome`/`valor`, confirmar), `filters` (só para `NewSale`, `SaleItemDescription`, "contém", OU entre filtros). Não aceita propriedades extras.
- **Entrega:** POST com `IdW12`, `IdBranch`, `IdRecord`, `EventType` e `ApiCallback` (endpoint para buscar o detalhe). Só ids, sem dados pessoais. **Retentativas, limite de webhooks, timeout e garantia de entrega não estão documentados**: é preciso uma varredura de conferência.
- **Eventos úteis para o Leven** (todos com o id indicado em `IdRecord`):
  - `EndedSessionActivity` (aula da grade terminou; `idActivitySession`): gatilho para ler o detalhe da aula e fechar presença, falta e justificada.
  - `Entries` (acesso registrado; `IdEntry`): presença (veja `/api/v1/entries`).
  - `ActivityEnroll` (**check-in** de um aluno em atividade da grade, **não** a inscrição; `idSession`: a página usa `idSession` aqui e `idActivitySession` nos demais, confirmar), `AppointmentEnroll` e `CancelAppointment` (agendamento de atividade criado ou cancelado no módulo de agendamentos, por EVO, site, totem, Fiti ou API; `idActivitySession`), `EndedSessionAppointment` (atividade da agenda finalizada, manualmente ou por cron), `SpotAvailable` (atividade da grade lotada passa a ter vaga; `idActivitySession`). [Corrigido em 10/11/2026 após reler a página de documentação.]
  - **Não existe evento para criação ou alteração da própria grade** (horário, atividade ou configuração): só os eventos de treino (`CreateWorkout`, `AlterWorkout`) e de serviço (`CreateService`, `AlterService`). Mudanças na grade só se descobrem por consulta periódica da semana.
  - `CreateMember` (prospect virou membro; `idMember`): **conversão da AT**. `AlterMember` (dados pessoais; **mudança de ativo para inativo não dispara**), `TransferMember`, `TransferProspect`.
  - Contratos: `CancelMembership`, `ScheduleCancelMembership`, `Freeze`, `CreateMembership`, `AlterMembership`. Vendas: `NewSale`, `RecurrentSale`.
  - Outros: financeiro (`ClearedDebt`, `AlterReceivables`, `NewInvoice`, `CancelInvoice`), produtos, serviços, treino (`CreateWorkout`, `AlterWorkout`), foto facial, custo da API Pro (`api.cost_limit.warning` e `reached`; **ao atingir 100% as chaves da unidade são pausadas**).
- **Como gerenciar [V, spec da API e página de documentação, 10/11/2026]:** só existem 3 endpoints: `GET /api/v2/webhook` (lista), `POST /api/v1/webhook` (cria) e `DELETE /api/v1/webhook` (remove por id). **Não há PUT nem PATCH**: para "editar", apaga-se o webhook e cria-se outro. A documentação **não cita nenhuma tela** do sistema EVO para webhooks (não achamos o menu); o cadastro é feito pela API, uma filial por vez. Em 10/11/2026 havia 20 webhooks (5 por unidade, de venda e dívida) criados em 04/11 por outro sistema, apontando para `painel.academialeven.com.br`.
- **Lacunas:** **não há evento de criação ou alteração de prospect** (só transferência), então o cadastro de AT precisa de consulta periódica; `ActivityEnroll` e `AppointmentEnroll` podem cobrir a marcação da AT, mas o comportamento com prospect não foi testado.

## Ainda não sabemos
- ~~Tipos de evento de webhook disponíveis~~ (resolvido em 22/10/2026: lista na seção "Webhooks" acima). **Observado em 21/10/2026 (UMI):** `POST /api/v1/webhook` com tipo inventado devolve `400` com `"Wrong webhoook eventType"`: o EVO **valida o `eventType`** e **não devolve a lista de valores válidos** [V]. Nada foi criado.
- Significado exato de `status` 1 e de `subStatus`. [H]
- Se o "R" no avatar da tela do EVO é reposição. [H] (`isReplacement` vem verdadeiro nas sessões do prospect reagendado)
