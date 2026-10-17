# Mensagem ao Lovable: comportamento da aula experimental, cor do chip e e-mail de pré-anamnese (ENVIADA em modo plano em 23/10/2026 após conferir `list_edits`; último commit `14c6b2c`)

Decisões da usuária: (1) o estado da AT na Agenda é controlado pela **cor do chip**; (2) a aula experimental tem o **mesmo comportamento de uma aula agendada**; (3) ao agendar a AT, é disparado um **e-mail para o cliente preencher a pré-anamnese**. Depois do plano e da implementação, a usuária testa.

---

Contexto novo sobre as aulas teste (AT) que já estão no Leven (`student_sessions.type = 'experimental'`, aluno com `lifecycle_stage = 'prospect'`). **Responda primeiro com um plano, sem alterar código.** No plano, liste cada arquivo que seria alterado, cada decisão que você precisa de mim e o que você acha que falta além do que está abaixo.

## Decisões do produto

**1. Estado da AT controlado pela cor do chip (Agenda).**
O chip da AT passa a mostrar o estado só pela cor (sem depender de selo escrito). Proposta de cores, para você ajustar ao padrão visual do app:
- AT agendada, pré-anamnese **pendente**: violeta (como hoje) com marca de alerta discreta.
- AT agendada, pré-anamnese **preenchida**: violeta cheio.
- AT em andamento: a mesma cor de aula em andamento.
- AT realizada (`done`): verde, como a aula realizada.
- AT com falta: vermelho. Falta justificada (`canceled`): cinza, com a cor já corrigida nos commits de 23/10.
Mantenha o nome do prospect e a legenda das cores num lugar visível (legenda da Agenda).

**2. Aula experimental = mesmo comportamento de uma aula agendada.**
Isto **substitui** o que pedi antes (AT só visualização). A AT passa a ter na Agenda os mesmos fluxos e telas de uma aula agendada comum: abrir o chip, **iniciar** e **finalizar** a aula, nota de intensidade ao finalizar, remarcar e as demais ações que a aula comum tem hoje. Remover as restrições da implementação anterior (esconder iniciar/remarcar/marcar falta/reposição e o estilo "Pendente"). Pontos que o plano precisa tratar:
- **Iniciar aula exige plano de treino ativo** hoje; a AT não tem plano. Permitir iniciar e finalizar a AT **sem plano**.
- A presença continua vindo do EVO (a sincronização escreve o status); diga como as ações do Leven convivem com isso sem serem sobrescritas ou sobrescreverem o EVO.
- Dashboards e indicadores (presença, falta, ocupação, reposição) continuam **excluindo** `experimental` por enquanto; liste o que muda se a AT passar a contar.
- O fechamento automático 10 minutos depois do tempo planejado também vale para a AT?

**3. E-mail de pré-anamnese ao agendar a AT.**
Quando a AT é agendada (sessão `experimental` **criada** pela sincronização), enviar um e-mail ao cliente com um link para preencher a **pré-anamnese**.
- O link abre uma página **pública**, sem login, com **token** (de uso limitado e com validade) validado por função no servidor; ao enviar, grava a pré-anamnese no aluno prospect, **reaproveitando a estrutura de anamnese que já existe** (`anamnesis`, `student_anamnesis_versions` e tabelas de condições, lesões, medicamentos, cirurgias e restrições), marcando que foi preenchida pelo cliente. Sem tabela nova; colunas novas são permitidas (por exemplo, para o token, a data de envio e a data de preenchimento).
- O professor precisa **conferir o preenchimento da pré-anamnese** antes da aula (indicador no chip pela cor, e um cartão na ficha: pendente, preenchida, data) e depois fazer a anamnese completa na aula.
- **Segurança do envio (obrigatório):**
  - Só enviar para AT **criada de agora em diante** e com data **futura**. **Nunca** enviar por carga ou sincronização de histórico (a carga de outubro já tem 32 sessões que **não** podem gerar e-mail).
  - **Chave geral desligada por padrão** e **modo de teste**: com o modo de teste ligado, todo e-mail vai para um endereço de teste que eu informar, nunca para o cliente.
  - **Uma vez só** por AT (registrar a data de envio; reenviar só por botão).
  - Sem e-mail no cadastro (14 de 69 prospects não têm): não enviar e mostrar isso na ficha e no chip.
  - Não registrar e-mail, CPF nem o token completo nos logs.
- Se precisar de provedor de e-mail, domínio ou remetente, diga no plano o que escolher e **peça a chave pelo formulário seguro do Lovable**, nunca pelo chat.

## O que eu acho que falta (comente e complete no plano)
1. **Captura automática das AT.** Hoje as AT só entram quando alguém clica no botão "Sincronizar aulas teste". Sem captura periódica (a cada poucos minutos, ou pelo webhook `AppointmentEnroll` do EVO), o e-mail só sairia quando alguém rodasse o botão. Proponha como disparar a captura sem estourar o limite de 40 chamadas por minuto por chave do EVO (que as duas pessoas compartilham).
2. **Regra de quem é AT.** A função só importa prospect com serviço "Aula Teste"; há pessoas reais recentes com o serviço "Cortesia" e aula marcada, e prospects antigos (cadastrados antes de setembro) com aula teste que a janela de cadastro de setembro e outubro deixa de fora. Diga como cobrir sem importar os prospects de bloqueio ("Falta de Professor" e semelhantes, cadastrados em 2023).
3. **"Finalizar aula experimental" e resumo do aluno para o Coordenador**, com o resumo por IA que já existe (`ai-run`), disparado ao finalizar a AT, e uma tarefa ou notificação para o coordenador da unidade.
4. **Fechamento do plano** (conversão da AT em membro): marcar a AT como "fechou" ou "não fechou" quando a pessoa virar membro. Fica para depois, mas o desenho do chip e da ficha não deve impedir.
5. **Lembrete** ao cliente antes da AT se a pré-anamnese não foi preenchida.
6. **Teste**: como eu testo isso de ponta a ponta sem escrever no EVO e sem e-mail para cliente real (por exemplo, uma AT de teste e o modo de teste do e-mail).

## Regras gerais
- Sem tabela nova (colunas sim). Sem dependência nova sem me avisar. O arquivo da migração gerado pela ferramenta é aceito.
- **Não altere linhas existentes** de `students` nem de `student_sessions` e **não execute sincronização com o EVO.**
- Não escreva no EVO.
- Não sobrescreva `.lovable/plan.md`: acrescente ao final. Sem dados pessoais em logs.
- Outras pessoas editam a sincronização de agenda; releia o código atual antes de editar e preserve tudo.

Mostre o plano e a lista de arquivos e não implemente ainda.
