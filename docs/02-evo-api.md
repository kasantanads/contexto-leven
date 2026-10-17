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

## Ainda não sabemos
- Tipos de evento de webhook disponíveis. [H] suporte do EVO
- Significado exato de `status` 1 e de `subStatus`. [H]
- Se o "R" no avatar da tela do EVO é reposição. [H] (`isReplacement` vem verdadeiro nas sessões do prospect reagendado)
