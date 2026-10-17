# Rascunho da mensagem ao Lovable: PA-07, etapa 1 (regras, servidor e testes) (NÃO ENVIADA)

Modo: **plano primeiro**. Só enviar com OK explícito, depois de conferir `list_edits` e de haver crédito; registrar o envio no diário. Antes de enviar, resolver os itens marcados **[DECIDIR]** (seção 2 de `docs/08-pa07-comparacao-e-implementacao.md`). Para economizar crédito, dá para apagar a primeira frase do pedido ("Responda primeiro com um plano…") e pedir implementação direta; fica mais barato e com mais risco de retrabalho.

---

Vamos implementar a nova **PA-07 (prioridades com resposta aberta e prazo)** da pré-anamnese. Esta é a **etapa 1: regras compartilhadas, servidor e testes**. **Responda primeiro com um plano, sem alterar código.** Liste arquivos, mudanças de banco (se houver), riscos e perguntas.

## Especificação (fonte: planilha "Matriz Desenvolvimento PA07 Leven" e protótipo HTML da usuária)
- **PA-07 "Objetivos prioritários"** passa a ser uma **classificação**: texto "Se você pudesse escolher até 5 objetivos, aqueles que mais mudariam a sua vida, quais seriam em ordem de prioridade de 1 a 5?". Mostra **somente os objetivos marcados na PA-06** (incluindo "Outro objetivo" com o texto digitado). A tela aparece **sempre que houver pelo menos 1 objetivo marcado** (hoje só com mais de 5).
- Cada objetivo recebe **no máximo uma posição** (1ª a 5ª) ou nenhuma ("Não priorizar"). **Duas posições iguais são proibidas.** O aluno **não precisa usar as cinco posições**. **Mínimo para concluir: [DECIDIR: pelo menos 1 objetivo classificado, recomendado]**.
- **PA-07.02** (texto aberto, "O que você espera que melhore no seu dia a dia ao alcançar esse objetivo?", máx. **[DECIDIR: 600]** caracteres) e **PA-07.03** (prazo, "Em quanto tempo gostaria de alcançar este objetivo?": `1 a 3 meses`, `3 a 6 meses`, `6 a 9 meses`, `9 a 12 meses`): **obrigatórios só para 1ª, 2ª e 3ª**. 4ª e 5ª **não** têm campos complementares.
- **Regras de limpeza:** se um objetivo sai da PA-06, ele sai também da PA-07 e seus dados complementares são descartados. Se um objetivo vai para 4ª, 5ª ou fica sem posição, **o servidor descarta** a resposta aberta e o prazo dele ao gravar (**no navegador o texto digitado é mantido enquanto o aluno edita**, para não se perder por um clique errado).
- **Formato gravado [DECIDIR: da matriz, recomendado]:** `PA-07` = lista de objetos, **um por objetivo classificado**, ordenada por prioridade: `{ "objetivo": "...", "prioridade": 1, "importancia_dia_a_dia": "..." | null, "prazo_desejado": "..." | null }`. Para prioridades 4 e 5, os dois campos ficam `null`. Se houver menos de cinco, grava só os classificados.
- **Respostas antigas** (7 versões, testes) têm `PA-07` como lista de textos: **leia os dois formatos sem quebrar** (leitura defensiva em resumo, IA e editor). Não altere nem apague essas versões.

## Onde mexer (confirme no código; esta etapa não mexe na tela pública nem no visual)
- `supabase/functions/_shared/preanamnesisV2.ts` (módulo compartilhado): novo tipo de campo para a classificação; `SCREENS` (PA-07 aparece com ≥1 objetivo); `F` com PA-07, PA-07.02 e PA-07.03; `validateFields`, `validateAll` (posição única, obrigatoriedade das 1ª a 3ª, limite do texto, prazo dentro das 4 opções, só objetivos presentes na PA-06), `sanitize` (limpeza), `optionsOf`, `derive` se necessário; `prios()` e `prioText()` devem usar a **ordem classificada** (hoje, com 5 objetivos ou menos, devolvem a ordem da PA-06). Mantenha a lista de perguntas por modelo (`questionIds`): PA-07.02 e PA-07.03 entram e saem **junto** com a PA-07.
- `preanamnesis-public` e os RPCs `submit_trial_preanamnesis` e `submit_member_preanamnesis`: aceitar e validar o novo formato; limite de payload (32 KB) deve continuar valendo. A gravação em `student_goals` continua usando só a PA-06.
- **Não** altere os rótulos dos objetivos da PA-06 nesta etapa (decisão pendente). Não altere PAR-Q, consentimentos, textos legais, roteiro AP nem as demais perguntas.

## Testes (obrigatórios)
Converta os **12 cenários da matriz** em testes automáticos do módulo puro: (1) um objetivo selecionado; (2) três objetivos; (3) cinco objetivos; (4) posição repetida bloqueada; (5) 1ª a 3ª exigem resposta e prazo; (6) 4ª e 5ª sem campos; (7) resposta vazia na 1ª a 3ª impede concluir; (8) prazo vazio na 1ª a 3ª impede concluir; (9) de 4ª para 2ª passa a exigir; (10) de 2ª para 4ª deixa de exigir e a limpeza descarta; (11) desmarcar na PA-06 remove e limpa; (12) conclusão grava e aparece no resumo. Mais: leitura dos dois formatos (antigo e novo), tamanho do payload, e **regressão** do formulário para o prospect e para o membro. SQL em transação revertida com dados fictícios para os dois RPCs de envio. Informe o total da suíte inteira.

## Combinados
- **Não publicar.** Liste no fim o que precisa ser publicado. Sem EVO, sync, e-mail, SMTP, chaves, unidades liberadas ou envio real.
- Migração **só se necessária** e aditiva; sem tabela nova; nenhum `UPDATE`, `INSERT` ou `DELETE` em dados existentes.
- Nenhum dado pessoal em testes, logs ou `CHANGELOG.md`.
- Releia o código atual antes de editar. Acrescente ao `.lovable/plan.md` (se arquivado, crie um novo). Registre no `CHANGELOG.md` no mesmo commit.

Mostre o plano, a lista de arquivos e as perguntas, e não implemente ainda.
