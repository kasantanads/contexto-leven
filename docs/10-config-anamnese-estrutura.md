# Configurações > "Anamnese": estrutura (proposta v2 de 25/11/2026, NADA implementado)

Pedido da usuária: em Configurações, o card "Modelos de anamnese" passa a se chamar **Anamnese** e abre uma página com três cards: **Modelos de anamnese** (prospect e aluno), **Modelo de WhatsApp** e **Modelo de e-mail**. **Só os modelos: nenhum gerenciamento de disparo** (decisão de 25/11/2026, que substitui a primeira versão deste documento). Fonte: leitura do `main` do app (`965fd8c`) e do banco (só leitura). Sem dados pessoais.

## 1. Como é hoje [V, leitura do código e do banco, 25/11/2026]
| Peça | Onde | O que tem |
|---|---|---|
| Card do menu | `AdminPanel.tsx` → `/admin/modelos-anamnese` | "Modelos de anamnese · Prospect e Aluno · Modelos, envio e aulas teste" |
| Página | `AdminAnamnesisModels.tsx` | Abas **Modelos** (Prospect/Aluno: perguntas, textos editáveis, tabela `anamnesis_models`, hoje vazia) e **Envio e aulas teste** (`TrialSettings view="anamnesis"`) |
| Envio e aulas teste (disparo) | dentro da página acima | Captura periódica, envio de pré-anamnese liga/desliga, liberação por unidade (`units.trial_email_live`), ids de prospects bloqueados, aula teste manual (TESTE) |
| E-mail: conexão e controles | `/admin/integracoes/email` | Conexão por unidade (SMTP ou provedor API, remetente, teste) e controles de envio (modo teste, endereço de teste, limite diário, pausa) |
| E-mail: texto | `_shared/transactional-email-templates/trial-preanamnesis.ts` e `member-preanamnesis.ts` | **Fixo no código**: assunto, 3 parágrafos, saudação com 1º nome, prazo, link; sem dado de saúde |
| WhatsApp: conexão | `/admin/integracoes/whatsapp` | Instâncias Evolution, QR, opt-in, pausa, limite, número de teste, mensagem de teste |
| WhatsApp: pré-anamnese | **não existe** | Nenhuma função envia o formulário por WhatsApp; não há texto configurável |

## 2. Estrutura proposta (só modelos)
```
Configurações
└─ Anamnese  (/admin/anamnese; /admin/modelos-anamnese redireciona para cá)
   ├─ [card] Modelos de anamnese  → abas Prospect | Aluno   (o que já existe hoje na aba "Modelos")
   ├─ [card] Modelo de WhatsApp   → textos das mensagens
   └─ [card] Modelo de e-mail     → textos dos e-mails
```
- **Disparo: nada novo e nada movido.** A usuária informou que o disparo já existe hoje; então esta entrega **não cria** gerenciamento de disparo (nem janela, plano B, modo automático, lembrete). As telas atuais ficam onde estão: a aba "Envio e aulas teste" (hoje dentro da página de modelos) e os "Controles de envio de e-mail" em Integrações/E-mail. Única pendência: a aba "Envio e aulas teste" fica como **terceira aba do card "Modelos de anamnese"** (Prospect | Aluno | Envio e aulas teste), sem mudança de conteúdo (recomendado), ou sai da página (decisão 1).
- **WhatsApp [V, `main` `57b41ee`]:** o que existe é conexão, QR, opt-in, pausa, limite e mensagem de teste. **Não há função que envie a pré-anamnese por WhatsApp.** A régua tem um tipo de ação "Enviar WhatsApp" (`AdminReguas.tsx`) e a caixa de tarefas de contato mostra tarefas por WhatsApp; **não li o que elas fazem** e não sei se enviam algo de verdade.
- A **conexão** (instância e QR do WhatsApp; SMTP/API do e-mail) continua em Integrações.

## 3. Conteúdo de cada card
### 3.1 Modelos de anamnese
Hoje já existe: seleção das perguntas e textos editáveis por público (Prospect e Aluno). Só é movido para o card novo, sem mudar comportamento.

### 3.2 Modelo de e-mail
- Por público (prospect/AT e aluno/membro) e por tipo de mensagem (**convite** e **reenvio**; lembrete só se a usuária quiser, ver decisões): **assunto**, **saudação**, **2 a 3 parágrafos**, **texto do link/botão**, **assinatura**.
- Variáveis permitidas: `{{primeiro_nome}}`, `{{link}}`, `{{prazo}}`, `{{unidade}}`. Regras fixas e validadas ao salvar: o corpo precisa conter `{{link}}`; nunca dado de saúde; só variáveis da lista; HTML escapado.
- **Prévia** do e-mail renderizado e botão **Restaurar texto padrão** (o de hoje).
- O remetente continua vindo da conexão de e-mail (Integrações); não é configurado aqui.

### 3.3 Modelo de WhatsApp (sugestões)
- Por público e por tipo (convite e reenvio): **texto curto** (limite sugerido de 500 caracteres), com as mesmas variáveis do e-mail e o link no final; **prévia** no formato do WhatsApp; **Restaurar texto padrão**.
- Orientações exibidas no editor: sem dado de saúde, tom direto, primeiro nome, uma única chamada para ação (o link), sem anexos.
- **Importante:** como não existe função de envio por WhatsApp, o texto salvo **não será usado** até alguém construir o disparo. Fica pronto para quando existir.

## 4. Dados e código
- **Tabela nova** `anamnesis_message_templates` (migração, aplicada pela usuária no SQL editor): `tenant_id`, `unit_id` (nulo = rede), `channel` (`email`/`whatsapp`), `audience` (`prospect`/`member`), `kind` (`invite`/`resend`/`reminder`), `subject` (só e-mail), `body`, `updated_at/by`. Sem linha = texto padrão de hoje.
- **E-mail:** `send-transactional-email` passa a ler o modelo da tabela e usa o texto atual quando não houver. É a única mudança de comportamento (e só quando alguém editar o modelo).
- **WhatsApp:** só o editor e a tabela. **Nenhuma função de envio**, nenhuma fila, nenhuma janela de horário.
- **Menu e rotas:** `AdminPanel.tsx`, `App.tsx` (rotas novas e redirecionamento), componentes novos reaproveitando `AdminAnamnesisModels`.

## 5. Fases (cada uma com ramo no repositório do app, revisão e OK antes de mesclar)
- **A. Reorganização:** renomear para "Anamnese", página com 3 cards, mover "Modelos" para o primeiro card, e realocar as telas de disparo conforme a decisão 1. Só front, sem migração.
- **B. Modelo de e-mail editável:** tabela, editor com prévia e restauração, `send-transactional-email` lendo o modelo. Migração + função reimplantada.
- **C. Modelo de WhatsApp:** editor e prévia usando a mesma tabela. Só front (sem função), depois da B.
- Cada passo que precisa de função reimplantada depende do Lovable (sem créditos hoje) ou de outro caminho combinado.

## 6. Decisões pendentes
1. **A aba "Envio e aulas teste"** fica como terceira aba do primeiro card (recomendado, sem mudar conteúdo) ou sai da página de Anamnese? Os controles de e-mail ficam em Integrações, sem mudança.
2. Os textos valem para a **rede toda** ou **por unidade**? Recomendo rede, com a opção de sobrescrever por unidade depois.
3. **Tipos de mensagem:** convite e reenvio apenas, ou também **lembrete** (sem disparo ele não tem efeito)?
4. Qual é o **disparo por WhatsApp que já existe**? Não achei função que envie a pré-anamnese por WhatsApp; se existir (por exemplo na régua), me diga onde para o modelo de WhatsApp se ligar a ele. Sem isso, o modelo só terá efeito quando existir o envio.
