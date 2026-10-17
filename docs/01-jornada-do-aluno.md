# Jornada do aluno: Miro × Leven hoje × lacunas

Fonte do desenho: mapa mental do Miro "Sistema Treino" (leitura em 16/10/2026). Estado do Leven: leitura do código do projeto "Leven Treinos" em 16/10/2026 (não lemos `StudentDetail`, `StudentEdit`, `TrainingEditor`, `Signup`, nem o agendamento e as migrations).

O sistema **começa no Agendamento da AT**. O 1º contato (RD Station) fica fora do sistema.

**O que o Leven chama de "Jornada do Cliente" é outra coisa:** um score de risco (sem treino, faltas, avaliação vencida, plano vencendo, alerta crítico), sem noção de etapa.

| # | Etapa do Miro | Estado no Leven | Lacuna | Fase |
|---|---|---|---|---|
| 1 | **Agendamento da AT** → cadastro no EVO → grade → **cadastro automático** no sistema | AT de prospect é descartada (`evo-sync-schedules` ignora `idProspect`). `evo-sync` só importa membros ativos. Sincronização manual, por botão, mês a mês. | Criar o aluno/lead a partir do prospect com AT. Sincronização automática e incremental. | 1 |
| 2 | **Aula experimental**: pré-anamnese, anamnese, resumo para o Coordenador, finalizar AT | Anamnese versionada existe, com resumo por IA e PDF. Não existe pré-anamnese do aluno nem resumo focado em venda. Não dá iniciar sessão sem plano ativo. | Pré-anamnese, resumo para o Coordenador, "finalizar AT", AT sem plano. | 2 |
| 3 | **Fechamento do plano** (atualizar EVO) | Não existe conceito de fechamento nem de conversão. | Detectar o fechamento (membro com `conversionDate`), preencher o plano, registrar "não fechou". | 3 |
| 4 | **1ª aula**: Leven Performance, régua | Sem referência a "Leven Performance". Nada dispara a régua. | Definir o que é "Leven Performance" e disparar a régua na 1ª aula. | 4 |
| 5 | **Aula**: abrir aula → iniciar → finalizar → **nota de intensidade** | Iniciar e finalizar existem, com cronômetro e RPE por exercício. **Não há nota de intensidade da aula.** Fecha sozinha 10 min depois do tempo planejado (o Miro não prevê). | Nota de intensidade ao finalizar. Decidir sobre o fechamento automático. | 4 |
| 6 | **Régua de contato** (barreiras, preenchimento pessoal, envio) | Existe régua de **tarefas de contato** (etapas por dia, canal, modelo de mensagem). Inscrição manual e contada a partir de **hoje**. | Confirmar o conceito. Marcos de 30 dias a 11 meses contados do início do plano ou da 1ª aula. Inscrição automática. | 5 |
| 7 | **Novo ciclo de treino** (resumo de resultados ao aluno) | Plano tem `end_date`, e "plano vencendo" soma pontos no score. Sem resumo ao aluno. | Renovação guiada, resumo de resultados, prorrogação automática. | 6 |
| — | **Etapa visível do aluno** | Não existe campo de etapa. | Campo de etapa e linha do tempo, separados do score de risco. | 7 (transversal) |

## Ordem
```
Fase 0 (feita) → 1 → 2 → 3 → 4 → 5 → 6
                     ↘ 7 acompanha cada fase
```
1 a 3 formam o bloco de **entrada** e dependem uma da outra. Antes da Fase 1, corrigir a leitura de presença e a lista de ativos (veja `04-achados-e-bugs.md`).

## Pendências do Miro ainda sem dono
- Motivo de não renovação e de cancelamento.
- Prorrogação automática do período de treino quando o aluno falta alguns dias.
- Avaliação do PT aos 30 e 80 dias (Coordenador e Supervisor).
- Avaliação da aula pelo aluno.
- Wearables e HealthScore (o score atual do Leven pode ou não ser o mesmo conceito).
- Nome do sistema (o app mostra "Evolution", o projeto "Leven Treinos", o plano antigo "Gym :Ops").
- Indicadores dos dashboards (renovação, evasão, conversão da AT, ocupação, assiduidade): fórmulas no Miro, ainda não confirmadas.
