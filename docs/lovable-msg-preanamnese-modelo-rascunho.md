# Rascunho da mensagem ao Lovable: novo modelo de pré-anamnese (NÃO ENVIADA)

Modo: **plano primeiro**, sem alterar código. Só enviar com OK explícito, depois de conferir `list_edits` e registrar o envio no diário. Anexar o arquivo `anamnese-leven (1).html` (piloto da usuária, com respostas de exemplo fictícias, sem dado real) pelo envio de arquivo do Lovable.

---

A usuária definiu um **novo modelo de pré-anamnese**. Ele está no HTML anexo (`anamnese-leven (1).html`), um piloto interativo com três abas. **Responda primeiro com um plano, sem alterar código.** No plano, liste cada arquivo que seria alterado, cada decisão que precisa de mim e o que você acha que falta.

## O que o anexo contém
1. **Aba "Aluno · online"** (é o que vira a página pública `/pre-anamnese`): 16 telas, uma por vez, com barra de progresso e cronômetro. Campos PA-01 a PA-27 e PQ-01 a PQ-09, com condicionais:
   - Dados (nome, CPF, celular, data de nascimento, aceite LGPD), profissão, objetivos (lista agrupada, e até 5 prioritários se marcar mais de 5), dias por semana;
   - **PAR-Q** com 7 perguntas sim/não (só de 15 a 69 anos), declaração de veracidade e **Termo de Responsabilidade** (só se houver "sim"); fora dessa faixa de idade, a tela pede autorização do responsável (menor de 15) ou atestado (70 ou mais);
   - saúde (condições, dor/lesão/limitação, cirurgia, medicamento, com detalhes condicionais), rotina (postura no trabalho, atividades, grade semanal), expectativas de atendimento, histórico de treino, interesses e barreiras.
2. **Aba "Professor · presencial"**: um **card de resumo** com alertas e "Aprofundar na conversa" e o **roteiro da conversa presencial** (AP-01 a AP-09, incluindo a confirmação de saúde e a conduta em AP-08). Isso corresponde à anamnese completa feita na aula.
3. **Aba "Desenvolvedor · dados"**: dicionário de campos, regras para a IA e o JSON enviado à IA, com o status de liberação da prescrição.

## O que eu quero
- **A página pública `/pre-anamnese` passa a ter este conteúdo, fiel ao modelo** (telas, perguntas, textos, opções, condicionais, validações, máscaras de CPF/celular/data, regras de idade do PAR-Q, termo, tela final).
- **O visual NÃO copia o CSS do anexo** (paleta verde, Bricolage Grotesque, Figtree): ele é só referência de estrutura. A tela deve usar o **design system do Leven**: tokens de `src/index.css` (`--primary`, `--card`, `--border`, `--muted`, `--destructive`, `--success`, `--warning`, `--radius`), fontes do app (Inter e Space Grotesk nos títulos), **componentes shadcn/ui já usados no projeto** (Button, Input, Textarea, Checkbox, Progress, Card, etc.) e suporte a modo claro e escuro como o resto do app. Mobile primeiro (coluna estreita), áreas de toque de 44 px, foco visível, texto de erro junto ao campo.
- **Remover do anexo o que é só de piloto:** cabeçalho com abas, "Carregar exemplo", "Começar do zero", "Códigos da planilha", texto "nada é salvo", aba Desenvolvedor.

## Decisões que preciso que você analise no plano
1. **Onde gravar.** O formulário tem mais dados do que as tabelas de anamnese atuais (PAR-Q, grade semanal, objetivos prioritários, barreiras, histórico, preferências). **Sem tabela nova**; colunas são permitidas. Proponha o desenho (por exemplo, uma coluna JSONB versionada em `student_anamnesis_versions` ou na sessão, mantendo o que já tem estrutura: condições, lesões, medicamentos, cirurgias, restrições), como a função `submit_trial_preanamnesis` e o schema `preanamnesisSchema` mudam e como a anamnese completa do professor pode reaproveitar esses dados.
2. **Dados pessoais no formulário público (CPF, celular, data de nascimento).** O token já limita a gravação ao prospect da sessão. Diga o que fazer se esses valores **divergem** do que já existe no cadastro (não sobrescrever sem conferência) e se o CPF pode alimentar `person_key` sem sobrescrever uma chave existente. Nunca registrar CPF em logs.
3. **PAR-Q e termo.** Registrar respostas, aceite do termo e do LGPD com **data e hora** e a idade calculada. O texto do termo (Anexo II da Lei Estadual SP nº 16.724/2018) e o do LGPD estão marcados no anexo como "texto proposto para validar com o jurídico"; mantenha como está e não invente texto jurídico novo.
4. **Resumo para o professor.** O card de resumo e os alertas (PAR-Q com "sim", dor, lesão, medicamento, condições, idade 70+ ou menor de 15) devem aparecer na **ficha do prospect** e no chip da Agenda, no padrão visual do app. Diga o que você propõe para o roteiro presencial (AP-01 a AP-09) agora e o que fica para uma etapa seguinte; **não implemente a aba Desenvolvedor nem a integração com IA ainda**.
5. **Regra de liberação.** No anexo, o status "bloqueada, aguardando conduta" depende da conduta do professor (AP-08). Proponha como representar isso sem ligar a prescrição automática agora.
6. **Estado atual do e-mail.** O envio por SMTP ainda falha na abertura do cliente SMTP e está desligado; **não mexa nele neste pedido** e não ligue nenhuma chave.

## Combinados
- **Não altere linhas existentes** de `students` nem de `student_sessions` e **não execute sincronização**. Nada no EVO.
- Sem tabela nova; dependência nova só com aviso no plano.
- Não sobrescreva `.lovable/plan.md`: acrescente ao final. Releia o código atual antes de editar. Registre no `CHANGELOG.md` no mesmo commit (regra do `AGENTS.md`).
- Nenhum dado pessoal real em testes, logs ou `CHANGELOG.md`. Testes com dados fictícios.
- Segurança do token e da página pública continuam como estão (token de uso único até o início da aula, limite de tentativas e de tamanho, consentimento obrigatório).

Mostre o plano, a lista de arquivos e as perguntas que tiver, e não implemente ainda.
