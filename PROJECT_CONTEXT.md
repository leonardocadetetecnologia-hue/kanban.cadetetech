# Contexto do projeto — ponto de retomada

Atualizado em 28/10/2026. Este projeto ainda está na definição e validação visual, antes da implementação do MVP.

## Objetivo

Gestor de projetos e tarefas Kanban para uma VPS Linux, em português brasileiro, para equipe de até aproximadamente 50 pessoas. Combina workflow governado, WIP e hierarquia do Jira com Inbox, Meu trabalho, lista e calendário do Trello.

## Decisões e preferências do usuário

- Trabalhar por fases, com revisão e confirmação entre fases. O usuário antecipou a aprovação visual antes da implementação.
- O usuário aprovou a direção minimalista redesenhada: navegação lateral discreta, quatro colunas, cartões limpos e painel lateral de detalhe.
- O Estúdio foi o ponto de partida; o resultado aprovado evoluiu para o protótipo `kanban-minimal.html`. Não retomar as propostas antigas como se fossem a versão atual.
- Preto e tons neutros são o destaque principal, substituindo o verde. Preservar o layout aprovado.
- Último ajuste enviado pelos controles visuais: cantos dos cartões de **9 px** e espaçamento interno de **10 px**. Esses valores foram incorporados ao protótipo ao registrar este ponto.
- Pedido mais recente de desenvolvimento visual: enriquecer detalhes, especialmente progresso por item e checklists, mantendo o minimalismo.
- A versão enriquecida foi entregue para avaliação; ainda não houve aprovação explícita de todos os seus detalhes ou autorização para iniciar o backend.

## O que existe

1. `docs/FASE_0.md`: estrutura de pastas, schema Prisma proposto, rotas, regras de integridade e decisões pendentes. Desenho técnico ainda sujeito a revisão; não equivale a schema validado ou migration executada.
2. Protótipo inline atual, fonte persistida em:
   `src/kanban-minimal.html`.
3. Rascunhos anteriores: as versões anteriores da exploração visual. São versões antigas.
4. o script em `src/kanban-minimal.html`: script da versão enriquecida, incorporado também ao HTML atual.
5. `tests/preview.cjs`: verificação automatizada do protótipo com Playwright e Chrome instalado.

## Detalhes presentes no protótipo atual

- Quadro de quatro etapas: A fazer, Em andamento, Em revisão e Concluído.
- Progresso calculado a partir do checklist, com percentual e contagem concluída/total.
- Etapas de checklist editáveis, cada uma com responsável e prazo; inclusão de novos passos.
- Subtarefas com contagem e alternância de conclusão, comentários, referências de anexos e atividade local.
- Prioridade, data, responsável, etiquetas, referência de épico e tempo na coluna nos cartões.
- Painel lateral com propriedades e abas Detalhes, Comentários e Atividade.
- Troca entre Quadro e Lista; filtro Minhas tarefas; ordenação por prioridade; criação de tarefa de demonstração.
- Datas e responsáveis podem ser alterados na prévia; seleção de arquivo registra apenas nome e tamanho, sem upload.
- Todos os dados são ilustrativos e as mudanças ficam somente em memória durante a demonstração. Recarregar reinicia os dados.
- O progresso é do checklist e não representa, por si só, mudança de status ou avanço agregado de subtarefas.

## Validação realizada

`npm test` passou usando Playwright com Chrome local:

- Marcar passo mudou 60% para 80% e atualizou o cartão.
- Adicionar passo recalculou o percentual para 4/6 = 67%.
- Comentários foram adicionados com texto escapado; eventos apareceram na atividade.
- Não houve erros de JavaScript no fluxo verificado.
- Não houve overflow horizontal da página em 320, 375, 768, 1024, 1366 e 1920 px.
- JavaScript passou em `node --check`. Captura desktop inspecionada na sessão de desenvolvimento original.

Essas verificações são do protótipo; não validam backend, persistência, autorização, workflow, WIP ou restauração de backup. Não existe autenticação, banco funcional, migrations aplicadas ou implantação na VPS.

## Stack planejada

Next.js App Router, TypeScript estrito, PostgreSQL, Prisma, Tailwind/shadcn, dnd-kit, biblioteca madura de autenticação com Argon2 e cookie httpOnly, pg-boss, SMTP, anexos em volume local, Docker Compose e Caddy, Vitest e Playwright. Conferir versões atuais e compatibilidade quando iniciar a implementação.

## Documentos de referência

- Requisitos: `docs/REQUISITOS.md`.
- Diretrizes de engenharia fornecidas: `MASTER_PROMPT.md`.
- Comparação e recorte originais: `docs/REQUISITOS.md`.

## Pendências antes de implementar as fases dependentes

- Nome, domínio, distribuição e RAM da VPS.
- Limite e extensões de anexos.
- Acesso dos administradores aos projetos: global ou por associação explícita.
- Pais permitidos para subtarefas e demais detalhes da hierarquia.
- Horário/fuso do aviso de vencimento com datas sem horário.
- Política de exclusão/anonimização e retenção de dados pessoais e backups.
- Escolha do status de destino em colunas com vários status; relógio de dias na coluna.
- Se arquivamento pertence ao MVP ou somente exclusão lógica.
- Aprovação técnica da Fase 0 e autorização de início da Fase 1.

## Próxima retomada

Continuar a revisão do protótipo enriquecido a partir da versão atual. Se o usuário aprovar o visual e autorizar implementação, seguir o plano por fases; a Fase 1 é autenticação, workspaces, projetos e papéis. Não apresentar a aplicação como pronta nem publicar sem o fluxo de implementação acordado.

Para novas alterações inline, reler integralmente a habilidade `visualize` antes de criar ou atualizar uma visualização e emitir sua referência no mesmo turno da alteração.

## Disponibilidade remota

Repositório: https://github.com/leonardocadetetecnologia-hue/kanban.cadetetech . Acesso público conforme o destino fornecido pelo usuário. A prévia portátil está em index.html. Nenhum backend foi implantado. A prévia privada foi publicada com sucesso em https://kanban-leonardo-prototipo.leocadete.chatgpt.site . A criação do repositório não configura automaticamente o Codex Cloud.

