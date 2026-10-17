# Mensagem ao Lovable: chave de pessoa (`person_key`), sem carga (ENVIADA em modo plano em 23/10/2026 após conferir `list_edits`; último commit `db16e23`)

Decisões da usuária: pessoa única no grupo (CPF e código de agregador), visão por unidade, **sem dar a carga agora** (a carga vem depois) e o Leven **já deve aceitar** a chave; vincular só sem conflito; dados clínicos valem entre unidades; lista da rede por pessoa.

---

Quero tratar a mesma pessoa cadastrada em várias unidades como **uma pessoa só no grupo**, com visão por unidade. O EVO tem um cadastro por unidade; no Leven cada cadastro continua sendo **uma linha** de `students` (não fundir), e uma **chave de pessoa** liga as linhas. **Sem carga agora.** **Responda primeiro com um plano, sem alterar código.** No plano, liste cada arquivo que seria alterado e separe **"agora"** de **"com a carga"**.

**Regras gerais**
- Sem tabela nova; só uma coluna. Não crie arquivos nem dependências do Drizzle além do arquivo da migração que a sua ferramenta gera.
- **Não altere nenhuma linha existente** de `students` (nada de preenchimento retroativo) e **não funda, apague nem vincule** linhas automaticamente.
- Não execute nenhuma sincronização com o EVO.
- Não sobrescreva `.lovable/plan.md`: acrescente ao final. Sem dados pessoais em logs.
- Outras pessoas editaram a sincronização de agenda em 23/10 (slots, instrutores, alunos agendados inativos, lista de pendências). Releia o código atual antes de editar e preserve tudo o que existe.

## AGORA

**1. Banco**
- `students.person_key text null` e um índice **não único** em `person_key` onde não for nulo. Sem default, sem backfill.

**2. Cálculo da chave (função pura e testada)**
- `computePersonKey({ cpf, gympassId, codeTotalpass })`:
  1. CPF válido: 11 dígitos depois de tirar o que não é número, **não todos iguais**, e com os **dígitos verificadores corretos** → `cpf:NNNNNNNNNNN`.
  2. Sem CPF válido e com `gympassId` → `agg:wellhub:CODIGO`; com `codeTotalpass` → `agg:totalpass:CODIGO`.
  3. Caso contrário, `null`. **Não** usar e-mail, telefone nem nome.
- Como as funções do Supabase não compartilham arquivos, use uma cópia idêntica do helper em cada função que **cria** alunos: `evo-sync`, `evo-sync-prospects` e o resolvedor de alunos agendados de `evo-sync-schedules` (`students.ts`). Um teste confere que as cópias são idênticas.

**3. Quando a chave é gravada**
- **Só ao criar uma linha nova** nessas três funções. **Na atualização de linha existente, não tocar em `person_key`** (para não virar carga escondida). Comentar isso no código.

**4. Front: aceita a chave quando existir (sem chave, nada muda)**
- **Ficha do aluno (`StudentDetail`):** se `person_key` não for nulo, buscar as **outras** linhas com a mesma chave e mostrar "Mesma pessoa em: [Unidade] (link)". Sem outras linhas, não mostrar nada.
- **Contagens da rede** (somas de várias unidades nas telas de supervisor e admin): **pessoas distintas** (`person_key` quando houver; senão o id da linha). **Contagens por unidade continuam por linha.** Liste no plano cada consulta e hook que soma várias unidades.

## COM A CARGA (planejar, mas **não implementar agora**)

**5. Regra de vínculo (só sem conflito)**
- Vincular automaticamente (mesma chave) **só** se a chave vier de CPF válido ou código de agregador **e** o grupo **não tiver conflito forte**, isto é, **primeiro nome e data de nascimento diferentes ao mesmo tempo**. Com conflito, **não vincular** e marcar para revisão (no banco do Leven, 52 de 1.200 grupos de CPF repetido têm primeiro nome diferente e 41 têm nascimentos diferentes). Diga no plano onde guardar a marca de revisão sem tabela nova (por exemplo, `person_key` nulo mais um campo de texto) e como a carga aplicaria a regra.

**6. Dados clínicos valem entre unidades**
- Anamnese, lesões, restrições, condições, medicamentos, cirurgias e alertas clínicos hoje ficam presos ao `student_id` da linha. Planeje como a ficha e os alertas passam a mostrar a **união das linhas do mesmo grupo** (somente leitura nas outras linhas), incluindo o banner de alerta clínico ao iniciar treino.

**7. Lista da rede por pessoa**
- Busca e listas de alunos **sem unidade escolhida** mostram **uma linha por pessoa** (unidades como etiquetas; ativa se estiver ativa em qualquer unidade). **Com unidade escolhida**, só quem tem cadastro naquela unidade, com os dados daquela unidade. Na ficha, um seletor de unidade (padrão: a unidade escolhida; opção "todas") para sessões, presença, professor, tipo de plano e status. Liste no plano as telas e consultas afetadas.

**8. Testes (agora)**
CPF com máscara, CPF com 11 dígitos iguais, CPF curto, CPF com dígitos verificadores errados, código de agregador, nada disponível (retorna `null`), e a contagem de pessoas distintas (linhas com e sem chave).

Mostre o plano e a lista de arquivos, separados em "agora" e "com a carga", e não implemente ainda.
