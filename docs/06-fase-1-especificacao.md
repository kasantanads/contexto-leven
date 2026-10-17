# Fase 1: entrada automática da AT (RASCUNHO)

**Estado: rascunho. Não enviar ao agente do Lovable antes de fechar D1, D2, D3, D6 e D7 em `05-decisoes.md` e de corrigir A1 e A2.**

## Objetivo
Quando uma AT é marcada na grade do EVO, o Leven passa a conhecer a pessoa, com a aula, o professor e o canal de origem, e acompanha a AT até o fechamento (ou não).

## Entradas (todas em leitura no EVO)
1. `GET /api/v1/prospects` com `registerDateStart` incremental, por unidade.
2. `GET /api/v1/prospects/services` para classificar: AT Personal, AT Pilates, Cortesia ou outro.
3. `GET /api/v2/activities/member/sessions` com `idProspect` e `dateEnd` no futuro.
4. `GET /api/v2/members` com `conversionDateStart` para detectar o fechamento.

## Comportamento esperado
- Criar o registro da pessoa no Leven (aluno ou lead, conforme D1) com: unidade, canal de origem, modalidade da AT, data/hora, professor da sessão, presença.
- Status de funil do aluno: **AT agendada → AT realizada → fechou ou não fechou** (nomes a confirmar).
- AT reagendada: seguir D4 e D5.
- Quando o prospect fechar, o mesmo registro passa a ser o aluno. Sem duplicar. Ligação por D7.
- Marcar a sessão como **experimental**, e não "regular".
- Presença lida de `presenca` / `falta` / `faltaJustificada` (P4).

## Cuidados
- **Limite de 40 req/min por chave.** Sincronização incremental e agendada (cron). Nada de varrer a grade horário a horário.
- Ids de serviço e de atividade **por unidade** (`02-evo-api.md`).
- Detectar AT por `experimentalClass` + valor 0 + grupo Personal/Pilates, não por id fixo.
- Nunca gravar dados pessoais em log.

## Pré-requisitos
- A1: corrigir a leitura de presença.
- A2: recalcular "ativos" pelo EVO.
- Decisões D1, D2, D3, D4, D5, D6, D7.

## Fora do escopo desta fase
Pré-anamnese, resumo para o Coordenador, régua, nota de intensidade, novo ciclo (Fases 2 a 6).

## Como validar
- Em cada unidade, comparar as ATs do mês no EVO com as do Leven (contagem e presença).
- Conferir um caso real de AT que fechou e um que não fechou.

## Proposta: carga de teste das aulas teste (outubro/2026) — rascunho para revisão
Status: proposta, nada enviado ao Lovable. Decisões em aberto marcadas com [DECIDIR].

### Onde guardar (sem tabela nova)
- `students`: uma linha por prospect, com colunas novas `lifecycle_stage` (texto, padrão `member`; prospect = `prospect`), `evo_prospect_id` (texto; índice único por unidade), `lead_channel` (canal, de `mktChannel`) e `lead_signup_type` (de `signupType`). Reaproveita `name`, `email`, `cpf`, `phone`, `birth_date`, `sex`, `primary_unit_id`, `evo_registered_at`, `evo_data` (JSON do prospect) e `origin='evo'`.
- `student_sessions`: `type='experimental'` (exige ajustar o trigger `validate_student_session`), mais colunas novas `evo_attendance` (`present`/`absent`/`justified`, vindo de `statusID`) e `evo_finalized` (booleano, de `isFinalized`). `evo_schedule_id` = `{idActivitieSession}-p{idProspect}` (evita colisão com o formato dos membros).
- Janela do teste: prospects cadastrados de 01/09 a 31/10/2026, guardando só sessões com data em outubro (quem se cadastrou em setembro e tem AT em outubro entra).

### Mapeamento de campos
| Destino no Leven | Origem no EVO |
|---|---|
| `students.name` | `firstName` + `lastName` |
| `students.phone` | `cellphone` (só dígitos) |
| `students.email`, `cpf`, `birth_date`, `sex` | `email`, `document`, `birthDate`, `gender` (F/M vira Feminino/Masculino) |
| `students.primary_unit_id` | `idBranch` |
| `students.evo_registered_at` | `registerDate` |
| `students.lead_channel`, `lead_signup_type` | `mktChannel`, `signupType` |
| `students.evo_prospect_id` | `idProspect` |
| `student_sessions.scheduled_at`, `duration_minutes` | `date` + `startTime`, `endTime` |
| `student_sessions.modality_value` | `idActivitie` pelo mapeamento por unidade |
| `student_sessions.teacher_id` | `instructor` (pelo nome, como o sync atual) |
| `student_sessions.status` | `scheduled` se não finalizada; `done` se presente e finalizada; `absent` se falta; `canceled` se falta justificada [DECIDIR] |

### Onde aparece
1. **Agenda** (professor e coordenador): selo "Aula teste" na sessão, com modalidade, horário, professor e situação. Hoje só existe o selo "Reposição".
2. **Visão "Aulas teste"** no coordenador (aba junto de "Alunos da Unidade"): data/hora, nome, unidade, modalidade, professor, situação, canal, tipo de cadastro e se converteu.
3. **Ficha do prospect**: etiqueta "Prospect", canal e data de cadastro; sem Jornada nem plano de treino.
4. **Fora das listas e contagens de alunos**: prospects não entram em "Alunos da Unidade", em contagens de ativos nem em dashboards (`active=false` e filtro por `lifecycle_stage`) [DECIDIR].

### Cuidados já conhecidos
- A Agenda só mostra sessão com `teacher_id`; AT sem professor identificado não aparece.
- A lista de reposições pendentes pega `absent`, `canceled` e `no_show`: AT faltosa não pode virar reposição.
- O trigger de conflito de professor barra Pilates em grupo; precisa isentar `experimental`.
- Cada mudança de status gera evento na jornada (A12): AT não deve gerar evento crítico.
- Conversão: `idMember` vem vazio nos prospects (verificado), então ligar prospect a membro exige outra regra [DECIDIR]. Fora do teste de outubro.

## Proposta: presença do EVO e conclusão automática da sessão — rascunho para revisão (23/10/2026)
Origem: a usuária observou que no EVO a aula "nasce com presença" e o professor só marca falta ou falta justificada; no Leven a sessão deve nascer como **agendada** e virar **concluída** sozinha quando o horário da aula passar. Status: proposta, nada enviado ao Lovable. Decisões em aberto marcadas com [DECIDIR].

### Estados e transições
| Situação no EVO | Horário da aula | Status no Leven |
|---|---|---|
| Presença (0), padrão | antes do fim | `scheduled` |
| Presença (0), padrão | **depois do fim** (com ou sem finalização no EVO) | `done` (automático) |
| Falta (1) | qualquer | `absent` |
| Falta justificada (2) | qualquer (pode ser marcada antes da aula) | `canceled` (e `evo_attendance = 'justified'`) |
| Inscrição removida | qualquer | preserva o status anterior |
- `evo_finalized` e `evo_attendance` continuam sendo gravados: a finalização no EVO deixa de definir o status e passa a ser só indicador de qualidade ("professor não finalizou").
- Fim da aula = `scheduled_at + duration_minutes`. [DECIDIR] tolerância após o fim (por exemplo 0 a 15 min).

### Onde a regra roda
1. **Mapeador do EVO** (`evo-sync-schedules/mapping.ts`, já corrigido hoje por outra pessoa): hoje presença sem finalização vira `scheduled`, o que **desfaria** uma conclusão automática a cada sincronização. Mudar para: presença com o fim da aula já passado vira `done`, mesmo sem finalização.
2. **Conclusão automática no banco**: função SQL `auto_complete_past_sessions()` agendada no `pg_cron` (já existe um job, `gamify-calculate-daily`, às 06:00) a cada 5 a 10 minutos: `scheduled` com fim da aula passado e sem falta ou justificada conhecida vira `done`. Vale para sessões de qualquer origem; cobre também as criadas no Leven (reposição, remarcação).
3. **Tempo real**: webhook `EndedSessionActivity` (ou consulta periódica) dispara a leitura do detalhe daquela aula, para trocar `done` por `absent` ou `canceled` logo que o professor marcar falta.

### Riscos e efeitos conhecidos [V, banco em 23/10/2026]
- **1.438 sessões passadas ainda estão `scheduled`** (1.257 com mais de 30 dias). A primeira execução as moveria todas para `done`.
- O trigger `create_journey_event_on_session_status` cria um evento "Treino concluído" a cada mudança para `done`: seriam **~1.438 eventos** na primeira passada e ~800 por dia depois. [DECIDIR] suprimir o evento nas conclusões automáticas (por exemplo, marcador de transação lido pelo trigger) ou manter.
- Janela de erro: entre o fim da aula e a próxima leitura do EVO, uma falta marcada pelo professor ainda aparece como `done`. Reduz com webhook ou consulta a cada poucos minutos; a falta tardia corrige sozinha na sincronização seguinte.
- Falta marcada pelo professor **depois** da conclusão automática: o EVO é a fonte e sobrescreve (`done` → `absent`).
- [DECIDIR] carga inicial: concluir todo o histórico ou só os últimos N dias (as de março ficariam como estão ou entrariam por uma sincronização do mês).
- [DECIDIR] aulas teste seguem a mesma regra (viram "Compareceu" ao passar o horário)?
- Remover o estilo "Pendente" (aula passada ainda `scheduled`) da Agenda só depois que a conclusão automática estiver rodando.

## Proposta: captura do primeiro contato e da jornada da pessoa (prospect, agregador, membro) — rascunho (23/10/2026)
Pedido da usuária: capturar no Leven o **primeiro contato** de cada pessoa (prospect, membro, agregador etc.). Status: proposta, nada enviado ao Lovable. Sem tabela nova; colunas novas permitidas. Decisões em aberto marcadas com [DECIDIR].

### Definição
**Primeiro contato** = a primeira vez que a pessoa aparece no EVO, com a origem. O `created_at` do Leven não serve (é a data de importação).

| Como a pessoa entra | Data do primeiro contato | Origem | Fonte no EVO |
|---|---|---|---|
| Prospect (inclui AT e lead sem aula) | `registerDate` do prospect | canal (`mktChannel`) e tipo (`signupType`) | `GET /api/v1/prospects?registerDateStart=` |
| Prospect que virou membro | `registerDate` **do prospect** (a do membro é a da conversão) | idem; conversão em `conversionDate` do membro | prospect + `GET /api/v2/members?conversionDateStart=` |
| Agregador (Wellhub, Totalpass) | `registerDate` do membro (nasce direto, inativo) | agregador (`gympassId` ou `codeTotalpass`; check-ins `aggregator`) | `GET /api/v2/members?registerDateStart=` |
| Membro cadastrado direto | `registerDate` do membro | desconhecido | idem |
| Membro antigo sem data (≈11%, migrado) | não conhecida; usar início do primeiro contrato ou marcar "migrado" | `migrated` | `idMemberMigration`, contratos |

### Onde guardar
- **Colunas novas em `students`:** `first_contact_at` (timestamptz), `first_contact_source` (`prospect`, `aggregator`, `member_direct`, `migrated`), `converted_at` (data em que virou membro). Reaproveita: `lead_channel`, `lead_signup_type`, `evo_prospect_id`, `evo_member_id`, `evo_registered_at`, `lifecycle_stage`, `plan_type`.
- **Linha do tempo na jornada, sem tabela nova:** eventos em `student_journey_events` com `event_date` = a data **histórica** do marco (a coluna existe) e `source_module = 'evo'`: "Primeiro contato" (`relationship`), "Aula teste agendada" e "Aula teste realizada" (`session`; criados pela sincronização, porque o trigger já ignora aula teste), "Convertido em membro" (`relationship`), "Plano contratado" (`plan`). Sem repetir: não inserir se o mesmo marco já existe para a pessoa.
- **Derivado, sem coluna:** primeira aula realizada = menor `scheduled_at` de sessão `done`.

### Como capturar
1. **Prospects:** consulta por unidade a cada ciclo (`registerDateStart` = última leitura), 1 chamada por unidade. Volume baixo (UCB: 276 prospects em 2025 e 2026).
2. **Membros novos (agregadores inclusive):** `registerDateStart` por unidade, 1 chamada por ciclo. Importar **também os inativos**, que hoje ficam de fora (A16). Volume UCB: 95 desde 01/09/2026.
3. **Conversão:** contratos novos (`membershipStartDateStart`) e membros novos (`conversionDateStart`); ligar ao prospect por CPF, depois telefone, depois e-mail. Webhook `CreateMember` como acelerador.
4. **Webhooks** `AppointmentEnroll` e `CreateMember` aceleram, mas a consulta periódica continua como rede de segurança (a entrega não tem garantia documentada).

### Uma pessoa, uma linha
- Quando a conversão é reconhecida, **a linha do prospect passa a ser a do membro**: preenche `evo_member_id`, `lifecycle_stage = 'member'`, `converted_at`, e mantém `evo_prospect_id` e `first_contact_at`. Se o membro já foi importado antes como linha separada, **fundir** (mover sessões e eventos para a linha do prospect, ou o contrário); apagar a duplicada é permanente e exige OK explícito.
- Se o sync de membros encontrar um membro que casa com um prospect existente, **anexa** em vez de criar outra linha.

### Prospects que não são pessoas
- Bloqueios (Cortesia antigos com nome genérico: "Horário de PAUSA", "Falta de Professor" etc.) **não** entram como primeiro contato. Critério [DECIDIR]: lista de ids por unidade, ou "Cortesia + cadastro antigo + sem contato".
- "Cortesia" com pessoa real e recente **é** primeiro contato; se também conta como aula teste é [DECIDIR].

### Carga inicial (sem chamar o EVO)
- Dos 7.200 alunos: `first_contact_at` = `registerDate` do `evo_data` (6.639 com data); os ≈561 sem data ficam `migrated` com `first_contact_at` nulo. `first_contact_source` = `aggregator` se `evo_data` tem `gympassId` ou `codeTotalpass`, senão `member_direct`.
- Os 69 prospects de teste já gravados: `first_contact_at` = `evo_registered_at`, `first_contact_source = 'prospect'`.

### Decisões
1. Importar todos os membros inativos novos ou só os que têm aula agendada?
2. Quais prospects de bloqueio ignorar e como identificá-los?
3. Cortesia com pessoa real conta como aula teste?
4. Registrar o consultor que captou (`idEmployeeConsultant` no membro) numa coluna?
5. Fundir linhas duplicadas já existentes?

## Proposta: pessoa duplicada em várias unidades — rascunho (23/10/2026)
Pedido da usuária: um membro pode estar cadastrado em duas unidades (fixo duplicado), e agregador também. Status: proposta, nada enviado ao Lovable. Sem tabela nova.

### O que medi [V, 23/10/2026, só contagens]
- **No EVO hoje (8 chamadas, 4 unidades):** 890 membros ativos, 872 com CPF; **só 5 pessoas ativas em mais de uma unidade** (por CPF). Agregadores cadastrados desde 01/01/2026 (inativos com `gympassId` ou `codeTotalpass`): 1.816 cadastros, 1.442 com CPF; **101 CPFs em mais de uma unidade** e **75 códigos de agregador em mais de uma unidade**. Ativo em uma unidade e agregador em outra: 1.
- **No Leven:** 7.235 linhas de membro, 6.863 com CPF; **1.200 CPFs repetidos** (3.070 linhas), **1.198 deles em unidades diferentes**, 2 na mesma unidade; 887 pares de nome e nascimento repetidos. A grande maioria é **histórico** (a pessoa passou por mais de uma unidade ou tem cadastro antigo), e não duplicidade viva: o `active` do Leven está desatualizado (A2) e não serve para medir isso.
- **Cobertura de chave:** CPF em 95% das linhas do Leven, 98% dos ativos do EVO e 79% dos agregadores recentes.

### Princípio
EVO é multiunidade: a mesma pessoa tem **um cadastro por unidade**, com `idMember` diferente. No Leven, cada cadastro do EVO continua sendo **uma linha** (não fundir: evita apagar ou misturar sessões, presença e eventos). O que falta é dizer que várias linhas são **a mesma pessoa**.

### Solução: chave de pessoa, sem fundir
- **Coluna nova em `students`: `person_key` (texto, indexada, não única).** Linhas com a mesma chave são a mesma pessoa.
- **Como calcular (da mais forte para a mais fraca):**
  1. CPF (só dígitos) → `cpf:NNNNNNNNNNN`: vínculo **automático**.
  2. Sem CPF, agregador: provedor + código (`gympassId` ou `codeTotalpass`) → `agg:wellhub:CODIGO`: vínculo automático.
  3. Sem nenhum dos dois: e-mail + data de nascimento, ou telefone + nome: **só sugerir**, nunca vincular sozinho [DECIDIR].
- **Carga inicial sem chamar o EVO:** `person_key` a partir do CPF das 6.863 linhas, e do código de agregador no `evo_data` quando houver; o resto fica vazio.
- **Linha nova no sync:** calcula a chave ao gravar; prospect e membro da mesma pessoa compartilham a chave (isso também resolve a conversão da AT, sem depender de id).

### Onde a chave muda o comportamento
| Onde | Regra |
|---|---|
| Contagem de alunos por unidade | continua por linha (a pessoa conta em cada unidade em que treina) [DECIDIR] |
| Contagem da rede (supervisor, admin) | **pessoas distintas** (`count(distinct person_key)`) |
| Régua e tarefas de contato | **uma pessoa, um contato** (não inscrever duas linhas da mesma chave) |
| Primeiro contato | `first_contact_at` da pessoa = o **menor** entre as linhas; origem da linha mais antiga |
| Conversão da AT | casar o prospect com **qualquer** linha de membro da mesma chave |
| Agenda, presença, sessões | seguem por linha, sem mudança |
| Ficha do aluno | aviso "Mesma pessoa em: Unidade X, Unidade Y" com link para as outras linhas |
| Tipo de plano | por linha (fixo na unidade A e agregador na B é possível) |

### Casos de dado ruim
- **Mesma pessoa, CPF diferente ou vazio** (erro de digitação): não vincula; aparece só como sugestão por e-mail e nascimento.
- **CPF compartilhado por engano** (familiar, CPF do responsável): conferir antes de confiar; marcar chaves com mais de 2 linhas na mesma unidade para revisão (2 hoje).
- **Transferência de filial:** o EVO tem `TransferMember`/`TransferProspect` (webhooks e `POST .../transfer`); não sei se cria `idMember` novo [H]. Com a chave, a pessoa continua ligada.

### Decisões
1. A pessoa conta uma vez por unidade ou só uma vez na rede nas telas por unidade?
2. Vínculo automático só por CPF e código de agregador, e o resto como sugestão?
3. Tela de revisão manual das sugestões (admin) agora ou depois?

### Nota: chave mãe e filhos por unidade (pergunta da usuária, 23/10/2026)
- **Modelo:** a "mãe" é a pessoa e os "filhos" são os cadastros por unidade. É o que a `person_key` já faz: a chave é a mãe (virtual, sem linha própria) e cada linha de `students` é um filho, identificada na unidade por `primary_unit_id` + `evo_member_id` (ou `evo_prospect_id`).
- **Alternativa avaliada:** mãe como **linha** (coluna `parent_student_id` apontando para outra linha de `students`, sem tabela nova). Prós: hierarquia explícita e um lugar para dados da pessoa. Contras: exige escolher qual linha é a mãe e **atualizar linhas existentes** (é a carga); a mãe também é um cadastro de unidade e contaria em dobro nas telas por unidade; chegada de um terceiro cadastro obriga a reapontar; correção de CPF obriga a reapontar; mãe apagada ou inativa orfana os filhos.
- **Decisão proposta:** manter a chave (mãe virtual) agora; dados da pessoa vêm do cadastro mais antigo do grupo (consulta, sem coluna). Criar uma linha-mãe só se surgir muito dado exclusivo da pessoa (consentimento, contato preferido, histórico) [DECIDIR].

### Decisão da usuária e ajustes: pessoa única no grupo, visão por unidade (23/10/2026)
**Pedido:** o CPF é único e a academia é um grupo; quem tem ou teve cadastro em outra unidade, e o mesmo código de agregador, deve ser tratado como **uma pessoa**; ao escolher uma unidade, aparecem os apontamentos daquela unidade. Vale quando a carga for feita.

**Concordância e forma:** pessoa única **por apresentação**, mantendo uma linha por cadastro do EVO (a sincronização grava por `evo_member_id`; fundir as linhas quebraria isso, apagaria histórico e exigiria ação destrutiva). A chave `person_key` agrupa as linhas; as telas mostram uma pessoa.

**Comportamento nas telas**
| Tela | Regra |
|---|---|
| Busca e lista da rede (sem unidade escolhida) | **uma linha por pessoa**, com as unidades como etiquetas; ativa se estiver ativa em qualquer unidade |
| Lista com unidade escolhida | só quem tem cadastro **naquela unidade**; o detalhe mostra os dados daquela unidade |
| Ficha da pessoa | seletor de unidade (padrão: a unidade escolhida; opção "todas"): sessões, presença, professor, tipo de plano e status por unidade; aviso "Também em: ..." |
| Dados da pessoa (primeiro contato, régua, contatos) | uma vez, no nível da pessoa (menor `first_contact_at` do grupo; um contato por pessoa) |
| Dados clínicos (anamnese, lesões, restrições, alertas) | **valem entre unidades** (união das linhas do grupo), por segurança |
| Contagens | unidade: pessoa conta onde tem cadastro ativo; rede: pessoas distintas |

**Segurança da chave [V, banco do Leven, 23/10/2026]:** de 6.863 linhas com CPF, 11 têm tamanho errado e 1 tem todos os dígitos iguais; dos 1.200 CPFs válidos repetidos, **52 grupos (4,3%) têm primeiro nome diferente e 41 (3,4%) têm datas de nascimento diferentes** (CPF de responsável ou familiar, ou erro de digitação); 520 grupos têm mais de 2 cadastros e o maior tem 4. Regra de vínculo: **automático** se o CPF é válido (11 dígitos, não todo igual, dígitos verificadores corretos) e o grupo **não** tem conflito forte (primeiro nome **e** data de nascimento diferentes); com conflito, **não vincular**, marcar para revisão. Mesma regra para o código de agregador.

**Dados clínicos hoje:** quase vazios (anamnese 0, lesões 8 linhas em 3 alunos, restrições 29 em 5), então a divisão por linha ainda tem pouco impacto, mas deve ser resolvida antes de a base clínica crescer.

**Decisões:** (1) regra de conflito acima; (2) dados clínicos entre unidades, somente leitura nas outras linhas; (3) lista da rede com uma linha por pessoa.
