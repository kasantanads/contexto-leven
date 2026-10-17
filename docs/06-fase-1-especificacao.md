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
