# AP-08 "Saúde e segurança" obrigatório na conversa presencial (estrutura, NÃO implementado)

Estado: proposta de 25/11/2026 para revisão. Nada foi alterado no código, no banco nem no Lovable. Fonte: leitura do `main` do projeto Leven Treinos e do banco (só leitura). Sem dados pessoais.

## 1. Pedido
Na conversa presencial, o bloco **Saúde e segurança (AP-08)** deve ser de preenchimento obrigatório quando a pré-anamnese tiver **dor, lesão, cirurgia, medicamento, condição clínica ou "sim" no PAR-Q**. Mudanças pelo git, estruturadas e mostradas antes de implementar.

## 2. Como é hoje [V, leitura do código e do banco, 25/11/2026]
| Peça | Onde | Comportamento |
|---|---|---|
| Quando o AP-08 aparece | `presentialScript` e `hasHealth` em `supabase/functions/_shared/preanamnesisV2.ts` | Já aparece exatamente nos gatilhos do pedido: PAR-Q com "sim", condições do PA-09 (exceto "Nenhuma"), PA-10 (dor/lesão atual), PA-12 (lesão/cirurgia que interfere), PA-14 (medicamento contínuo). |
| Campos do AP-08 | `src/lib/presentialHealth.ts` | Localização, Quando ocorre, Movimentos que pioram, Impacto funcional, Acompanhamento profissional (Sim/Não), Orientações ou restrições (opcional), Documento do PAR-Q (só com PAR-Q "sim"). Gravado como texto único em `presential_answers['AP-08']`. |
| Formulário | `src/components/student/PresentialAnswersForm.tsx` | Usado na ficha do aluno (`StudentAnamnesisPage`) e no cartão da pré-anamnese (`PreAnamnesisSummaryCard`). Salvar só exige **uma** resposta qualquer. Nenhum campo do AP-08 é obrigatório. |
| Preparar para salvar | `src/lib/presentialAnswers.ts` (`preparePresentialAnswers`) | Erro só se **todas** as respostas estiverem vazias (`empty_answers`). |
| Servidor | RPC `save_presential_anamnesis` | Valida permissões, chaves `AP-01…AP-09` e tamanho; exige só conteúdo em alguma resposta. **Não conhece** a obrigatoriedade do AP-08. Cria nova versão da anamnese com as respostas. |
| Encerrar a AT | RPC `trial_finish` | Sem nenhuma checagem de saúde (a trava de conduta saiu em 24/11, decisão da usuária). |
| Onde estão as respostas online | `student_anamnesis_versions.preanamnesis_payload` (jsonb), `parq_has_yes` | Servem de base para decidir se o AP-08 é exigido no servidor. |

Dados atuais (versões v2): 21 versões; 11 com conversa presencial salva; 8 com AP-08 preenchido; 17 com gatilho básico (PAR-Q "sim", dor, lesão ou medicamento); **2 versões com gatilho e conversa presencial salva SEM AP-08** (ficariam fora da regra nova até serem editadas).

## 3. Regra proposta
**R1. Exigência.** Se `hasHealth(respostas online)` for verdadeiro, o AP-08 é obrigatório para **salvar** a conversa presencial. Mesma função nos dois lados (tela e servidor), então não há divergência.

**R2. O que conta como "preenchido" (a confirmar, ver pergunta 1).** Proposta mínima:
- **Impacto funcional**: texto obrigatório;
- **Acompanhamento profissional**: Sim ou Não obrigatório;
- **Documento do PAR-Q**: obrigatório só quando houver PAR-Q "sim" (termo aceito na pré-anamnese e/ou atestado apresentado);
- **Localização**, **Quando ocorre**, **Movimentos que pioram** e **Orientações ou restrições**: continuam opcionais, porque não fazem sentido para todo gatilho (ex.: só "hipertensão" ou só medicamento).

**R3. Sem gatilho, nada muda.** Sem dor, lesão, cirurgia, medicamento, condição ou PAR-Q "sim", o AP-08 nem aparece e nada é exigido.

**R4. Versões já salvas não são bloqueadas retroativamente.** A exigência vale quando alguém salva ou edita uma conversa. As 2 versões sem AP-08 só passam a ser cobradas se forem editadas.

## 4. O que muda, por camada (todo o código via git, ramo `feat/ap08-obrigatorio`)
1. **Regra pura (front e função compartilhada):** nova função `healthRequirement(online, fields)` (em `presentialHealth.ts`) que devolve a lista de campos faltantes; reaproveita `hasHealth` e `parqYes`. Testes: cada gatilho (PAR-Q, condição, dor, lesão/cirurgia, medicamento), sem gatilho, e cada campo faltante.
2. **Formulário (`PresentialAnswersForm.tsx`):** rótulo "obrigatório" nos campos exigidos do AP-08; botão "Salvar conversa na anamnese" desabilitado com mensagem curta dizendo o que falta; aviso no topo do cartão do AP-08 quando exigido e vazio. Nenhuma mudança fora do AP-08.
3. **`preparePresentialAnswers`:** lança erro novo `health_required` quando o AP-08 é exigido e está incompleto (a tela mostra a mensagem).
4. **Servidor (migração, aplicada pelo agente do Lovable, só com OK):** `save_presential_anamnesis` passa a recusar com `health_required` quando o payload online tem gatilho e o AP-08 não traz os campos mínimos. Cópia SQL de `hasHealth` (PAR-Q em `parq_has_yes` ou nas chaves PQ-01…07; PA-09 sem "Nenhuma"; PA-10/12/14 = "Sim"). Sem alterar linhas existentes.
5. **Encerrar a AT:** **sem mudança** nesta proposta (ver pergunta 2).
6. **Resumo de IA e demais telas:** sem mudança.
7. **Documentação:** CHANGELOG, diário e este arquivo atualizados.

## 5. Fluxo de trabalho (git)
- Repositório do app: `fernandosmoraes/leventreino` (ligado ao Lovable). Criar o ramo `feat/ap08-obrigatorio` a partir do `main`, commits pequenos, testes e `tsc` rodados, **diff mostrado a você antes de qualquer mescla**. Nada vai para o `main` nem para o Lovable sem o seu OK.
- A migração do servidor (item 4) é pedida ao agente do Lovable depois que você aprovar o código; confiro `last_edited_at` e registro no diário antes de enviar.
- Hoje esta sessão só tem acesso ao repositório de documentação; para trabalhar no do app preciso anexá-lo à sessão.

## 6. Riscos e pontos de atenção
- **Salvar parcial deixa de ser possível** quando o AP-08 é exigido: o professor só consegue salvar a conversa depois de preencher o AP-08. Se ele quiser salvar no meio, perde o rascunho ao sair. Mitigação possível: manter o rascunho local da tela (já existe estado em memória) ou permitir salvar com aviso.
- **Consistência com a decisão de 24/11:** a conduta (liberar ou bloquear) saiu por completo. Esta regra **não traz a conduta de volta**: só exige que o professor registre o que viu, em texto, sem selo de liberação.
- **Membro ativo:** a mesma tela serve membro e prospect; a regra vale para os dois.
- **Divergência tela x servidor:** coberta por usar a mesma regra e por teste com os mesmos casos.
- **Sem CPF/nome** em testes: usar dados fictícios, como nos testes atuais.

## 7. Perguntas para decidir antes de implementar
1. **O que é "preenchido"?** (a) mínimo proposto: Impacto funcional + Acompanhamento profissional + Documento (se PAR-Q "sim"); (b) basta **um** campo qualquer do AP-08; (c) **todos** os campos, exceto Orientações (opcional).
2. **Onde bloquear?** (a) só ao **salvar a conversa** (recomendado); (b) também ao **encerrar a AT** (traz de volta um bloqueio no encerramento, parecido com a conduta que saiu em 24/11).
3. **Servidor:** (a) tela + RPC (recomendado, impede burlar pela API); (b) só a tela.
4. **Versões antigas sem AP-08:** (a) não cobrar até serem editadas (proposto); (b) listar para o professor completar.
