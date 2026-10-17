# Rascunho da mensagem ao Lovable: e-mail por SMTP para a pré-anamnese (NÃO ENVIADA)

Modo: plano primeiro, depois implementação. Só enviar com OK explícito, depois de conferir `list_edits` e registrar o envio no diário. A senha do SMTP **não** vai neste texto nem no chat: o agente deve pedi-la pelo formulário seguro do Lovable.

---

Vamos ligar o envio do e-mail de pré-anamnese por **SMTP**. Hoje o código (`_shared`/`trial-preanamnesis`) chama a função `send-transactional-email`, que **não existe** no projeto. Crie-a. **Mostre primeiro o plano com os arquivos, sem alterar nada, e aguarde meu OK.**

**Dados do SMTP (não secretos)**
- Host: `smtplib.com.br`
- Porta: 587, com STARTTLS (TLS obrigatório; recusar envio sem TLS)
- Remetente (From): `suporte@academialeven.com.br`, nome exibido "Leven Treinos"
- Endereço de teste: `kasantanads@gmail.com`
- Origem pública do app (`TRIAL_PUBLIC_ORIGIN`): `https://leventreinos.smartaccess.com.br`

**Segredos** (peça pelo **formulário seguro do Lovable**, nunca pelo chat): usuário e senha do SMTP, como segredos do projeto, por exemplo `SMTP_USER` e `SMTP_PASS`. Host, porta e remetente podem ficar em variáveis ou configuração.

**O que fazer**
1. Criar a função `send-transactional-email` (`supabase/functions/send-transactional-email/`) com o contrato que o código já usa: corpo `{ templateName, recipientEmail, idempotencyKey, templateData }`, resposta com `error` em caso de falha. Falar SMTP com a biblioteca que funcione em Deno nas Edge Functions; diga qual escolheu e por quê. Chamável só por outras funções com a chave de serviço, **nunca pelo navegador**.
2. Criar o modelo `trial-preanamnesis` (HTML e texto simples, em português): saudação com o nome, explicação curta, botão e link para `{origem}/pre-anamnese#token=...`, aviso de validade até o início da aula e que o link é de uso único. Sem dados de saúde no corpo.
3. **Idempotência:** respeitar `idempotencyKey` (não enviar duas vezes a mesma chave). Sem tabela nova; se precisar de controle, use colunas existentes ou diga no plano.
4. Definir `TRIAL_EMAIL_INFRA_READY` e `TRIAL_PUBLIC_ORIGIN` conforme o fluxo existente, e gravar remetente e endereço de teste em `tenants` (`trial_email_from`, `trial_email_test_address`) **sem ligar** nada além do que está descrito abaixo.
5. **Estado final dos interruptores:** `trial_email_domain_ready` = true; `trial_email_test_mode` = **true**; `trial_email_enabled` = **true somente se** o envio de teste ao meu endereço funcionar; `trial_capture_enabled` = **false** (a captura periódica continua desligada). Nenhum e-mail pode ir a cliente real: com o modo de teste ligado tudo vai para o endereço de teste.
6. **Teste de envio:** depois de publicar a função, envie **um** e-mail de teste ao endereço de teste, usando o prospect TESTE (botão já existente) ou outra forma que não grave dados de cliente, e me diga o resultado. Se a conexão SMTP falhar (TLS, porta, autenticação), **pare e me diga o erro exato**, sem trocar de provedor.
7. Testes automatizados para o modelo, a idempotência e a recusa de envio sem TLS ou sem segredo. Informar o total da suíte inteira.

**Combinados**
- Não altere linhas de `students` nem de `student_sessions`, não execute sincronização com o EVO e não escreva no EVO.
- Não registre senha, usuário, e-mail de cliente nem o token completo em logs, respostas ou `CHANGELOG.md`.
- Não sobrescreva `.lovable/plan.md`; releia o código atual antes de editar; registre no `CHANGELOG.md` no mesmo commit (regra do `AGENTS.md`).
- Publique apenas as funções alteradas ou criadas e liste quais.
