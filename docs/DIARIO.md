# Diário (só acrescentar; entradas novas no topo)

Modelo em `00-como-colaborar.md`.

## 2026-10-16: sessão inicial (Fase 0 e documentação)
- **O que foi feito:**
  - Leitura do mapa do Miro "Sistema Treino" e do código do projeto "Leven Treinos" (rotas, dashboards, anamnese, sessão de treino, réguas, funções de integração com o EVO).
  - Criação do conector `evo-mcp` (leitura por padrão, uma credencial por unidade, mascaramento de dados pessoais).
  - Fase 0: consulta de leitura ao EVO nas 4 unidades.
- **Descobertas principais** (detalhes em `02-evo-api.md`, `03-regras-de-negocio.md`, `04-achados-e-bugs.md`):
  - A AT é um prospect com serviço "Aula Teste" inscrito numa aula comum; o Leven descarta isso hoje.
  - Fixo = plano vigente (904 ativos). Agregador = sem plano + check-in Totalpass/Wellhub (1.666 pessoas em 30 dias).
  - Presença do EVO provavelmente gravada como falta no Leven (A1). "Ativos" do Leven inflados 7× (A2).
- **Evidência:** consultas de leitura ao EVO (16/10/2026) e consultas agregadas (só contagens) ao banco do Leven.
- **Nada foi enviado ao agente do Lovable. Nada foi escrito no EVO.**
- **Pendências para a outra pessoa:** revisar os documentos, configurar o próprio `.env`, responder as decisões D1, D2, D3, D6 e D7.
- **Segurança:** uma chave do EVO foi colada no chat no início da sessão. **Gere uma nova no EVO e descarte a antiga.**
