# Mapa da pré-anamnese do Leven (estado em 23/11/2026; atualizado em 24/11/2026 com a remoção da conduta)

Fonte: código lido no projeto Lovable em 23/11/2026 (`supabase/functions/_shared/preanamnesisV2.ts`, RPCs `submit_trial_preanamnesis` e `submit_member_preanamnesis`, CHANGELOG até 11/11) e contagens no banco. Marcas: `[V]` verificado hoje. Nenhum dado pessoal neste arquivo.

## 1. Como o formulário chega ao aluno
| Público | Quem envia | Onde o link nasce | Validade | Condição |
|---|---|---|---|---|
| **Prospect com AT** | Administrador, Coordenador, Supervisor ou Professor **da unidade** (clique: Enviar, Reenviar, Copiar link) | colunas `preanamnesis_*` da aula teste (`student_sessions`) | até o início da aula, no máximo 7 dias | aula futura |
| **Membro ativo** (D2.3) | os mesmos papéis | tabela `preanamnesis_requests` | 7 dias a cada envio | membro ativo com unidade principal |

- Link `…/pre-anamnese#token=<64 hex>`: o token só existe no endereço, o banco guarda **só o hash**; **uso único**; reenvio troca o link (máx. 3 reenvios, 15 min entre eles); 10 tentativas por 15 min.
- **Nada é automático:** o envio automático por e-mail está dormente; só há clique da equipe. E-mail em **modo de teste** (vai ao endereço de teste); nenhuma unidade liberada (`units.trial_email_live` = 0). "Copiar link" funciona sem e-mail. [V]
- Formulário **v2**, uma tela por vez, barra de progresso e cronômetro; saudação com o primeiro nome; ao concluir, tela final e redirecionamento para academialeven.com.br.
- **Modelos de anamnese** (Configurações): existem modelos separados para Prospect e Aluno, onde se escolhe quais perguntas entram e se editam alguns textos; a seleção é congelada no link. **A tabela `anamnesis_models` está vazia [V]: nenhum modelo foi personalizado, então vale o formulário completo abaixo.**

## 2. Perguntas, tela por tela
Legenda: **obrig.** = obrigatória; condição entre parênteses; "sub" = pergunta dependente.

### Tela "Sobre você" (dados)
| ID | Pergunta | Tipo | Regras |
|---|---|---|---|
| PA-01 | Nome completo | texto | obrig.; vem do cadastro, editável; divergência é só sinalizada |
| PA-02 | CPF | máscara | obrig.; 11 números |
| PA-03 | Celular | máscara | obrig.; DDD e número |
| PA-04 | Data de nascimento | máscara DD/MM/AAAA | obrig.; data válida, idade entre 5 e 110 |
| LGPD | "Autorizo a Leven a usar minhas respostas, incluindo informações de saúde, para planejar e acompanhar meus treinos." | aceite | obrig.; versão do texto `lgpd/modelo-2026-10` |
| PA-05 | Profissão ou principal atividade | texto | opcional |

### Objetivos e rotina
| ID | Pergunta | Tipo | Regras |
|---|---|---|---|
| PA-06 | Quais objetivos são importantes para você? | lista agrupada (5 grupos, 27 opções + "Outro objetivo" com texto) | obrig.; marca quantos quiser |
| PA-07 | Escolha até 5 que mais mudariam a sua vida | seleção entre as marcadas | obrig.; **só aparece se marcou mais de 5** |
| PA-08 | Quantos dias por semana consegue treinar? | 1 a 6 dias | obrig. |

Grupos de PA-06: Composição corporal (3), Força e capacidade física (8), Saúde e funcionalidade (8), Bem-estar (7), Complementar (Outro).

### Saúde e segurança
| ID | Pergunta | Tipo | Regras |
|---|---|---|---|
| PQ-01 a PQ-07 | **PAR-Q** (7 perguntas: coração com supervisão, dor no peito ao exercitar, dor no peito no último mês, tontura ou perda de consciência, problema ósseo ou articular, remédio para pressão ou coração, outra razão para não praticar) | Sim/Não | obrig.; **só de 15 a 69 anos** |
| PQ-08 | "Declaro que respondi com sinceridade" | aceite | obrig. |
| IDADE | Menor de 15: "Vou levar a autorização do meu responsável". 70 ou mais: "Vou levar o atestado médico" | aceite | substitui o PAR-Q fora da faixa |
| PQ-09 | **Termo de Responsabilidade** (Anexo II da Lei SP 16.724/2018) | aceite | **só se houver "Sim" no PAR-Q**; texto `anexo-ii-lei-sp-16724-2018/modelo-2026-10` |
| PA-09 | Diagnóstico de alguma condição? | lista de 21 (Hipertensão, Diabetes, Colesterol alto, Problemas cardíacos, respiratórios, musculares, articulares, de coluna, gástricos, Gestação ou pós-parto, Osteoporose ou osteopenia, Labirintite ou tontura, Epilepsia, Câncer, AVC, Hérnia, Artrose, Ansiedade, Insônia, Outra condição com texto, **Nenhuma** exclusiva) | obrig. |
| PA-10 | Dor, lesão ou limitação atual? | Sim/Não | obrig. |
| PA-11 | Onde, há quanto tempo e se procurou profissional | texto | obrig. se PA-10 = Sim |
| PA-12 | Lesão ou cirurgia que ainda interfira? | Sim/Não | obrig. |
| PA-13 | Qual foi e como está (qual, há quanto tempo [4 faixas], limita movimentos [S/N], já procurou profissional [S/N]) | estruturada | obrig. se PA-12 = Sim |
| PA-14 | Medicamento de uso contínuo? | Sim/Não | obrig. |
| PA-15 | Qual e para qual finalidade | nome + motivo | obrig. se PA-14 = Sim |

### Rotina, atendimento e histórico
| ID | Pergunta | Tipo | Regras |
|---|---|---|---|
| PA-16 | No trabalho você fica: Sentado, Em pé, Alternando | única | opcional |
| PA-17 | Outras atividades, esportes ou hobbies | texto | opcional |
| PA-18 | Rotina de atividade física hoje | semana (texto por dia, segunda a domingo) | opcional |
| PA-19 | O que é mais importante no atendimento do professor | até 3 de 8 opções (+ Outro) | opcional |
| PA-20 | Algo que prefere que o professor evite | texto | opcional |
| PA-21 | Situação atual: treina regularmente / parado mas já treinou / nunca treinou | única | obrig. |
| PA-22 | Há quanto tempo treina sem interrupções | 6 faixas | obrig. se "treina regularmente" |
| PA-23 | Há quanto tempo está sem treinar | 6 faixas | obrig. se "parado" |
| PA-24 | Antes da pausa, por quanto tempo treinou | 6 faixas | obrig. se "parado" |
| PA-25 | Quais atividades já praticou | 8 opções (+ Outro) | aparece se já treinou |
| PA-26 | Que atividades mais interessam | 10 opções (+ Outro) | opcional |
| PA-27 | O que pode dificultar frequência | 11 opções (+ Outro) | opcional |

Faixas de tempo: menos de 3 meses, 3 a 6, 6 a 12, 1 a 2 anos, 2 a 3, mais de 3.

## 3. O que o sistema calcula das respostas (alertas)
O servidor deriva, sem confiar no navegador: idade, regra de idade (menor de 15, PAR-Q, 70+), data de nascimento, se há "Sim" no PAR-Q, **contagem de alertas** e status de liberação.
- **Alertas:** PAR-Q com "sim" (crítico); menor de 15 (autorização do responsável); 70 ou mais (atestado); dor atual (PA-10); lesão ou cirurgia (PA-12); medicamento (PA-14); condições marcadas (PA-09).
- **Liberação e conduta: removidas (decisão de 24/11/2026).** Não há mais selo "Bloqueada, aguardando conduta", campo Conduta no roteiro nem trava para encerrar a AT; os alertas continuam como selos informativos. Mantido: termo do PAR-Q (PQ-09), exigência legal. Mesclado em `main` (`6771dde`); **falta publicar o site**.

## 4. Onde as respostas são gravadas
| Destino | O que vai |
|---|---|
| `student_anamnesis_versions` (origem `client_pre`, v2) | payload completo em JSONB; profissão (PA-05); queixas (PA-11); limitações (PA-13 qual); preferências (PA-20); LGPD e termo com data e hora e versão do texto; PAR-Q (data, idade, se há "sim"); identidade declarada e divergências (nome, CPF, celular, nascimento) |
| `student_medications` | PA-15 |
| `student_injuries` | PA-10/PA-11 e PA-12/PA-13 |
| `student_conditions` | PA-09, só os rótulos que existem exatamente no catálogo `clinical_conditions` |
| `student_goals` | PA-06, só os rótulos que existem no catálogo `training_goals` |
| `anamnesis` (anamnese vigente) | **só prospect**: queixas, limitações, medicamentos (faz upsert). **Membro não escreve aqui.** |

O que não casa com o catálogo fica só no payload.

## 5. O que o professor vê e faz depois
- **Resumo da pré-anamnese** (cartão na ficha e na tela da AT): objetivos prioritários, frequência, histórico, atenção, PAR-Q, rotina, preferências, barreiras, o que valoriza no professor, o que prefere que evite, e "Aprofundar na conversa".
- **Roteiro presencial AP-01 a AP-09:** momento e expectativa; objetivos (com as prioridades do aluno); experiências anteriores (gostou, não funcionou, importante saber); preferências e aversões; barreiras (uma pergunta por barreira marcada); **Saúde e segurança (AP-08)**, só se houver dor, lesão, cirurgia, medicamento, condição ou "sim" no PAR-Q (localização, quando ocorre, movimentos que pioram, impacto funcional, acompanhamento, orientações recebidas, documento do PAR-Q; **sem campo de conduta**); fechamento ("algo importante que eu não perguntei").
- **Resumo de IA** gerado ao salvar a anamnese (consentimento exigido, máx. 1.000 tokens; novo bloco "Indicação" para Fisioterapia, Pilates ou Recovery, já aplicado no banco); aviso ao coordenador na primeira IA de um prospect com unidade.

## 6. Uso e estado [V, 23/11/2026]
- 7 respostas do aluno, todas v2, a última em **28/10/2026**; 0 em v1. 3 envios e 7 preenchimentos em ATs (preenchimentos por cópia de link). Membros: 1 solicitação criada, **0 preenchida**.
- 37 ATs nos últimos 30 dias. E-mail ligado no tenant, em modo de teste.
- Publicação: o CHANGELOG indica **pendentes de publicação** `preanamnesis-public`, `member-preanamnesis`, `send-transactional-email` e o site, para os modelos e o fluxo do membro; confirmar antes de testar no domínio.

## 7. Observações e lacunas
1. **Não coleta hoje:** altura e peso, contato de emergência, pressão arterial ou outras medidas, sono, tabagismo ou álcool, horários preferidos de treino, como conheceu a Leven, e-mail (vem do cadastro). Decidir se alguma entra no modelo.
2. **Textos legais** (Termo e LGPD) ainda **sem validação jurídica**; o LGPD não cita o tratamento por IA de terceiros nem o consentimento de responsável para menores de 15.
3. **Coleta de CPF, celular e nascimento** na pré-anamnese: o CPF poderia alimentar o vínculo de pessoa entre unidades e a conversão prospect → membro; hoje divergências só são sinalizadas, nunca aplicadas.
4. **PAR-Q só de 15 a 69 anos:** fora disso o aluno apenas confirma que levará autorização ou atestado.
5. **Modelos vazios:** não há personalização por tenant; o botão de modelos já existe.
6. **Dependências entre perguntas:** PA-07 só aparece com mais de 5 objetivos; PA-22 a PA-25 dependem de PA-21; PA-11, PA-13 e PA-15 dependem de Sim.
