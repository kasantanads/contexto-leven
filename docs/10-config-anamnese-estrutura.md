# Configurações > "Anamnese": estrutura (proposta de 25/11/2026, NADA implementado)

Pedido da usuária: em Configurações, o card "Modelos de anamnese" passa a se chamar **Anamnese** e abre uma página com três cards: **Modelos de anamnese** (prospect, aluno e disparo), **Modelo de WhatsApp** (descrição e disparo) e **Modelo de e-mail** (descrição e disparo). Sugestões de configurações do WhatsApp a cargo do Claude. Fonte: leitura do `main` do app (`965fd8c`) e do banco (só leitura). Sem dados pessoais.

## 1. Como é hoje [V, leitura do código e do banco, 25/11/2026]
| Peça | Onde | O que tem |
|---|---|---|
| Card do menu | `AdminPanel.tsx` → `/admin/modelos-anamnese` | "Modelos de anamnese · Prospect e Aluno · Modelos, envio e aulas teste" |
| Página | `AdminAnamnesisModels.tsx` | Abas **Modelos** (Prospect/Aluno: perguntas incluídas, textos editáveis, tabela `anamnesis_models`, hoje vazia) e **Envio e aulas teste** |
| Envio e aulas teste | `TrialSettings view="anamnesis"` | Captura periódica; envio de pré-anamnese liga/desliga; liberação por unidade (`units.trial_email_live`); ids de prospects bloqueados por unidade; aula teste manual (TESTE) |
| E-mail: conexão | `/admin/integracoes/email` → `EmailTransportSettings` | Por unidade: SMTP ou provedor API, remetente, teste |
| E-mail: controles | mesma página → `TrialSettings view="email"` | Modo teste, endereço de teste, remetente, domínio pronto, limite diário, pausa de emergência (`tenants.trial_email_*`) |
| E-mail: texto | `_shared/transactional-email-templates/trial-preanamnesis.ts` e `member-preanamnesis.ts` | **Fixo no código**: assunto, 3 parágrafos, saudação com 1º nome, prazo, link; sem dado de saúde |
| WhatsApp: conexão | `/admin/integracoes/whatsapp` → `WhatsappIntegrationDetail`, função `whatsapp-config` | Modo (por unidade ou rede), instâncias (Evolution API), QR code, opt-in, pausa, número de teste, limite diário (`whatsapp_settings`), mensagem de teste |
| WhatsApp: envio da pré-anamnese | **não existe** | Só há a mensagem de teste; nenhuma função envia o formulário por WhatsApp e não há texto de mensagem configurável |

## 2. Estrutura proposta
```
Configurações
└─ Anamnese  (/admin/anamnese; /admin/modelos-anamnese redireciona para cá)
   ├─ [card] Modelos de anamnese     → /admin/anamnese/modelos
   │     abas: Prospect | Aluno | Disparo
   ├─ [card] Modelo de WhatsApp      → /admin/anamnese/whatsapp
   │     abas: Mensagens | Disparo
   └─ [card] Modelo de e-mail        → /admin/anamnese/email
         abas: Mensagens | Disparo
```
- A **conexão** continua em Integrações (instância e QR do WhatsApp; SMTP/API do e-mail). Cada card novo mostra o estado da conexão (conectado, modo teste, pausado) com atalho para Integrações.
- O que já existe só **muda de lugar**: abas Prospect e Aluno (hoje "Modelos"), aba Disparo (hoje "Envio e aulas teste") e os "Controles de envio de e-mail" (hoje em Integrações/E-mail). Nenhum comportamento muda na Fase A.

## 3. Configurações sugeridas

### 3.1 Modelos de anamnese: aba Disparo (público Prospect/AT e Aluno/membro)
| Configuração | Hoje | Sugestão |
|---|---|---|
| Canal por público | só e-mail, por clique | Escolher por público: E-mail, WhatsApp, os dois, nenhum |
| Modo de disparo | manual (clique da equipe); automático dormente | Manual (padrão) / Automático ao criar a AT / Automático X horas antes da aula |
| Validade do link | até o início da aula, máx. 7 dias (prospect); 7 dias (membro) | Mostrar e permitir ajustar (1 a 14 dias) |
| Reenvios | máx. 3, 15 min entre eles | Mostrar e ajustar |
| Unidades liberadas | `units.trial_email_live` por unidade | Mantido, por canal |
| Captura periódica / bloqueios / aula teste manual | já existem | Mantidos na aba |
| Lembrete | não existe | Opcional: se não preencheu, lembrar X horas antes (um só) |

### 3.2 Modelo de e-mail
- **Mensagens** (por público e por tipo: convite, reenvio, lembrete): assunto, saudação, 2 a 3 parágrafos, texto do botão/link, assinatura. Variáveis permitidas: `{{primeiro_nome}}`, `{{link}}`, `{{prazo}}`, `{{unidade}}`. A prévia mostra o e-mail renderizado. Regras fixas: o corpo precisa conter `{{link}}`; nunca dado de saúde; só variáveis da lista.
- **Disparo:** nome e e-mail do remetente, responder para, modo teste e endereço de teste, limite diário, pausa de emergência (movidos de Integrações), botão "enviar e-mail de teste com este modelo".

### 3.3 Modelo de WhatsApp (sugestões)
- **Mensagens** (convite, reenvio, lembrete, por público): texto curto (limite sugerido de 500 caracteres) com as mesmas variáveis do e-mail; prévia no formato do WhatsApp; saudação com primeiro nome; o link no final.
- **Disparo:**
  - ativar por público (prospect e aluno) e por unidade;
  - **janela de envio permitida** (ex.: 8h às 20h, fuso de São Paulo; fora dela, a mensagem aguarda);
  - **intervalo entre mensagens** (ex.: 20 a 60 s, aleatório) e limite diário (já existe);
  - opt-in obrigatório (já existe) e o que fazer sem opt-in (não enviar e avisar a equipe);
  - **plano B:** se o WhatsApp falhar ou o número não for válido, tentar o e-mail (liga/desliga);
  - modo teste e número de teste, pausa de emergência (já existem);
  - registro de cada envio: enviado, falhou, motivo (sem o conteúdo da mensagem).
- **Atenção:** a conexão é a Evolution API (não oficial). Há risco de bloqueio do número se houver volume ou reclamação. Por isso: limite diário, janela de horário, intervalo aleatório e opt-in já fazem parte da proposta.

## 4. Dados e código
- **Tabela nova** `anamnesis_message_templates` (migração, aplicada pela usuária no SQL editor): `tenant_id`, `unit_id` (nulo = rede), `channel` (`email`/`whatsapp`), `audience` (`prospect`/`member`), `kind` (`invite`/`resend`/`reminder`), `subject`, `body`, `enabled`, `updated_at/by`. Valores padrão = os textos de hoje.
- **Configurações de disparo** em colunas novas de `tenants`/`whatsapp_settings` (modo de disparo, validade, janela, intervalo, plano B), com padrão = comportamento de hoje.
- **E-mail:** `send-transactional-email` passa a ler o modelo da tabela e cai no texto atual se não houver. Renderização com lista de variáveis permitidas e escape de HTML.
- **WhatsApp:** função **nova** de envio da pré-anamnese pela Evolution (`sendText`), com fila, janela, intervalo, opt-in, registro e plano B. Hoje não existe.
- **Dependência:** o celular do prospect/aluno. O `evo-web-sync-trials` (PR #1) já completa e-mail e celular vazios de quem tem AT; falta conferir a cobertura.
- **Menu e rotas:** `AdminPanel.tsx`, `App.tsx` (rotas novas e redirecionamento), componentes novos reaproveitando `AdminAnamnesisModels` e `TrialSettings`.

## 5. Fases (cada uma com revisão e OK antes de mesclar; ramo por fase no repositório do app)
- **A. Reorganização (sem mudar comportamento):** renomear para "Anamnese", página com 3 cards, mover abas e controles, redirecionamento. Só front, testes de rota e de tela.
- **B. Modelo de e-mail editável:** tabela, editor com prévia, `send-transactional-email` lendo o modelo. Migração + função.
- **C. WhatsApp:** textos editáveis, depois função de envio e fila, janela, plano B, registro. É a maior parte.
- **D. Disparo automático e lembrete** (se aprovado), depois de B e C estáveis.
- Cada passo que precisa de função reimplantada depende do Lovable (sem créditos hoje) ou de outro caminho combinado.

## 6. Decisões pendentes (perguntas à usuária)
1. Mover os controles de envio de e-mail (modo teste, limite, pausa) de **Integrações/E-mail** para **Anamnese/E-mail**? (recomendado; deixa um atalho em Integrações)
2. Os textos valem para a **rede toda** ou podem ser **por unidade**? (recomendado: rede, com a opção de sobrescrever por unidade depois)
3. **Canais por público:** prospect e aluno, e-mail, WhatsApp ou os dois?
4. **Modo de disparo:** continuar manual ou incluir o automático (ao criar a AT / X horas antes)?
5. **Lembrete** se não preencheu: sim ou não?
6. **Plano B** WhatsApp → e-mail: sim ou não?
7. Ordem das fases e quem aplica as migrações e reimplanta as funções.
