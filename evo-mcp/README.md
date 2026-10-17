# Conector MCP do EVO (W12)

Servidor MCP local que dá ao Claude acesso à API do EVO sem que a chave passe pelo chat.
A chave fica só no arquivo `.env`, na sua máquina.

## Ferramentas

| Ferramenta | Para quê |
|---|---|
| `evo_list_units` | Lista as unidades configuradas (só os rótulos). Com `check: true`, valida cada credencial e mostra a filial de cada uma |
| `evo_list_endpoints` | Lista os endpoints (da especificação oficial) com a classe de acesso de cada um |
| `evo_describe_endpoint` | Parâmetros, corpo esperado e forma da resposta de um endpoint |
| `evo_call` | Executa uma chamada numa unidade (`unit`), ou o mesmo GET em todas (`unit: "todas"`). GET liberado; escrita conforme a política abaixo |

## Unidades

Cada unidade do EVO tem o seu DNS e a sua Secret Key, então o conector guarda **uma credencial por unidade**,
identificada por um rótulo curto à sua escolha (letras e números, ex.: `UMI`):

```
EVO_UNIT_UMI_USER=   # DNS da filial
EVO_UNIT_UMI_KEY=    # Secret Key da filial
```

- `evo_call` com `unit: "UMI"` consulta só aquela unidade. Com `unit: "todas"`, roda o mesmo **GET** em todas e devolve o resultado separado por unidade. Escritas rodam sempre em uma unidade por vez.
- Se houver uma única unidade configurada, `unit` é opcional.
- O limite do EVO é de **40 requisições por minuto por credencial**. O conector espaça as chamadas de cada unidade (cerca de 1,7 s) e avisa quando recebe 429, sem ficar esperando.
- As credenciais antigas `EVO_USER`/`EVO_KEY` ainda funcionam enquanto não houver nenhuma `EVO_UNIT_*`; depois disso são ignoradas (o `evo_list_units` avisa).

Como a especificação é carregada de `https://evo-integracao.w12app.com.br/swagger/v1/swagger.json`,
**todos os endpoints do EVO ficam acessíveis** por `evo_call`, sem uma ferramenta por endpoint.

## Política de acesso

| Classe | O que é | Como liberar |
|---|---|---|
| `read` | Qualquer GET | Sempre liberado |
| `write` | POST/PUT/PATCH comuns (criar prospect, inscrever em aula, converter prospect, treinos) | `EVO_ALLOW_WRITES=1` no `.env` **e** `confirm` com a frase `EXECUTAR <MÉTODO> <caminho>` |
| `sensitive` | DELETE, push para membros, notificações, controle de acesso, transferências, bloqueio de membro, funcionários, webhooks, configurações | `EVO_ALLOW_SENSITIVE=1` **e** a mesma frase de confirmação |
| `blocked` | Cobrança, estorno, recebíveis, vendas, carrinho, cartão, conta bancária, fitcoins, cancelamento de contrato, autenticação de membro, link de reset de senha | Não executa por este conector |

A frase de confirmação aparece na mensagem de erro, então cada escrita exige uma decisão explícita.

## Proteções

- Dados pessoais são mascarados na resposta (nome de pessoa, CPF/RG, e-mail, telefone, endereço, foto; data de nascimento vira só o ano). IDs, status e datas de aula não são mascarados. `raw: true` só funciona com `EVO_UNMASK=1`.
- `take` limitado a 100 (padrão 20) e resposta cortada em 60 mil caracteres.
- `audit.log` registra data, método, caminho, **nomes** dos parâmetros e status. Nunca valores nem a chave.

## Instalação

1. No `.env`, preencha as credenciais de cada unidade (`EVO_UNIT_<ROTULO>_USER` e `_KEY`) **você mesma**.
   Se já tinha `EVO_USER` e `EVO_KEY`, passe esse par para a unidade correspondente e apague as duas linhas antigas.
2. `npm install` (já feito nesta pasta; refaça se mover o conector).
3. `npm test` confere política, mascaramento, unidades e o servidor (usa credenciais falsas e nunca lê o seu `.env`).
4. Registre no Claude Code, apontando para a pasta onde o conector ficou:

```bash
claude mcp add evo -- node "CAMINHO\DA\PASTA\evo-mcp\server.mjs"
```

5. Feche o Claude Desktop por completo e reabra (o conector só lê o `.env` ao iniciar).
6. Peça `evo_list_units` com `check: true` para validar as credenciais e ver qual filial cada uma acessa.

## Primeiras consultas sugeridas (todas GET)

1. `GET /api/v2/webhook`: há webhooks cadastrados?
2. `GET /api/v1/activities/schedule` com `date` e `experimentalClass=true`.
3. `GET /api/v1/activities/schedule/detail` de um horário com AT.
4. `GET /api/v1/prospects` com `take=3`.
