# Rascunho da mensagem ao Lovable: início e término da AT (NÃO ENVIADA)

Modo: **plano primeiro**, sem alterar código. Só enviar com OK explícito, depois de conferir `list_edits` e registrar o envio no diário. Regra de origem: `docs/05-decisoes.md`, D2.1.

---

Vamos adicionar **início e término da aula teste (AT)**. **Responda primeiro com um plano, sem alterar código.** Liste os arquivos, as mudanças de banco e o que acha que falta.

## Estados
`agendada → em andamento → concluída`, mais `faltou` e `cancelada`. Tudo só no Leven, nada no EVO.

## Regras
1. **Iniciar AT:** professor da unidade, coordenador ou admin. Permitido de 15 min antes do horário até o fim da aula; fora dessa janela só o admin. Pré-anamnese pendente **não bloqueia**, apenas mostra aviso. Grava `started_at` e `started_by`.
2. **Roteiro da conversa presencial:** antes de iniciar, só leitura (o admin edita sempre, como já é hoje). Em andamento, edição liberada. Depois de concluída, o professor corrige por até 24h; depois disso só coordenador ou admin.
3. **Encerrar AT:** a conduta (AP-08) é obrigatória **somente quando houver alerta** (PAR-Q com "sim", dor, lesão, medicamento, idade 70+ ou menor de 15). Os demais campos do roteiro são opcionais. Grava `ended_at` e `ended_by`. Depois de concluída, o prospect passa a "aguardando fechamento do plano".
4. **Sem registro:** se ninguém iniciou até 30 min depois do fim da aula, a AT aparece como "sem registro" e o professor ou coordenador confirma `faltou` ou `cancelada` com um clique. **Sem automação.** AT iniciada nunca vira "faltou". Grava `no_show_at` quando `faltou`.
5. **Reabrir** uma AT concluída: só coordenador ou admin, com motivo registrado.
6. Fuso America/Sao_Paulo em todas as comparações de horário.

## Combinados
- **Sem tabela nova.** Colunas novas em `student_sessions` são permitidas (`started_at`, `started_by`, `ended_at`, `ended_by`, `no_show_at`, motivo de reabertura); diga no plano se prefere outro desenho.
- Não altere linhas existentes de `students` nem de `student_sessions`; sem sincronização; nada no EVO. ATs já passadas ficam sem estado novo (não preencher retroativamente).
- Mudanças de permissão passam por RLS/RPC; a validação das janelas de horário e da conduta obrigatória deve estar **no banco (RPC)**, não só no front.
- Não mexer no envio de e-mail, no SMTP nem nas chaves de teste. Não publicar.
- Não sobrescreva `.lovable/plan.md`: acrescente ao final. Releia o código atual antes de editar. Registre no `CHANGELOG.md` no mesmo commit.
- Nenhum dado pessoal real em testes, logs ou `CHANGELOG.md`.

Mostre o plano, a lista de arquivos e as perguntas que tiver, e não implemente ainda.
