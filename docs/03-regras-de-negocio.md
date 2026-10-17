# Regras de negócio (propostas a partir dos dados do EVO)

Marcas: `[V]` verificado, `[H]` hipótese, `[D]` depende de decisão (veja `05-decisoes.md`). Dados de 16/10/2026.

## Quem é quem
| Conceito | Regra |
|---|---|
| **Prospect** | Cadastro de interessado no EVO (`idProspect`), sem plano. Pode ser inscrito em aula. [V] |
| **AT (aula teste)** | Prospect com serviço `experimentalClass = true`, valor 0, grupo Personal Trainer ou Pilates, inscrito numa aula comum da grade. [V] |
| **Cortesia** | Serviço de parceiros (ex.: Totalpass). **Não é AT.** [V] |
| **Fixo** | Membro com **plano vigente**: sem `cancelDate`, `startDate ≤ hoje ≤ endDate`. Coincide com `status = Active` (904 de 904). [V] |
| **Permuta** | Plano vigente de categoria VIP com "Permuta" no nome. Conta como fixo, com marcador próprio. [V] |
| **Agregador** | Sem plano vigente **e** com check-in em Totalpass ou Wellhub na janela definida. [V] [D janela] |
| **Inativo / ex-aluno** | Sem plano vigente e sem check-in na janela. |

## Precedência (para classificar um membro)
1. Tem plano vigente → **fixo** (ou **permuta**, se o plano for de permuta).
2. Senão, tem check-in de agregador na janela → **agregador**.
3. Senão → **inativo**.

Pessoas com plano vigente que também usam agregador: 10 de 1.666 (0,6%). [V 16/10/2026]

## Detecção da AT (proposta)
1. Prospects novos: `GET /prospects` com `registerDateStart` incremental.
2. Para cada um: `GET /prospects/services`. É AT se algum serviço tem `experimentalClass = true`, valor 0 e grupo Personal ou Pilates da unidade.
3. Aulas: `GET /member/sessions` com `idProspect` e **`dateEnd` no futuro**.
4. Presença da AT: `presenca`, `falta` e `faltaJustificada`. Aula não finalizada (`isFinalized = false`) = ainda agendada.
- Um prospect pode ter mais de um serviço AT (Personal e Pilates) e mais de uma sessão (reagendamento). [V]
- **AT reagendada conta como a mesma AT?** [D]

## Presença (regra de leitura)
- Em aula **finalizada**, `status 0` = compareceu. Em aula não finalizada, 0 = só agendado.
- Falta justificada (`2`) é diferente de falta (`1`). [V]

## Plano e frequência
- "Plano atual" = planos vigentes. **Um membro pode ter 2 ou 3 planos vigentes ao mesmo tempo** (105 de 904), tipicamente Personal e Pilates. [V]
- Frequência semanal: extrair do **nome do plano** ("PT 2x Anual", "Pilates 1x Sem"). `weeklyLimit` não serve. Nomes fora do padrão (ex.: "Passaporte da Copa PT 2x (24 aulas)") precisam de tratamento. [V]
- Plano com `membershipStatus = in queue` é renovação já contratada, não ex-aluno. [V]

## Fechamento do plano (AT → aluno fixo)
- Sinal no EVO: membro com `conversionDate` no período (ex.: 110 membros convertidos de 01/08 a 16/10 nas quatro unidades: UCB 14, UMI 23, UMP 38, UP 35). [V]
- **O prospect não guarda quem ele virou.** Ligação prospect→membro por CPF não funciona (0 ligações; CPF preenchido em 10 de 40, 14 de 26, 14 de 42 e 2 de 36 prospects). [V]
- Chave de ligação alternativa (nome + telefone/e-mail?): [D]

## Origem do prospect
- `mktChannel` está preenchido em todos (25 de 25 em outubro), mas **"Não identificado" aparece em 16%**. [V]
- A grafia varia ("Google", "GOOGLE"; "INDICAÇÃO", "INDICAÇAO"). Normalizar antes de somar. As listas de canais diferem por unidade. [V]
- Canal de agregador (Totalpass, Gympass, Freepass) aparece em 11 de 144 prospects desde 01/08, e **não** coincide sempre com o serviço Cortesia. [V]

## Contatos (regras de importação, a partir de amostras reais do EVO em 21/10/2026)
- **Fonte:** `GET /api/v2/members` (campo `contacts[]`: `contactType` = `Cellphone`, `E-mail` ou `Telephone`; `ddi`; `description`). Nos prospects, `cellphone` e `email` vêm soltos. [V]
- **O formato do telefone varia** no mesmo EVO: com parênteses e espaço, só dígitos, com `ddi` preenchido ou nulo. Normalizar mantendo só dígitos e removendo o DDI (55) quando vier separado ou como prefixo. [V]
- **O tipo nem sempre confere com o número:** existe contato `Cellphone` com número de 8 dígitos (padrão de telefone fixo). Não confiar só no `contactType`. [V]
- **Escolha do celular:** entre os contatos (Cellphone ou Telephone) que **parecem celular** (DDD + 9 dígitos começando com 9), o de maior `idPhone` [H: ser o mais recente]. Se nenhum parecer celular, guardar o fixo e marcar como sem WhatsApp. A regra "maior `idPhone` entre os Cellphone" **erra** quando o último cadastrado é um número fixo.
- **E-mail:** minúsculas e sem espaços. Se houver vários, o de maior `idPhone`.
- **Nome:** `firstName` pode trazer o nome completo com `lastName` nulo. Montar juntando `firstName` e `lastName`, sem duplicar. [V]
- **CPF:** vem formatado ("000.000.000-00") ou só dígitos. Guardar só dígitos. [V]
- **`registerDate` e `conversionDate` vêm nulos** em muitos membros. Não usar como filtro de carga. [V]
- **Professor:** `idEmployeeInstructor` e `nameEmployeeInstructor` vêm no cadastro, mas **só em 150 dos 904 ativos (17%)**; `idEmployeePersonalTrainer` vem em 0%. **Não serve como única fonte** do professor responsável: derivar do instrutor mais frequente nas sessões recentes e usar o cadastro como complemento. [V, 21/10/2026]
- **Privacidade:** nenhum desses dados vai para o repositório, para logs ou para o `evo_data` inteiro.
- **Telefone inválido existe:** apareceu um celular `000000000`. Rejeitar o que não tiver 10 ou 11 dígitos depois de normalizar, ou que seja todo do mesmo dígito. [V]
- **Sobrenome duplicado:** apareceu `firstName` já com o nome completo e `lastName` repetindo o sobrenome. Só juntar quando o `firstName` **não terminar** com o `lastName`. [V]
- **`document` pode vir vazio (`""`)**: tratar como nulo. [V]
- **`gender`:** `Male`, `Female`, `Uninformed` ou nulo. `Uninformed` vira nulo no Leven. [V]

## Agregadores recém-criados no EVO (amostra de 9 cadastros de 19 e 20/10/2026, UCB) [V na amostra]
- Quem usa Totalpass ou Wellhub pela primeira vez **ganha um cadastro de membro automático**: `status = Inactive`, `registerDate` = o dia, sem planos, com **`codeTotalpass`** (8 caracteres) ou **`gympassId`** (13 dígitos) preenchido. 7 dos 9 tinham o marcador (6 Totalpass e 1 Gympass).
- **Os marcadores `codeTotalpass` e `gympassId` identificam o agregador entre os inativos.** (A leitura anterior, de que são raros, valia só para os membros ativos.)
- Em geral vêm com `document` e contatos (celular e e-mail), `lastAccessDate` preenchido, e sem professor nem consultor.
- Um dos nove tinha `conversionDate` e consultor, sem marcador de agregador e **ainda `Inactive`**: sinal de prospect convertido cujo plano ainda não começou.
- Um dos nove parecia cadastro de teste (celular `000000000`, gênero "Uninformed").
- **Hoje não existe "plano de agregador" ativo:** entre os 904 ativos, **nenhum** tem plano vigente com Gympass, Wellhub, Totalpass ou Classpass no nome (os nomes desse tipo que apareceram antes eram planos já vencidos). [V, 21/10/2026]
- **Os 43 ativos com `gympassId` (41 na UMI, 2 na UMP) têm plano comum**: são fixos que também têm o benefício. Pela precedência (plano vigente = fixo), continuam fixos. [V]
- Ou seja: o aluno de agregador **chega como pessoa sem plano**, com o código no cadastro e check-ins; a classe vem do código e dos check-ins, não de um plano.
- Novos agregadores aparecem **todo dia**: dá para carregar por `registerDateStart` (os cadastros novos têm `registerDate`; os antigos têm nulo).

## Campos do membro a trazer (cobertura entre os 904 ativos, 21/10/2026) [V]
**Essenciais:** `idMember` (100%), `idBranch` (100%), `status` (100%), `memberships` com `showMemberships=true` (plano vigente em 901 de 904, 99,7%), `contacts` (celular 903, e-mail 897), `firstName` e `lastName`, `document` (887, 98%), `updateDate` (904, 100%), `conversionDate` (803, 89%) e os marcadores de agregador `codeTotalpass` (19 ativos) e `gympassId` (43 ativos; 41 deles na UMI).
**Úteis:** `birthDate` (855, 95%), `gender` (896), `registerDate` (809, 89%), `lastAccessDate` (896, 99%), `idEmployeeConsultant` (852, 94%), `idEmployeeInstructor` (150, 17%, só como complemento) e `responsibles` (33, 4%: contato do responsável, provavelmente menores; **só vem com `showsResponsibles=true`**, sem isso aparece vazio).
**Vazios na prática (não trazer agora; medido nos 904 ativos, 21/10/2026):** `whatsappUsername`, `whatsappBsuid`, `accessBlocked`, `blockedReason`, `penalized`, `idMemberMigration`, `idEmployeePersonalTrainer` e `nameEmployeePersonalTrainer`, `idMemberPersonalTrainer` e `nameMemberPersonalTrainer`, `personalTrainer`, `personalType`, `cref`, `crefExpirationDate`, `photoUrl`, `userIdGurupass`, `clientWithPromotionalRestriction`, `usePreferredName`, `accessCardNumber` (1 caso). Todos 0%. Rever se o EVO passar a usá-los.
**Dados pessoais sem uso (não trazer):** `documentId` (RG), `maritalStatus`, endereço, `accessCardNumber`, `photoUrl`, `totalFitCoins`, `registerName`, `registerLastName`, `usePreferredName`.
- **"Profissão" (do Cadastro Aluno no Miro) não existe no cadastro do membro**; precisa vir da anamnese.

## `registerDate` (decidido trazer; medido nos 904 ativos, 21/10/2026) [V]
- **É o instante em que o cadastro de membro foi criado no EVO.** Nos 803 membros que têm `conversionDate`, ele é **idêntico** ao `registerDate` (803 de 803). `conversionDate` preenchido significa "veio de prospect"; sem ele (6 casos com data), o cadastro foi criado direto (agregador automático ou manual).
- **809 de 904 vêm preenchidos (89%).** Os **95 nulos (11%)** são cadastros antigos (`idMember` de 793 a 5486, provavelmente migrados) e **todos têm plano com data de início**: há fallback.
- **1 data inválida** (ano 2106). Descartar datas antes de 2000 ou depois de amanhã.
- **Tempo de casa:** mediana de 24 meses (p25 10, p75 47, máximo 134). 11 ativos cadastrados nos últimos 30 dias.
- **Não serve como "início do treino":** em 19 casos o plano começou mais de 1 ano depois do cadastro (retorno), e em 32 o plano começou mais de 7 dias antes. Para os marcos da régua, usar o início do plano vigente (ou a 1ª aula), e o `registerDate` só para tempo de casa.
- **No Leven:** coluna `students.evo_registered_at` (não usar `created_at`, que é a data em que o Leven importou o registro). Ordem: `registerDate` válido, senão o menor `startDate` entre os planos do membro, senão nulo. Horários sem fuso: assumir Brasília [H].
- Como `registerDate` e `conversionDate` coincidem, **não é preciso uma coluna `converted_at` separada**: a coluna `evo_registered_at` basta, e "veio de prospect" fica no JSON reduzido.

## Plano comercial (como puxar do EVO; medido em 21/10/2026) [V]
- **Fontes:** (1) catálogo `GET /api/v3/membership` (todos os planos, ativos e inativos; resposta em `list`); (2) `GET /api/v2/members?status=1&showMemberships=true` (campo `memberships[]` de cada membro: `idMemberMembership`, `idMembership`, `name`, `startDate`, `endDate`, `cancelDate`, `membershipStatus`, `idCategoryMembership`, `idMemberMembershipRenewed`).
- **Plano vigente** = sem `cancelDate` e `startDate ≤ hoje ≤ endDate`. `membershipStatus = in queue` é renovação já contratada, ainda não iniciada (não é vigente). 105 de 904 ativos têm 2 ou 3 planos vigentes.
- **Modalidade vem do `activitiesGroups` do plano, não do nome:** 274 de 279 planos ativos têm grupos ("Personal Trainer" e "Pilates"), e o que o nome indicava conferiu em **265 de 265** casos.
- **Frequência (1x, 2x, 3x…) só existe no nome do plano.** Dos 159 nomes distintos, 137 (86%) foram interpretados por completo (modalidade, frequência e duração). As exceções: "Permuta" sem duração, "Passaporte da Copa (24 aulas)", "Free Pass (N aulas)", bimestral e quadrimestral, erros de digitação ("5neses"). Para o aluno, **a duração não é necessária** (as datas do contrato bastam); basta a frequência, com tabela de exceções por `idMembership`.
- **Classe (`plan_type`):** a coluna `students.plan_type` usa o catálogo **`student_plan_type`** (Wellhub = `wellhub`, Totalpass = `totalpass`, ClassPass = `classpass`, VIP (Contrato) = `vip`), e **não** o catálogo "Origem do plano" (Fixo, Permuta, Gympass, TotalPass, ClassPass, Campanha), que pertence ao plano de treino (`training_plans.plan_origin_item_id`). [V: hook `useStudentPlanTypes` e banco] O catálogo `student_plan_type` **não tem Fixo, Permuta nem Campanha**. **Decidido (usuária, 21/10/2026): usar o catálogo como está.** Regra: (1) plano vigente com categoria/nome Wellhub, Totalpass ou ClassPass → essa marca (hoje ninguém); (2) plano vigente de categoria **VIP** → `vip`; (3) outro plano vigente → **vazio (= fixo)**; (4) sem plano vigente: `codeTotalpass` → `totalpass`, `gympassId` → `wellhub`, senão a marca do check-in de agregador; (5) senão, inativo. Plano vigente tem precedência sobre os códigos. Resultado nos 904 ativos: **879 vazios (fixo), 22 `vip` (19 com "Permuta" no nome e 3 de campanha ou outros: "Passaporte da Copa", "Recovery (TP)") e 3 sem plano vigente**. Os ids de categoria são iguais nas 4 unidades (VIP = 1); resolver por nome.
- **Limite dessa escolha:** `vip` junta permuta e campanha, e "vazio" não diferencia fixo de "ainda não calculado" (usar `evo_updated_at` para saber se já foi calculado).
- **Vencimento (`plan_end_date`)** = o menor `endDate` entre os planos vigentes.
- **O plano vence sozinho**, sem o EVO mexer no `updateDate` [H]. Por isso um **job diário no próprio Leven** recalcula `active` e `plan_end_date` a partir do que já está guardado, e quem acabou de vencer é relido no EVO para ver se há renovação em fila.
- **Custo:** catálogo ~4 páginas por unidade (362 planos na UMI); membros ativos ~10 chamadas no total. Ids de plano e de grupo **mudam por unidade**.

## Prospects de bloqueio ("Cortesia") não são pessoas [V, UCB, 22/10/2026]
- No EVO, a equipe usa **prospects falsos** para ocupar a capacidade de um horário e bloquear reservas. Na UCB em 22/10 apareceram quatro, todos cadastrados em 2023, com o serviço **"Cortesia"**, sem `idMember` e sem conversão: **"Horário de PAUSA"** (45444), **"Montagem de treino"** (45757), **"Reserva Integrador"** (46004) e **"Falta de Professor"** (46206). Eles somaram **26 das 28 inscrições de prospect** do dia na UCB (46004: 10, 46206: 8, 45757: 5, 45444: 3); só 2 inscrições eram de aula teste de pessoas reais.
- Efeito no EVO: o horário fica **lotado** (`ocupation` igual à `capacity`, a tela mostra "1/1" com ponto vermelho) e o participante aparece como presente com o botão "Marcar ausência".
- **Regra para o Leven:** não são alunos nem AT. A regra da AT (serviço "Aula Teste") já os exclui, e a sincronização de agenda já descarta inscrição sem `idMember`. O que se perde é a informação operacional ("horário bloqueado por falta do professor ou pausa"); se for útil, representar como **bloqueio** de horário, e não como sessão de aluno [DECIDIR].
- Não usar `ocupation` do EVO como lotação real: bloqueios entram na conta.
- **Correção (23/10/2026) [V em 2 casos, H no alcance]:** "Cortesia" **não** é sempre bloqueio. Prospects **reais e recentes** também têm só o serviço "Cortesia": UCB 59341 (cadastro 21/10/2026, canal Indicação, com aula de Personal marcada para 26/10) e UMI 59337 (cadastro 21/10/2026, interesse "PERSONAL TRAINER"); outros dois reais apareceram na grade de 19/10 (UMI 59314 e UP 58740). Os bloqueios se distinguem por serem **antigos (2023) e com nome genérico**. Se a "Cortesia" a pessoas reais funciona como aula teste, a regra de AT por serviço "Aula Teste" **deixa essas pessoas de fora**. Falta medir o tamanho (consulta pequena) e [DECIDIR] se Cortesia com pessoa real conta como AT.

## Como nasce uma pessoa no EVO: prospect, membro direto ou agregador [V na API, UCB, 23/10/2026]
- **Via API só se cria prospect** (`POST /api/v1/prospects`). Não há endpoint para criar membro. O prospect vira membro por `POST /api/v1/prospects/convert` (devolve o `idMember`) ou pelo EVO (venda de plano), e o webhook `CreateMember` avisa ("o prospect virou membro").
- **O vínculo prospect → membro não aparece nos dados:** nos 276 prospects da UCB de 2025 em diante, `idMember` e `conversionDate` vêm vazios; e em `members`, `registerDate` é igual a `conversionDate` (a data em que virou membro, não a do primeiro contato).
- **Agregadores nascem direto como membro, sem prospect:** dos **159 membros** cadastrados na UCB desde 01/08/2026, **139 (87%) têm `gympassId` ou `codeTotalpass`** e nenhum prospect correspondente; **só 1 dos 159** casou com um prospect por e-mail ou telefone. Nascem **inativos** (sem contrato), com check-in de agregador.
- **Membro comum sem prospect:** 19 dos 159 (12%) não casaram com prospect por contato; pode ser cadastro direto na recepção ou contato diferente entre os dois cadastros [H].
- **Ativo e inativo (membro):** ativo = tem contrato vigente; inativo = sem contrato (agregador, ex-aluno).
- **Prospects de bloqueio** (Cortesia) não viram ninguém: são marcadores de horário (veja a seção acima).
- **Para o Leven:** o `registerDate` do membro não é a data do primeiro contato com a academia (para a AT, essa data está no prospect). A conversão da AT não pode ser ligada por id; exige correspondência por documento, e-mail ou telefone, e só ~1% casou por e-mail ou telefone nesta amostra, então vale testar o CPF antes de confiar [H].
