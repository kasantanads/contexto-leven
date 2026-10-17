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
