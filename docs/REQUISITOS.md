Estou construindo um gestor de tarefas e projetos baseado em Kanban, chamado <NOME_DO_SISTEMA>, para usar com a minha equipe (até ~50 pessoas). Ele vai rodar na minha VPS Linux (<DISTRO>, <RAM> de RAM) no domínio <DOMINIO>, com interface em português do Brasil. Quero juntar o núcleo de processo do Jira (workflow, tipos de item, limite WIP, swimlanes) com a praticidade do Trello (captura rápida, "meu trabalho", visões em lista e calendário).

Sou analista de sistemas e domino banco de dados e arquitetura, então não precisa explicar conceitos básicos. Preciso que você escreva o código comigo, em fases, e pare ao fim de cada uma para eu revisar. Não avance sem minha confirmação e não invente requisitos que não estão aqui; se algo estiver ambíguo, me pergunte.

## Stack que eu escolhi
- Next.js (App Router) + TypeScript estrito, versões estáveis atuais.
- PostgreSQL + Prisma, com migrations versionadas e seed.
- Tailwind CSS + shadcn/ui; arrastar e soltar com dnd-kit.
- Autenticação com biblioteca madura (Better Auth ou Auth.js), senha em argon2, sessão em cookie httpOnly.
- pg-boss para jobs (e-mails e notificações), SMTP configurável, anexos em volume local.
- Docker Compose em produção com app, db e caddy (HTTPS automático).
- Vitest para regras de domínio e Playwright para os fluxos principais.

## Como eu modelei o domínio
- User; Workspace; WorkspaceMember com papel ADMIN, MEMBER ou OBSERVER.
- Project com chave curta (ex.: OPS) e ProjectMember.
- Status por projeto: nome, categoria (TODO, IN_PROGRESS, DONE) e ordem.
- Transition: statusOrigem -> statusDestino e camposObrigatorios[]. Se a transição não está cadastrada, o movimento é proibido.
- BoardColumn: nome, statusIds[], wipMin, wipMax, wipBloqueante e ordem.
- Item: chave sequencial por projeto (OPS-123), tipo (EPIC, TASK, BUG, SUBTASK), título, descrição em Markdown, statusId, parentId, assigneeId, reporterId, prioridade 1-4, etiquetas, startDate, dueDate, estimativa, rank (fractional indexing), statusChangedAt, resolvedAt, deletedAt.
- ChecklistItem com texto, concluído, responsável e data.
- Comment (Markdown com @menção), Attachment, Label.
- ItemHistory: campo, valor antigo, valor novo, autor e data, gravado em toda alteração.
- SavedFilter: nome, critérios em JSON, compartilhado ou não.
- InboxEntry: captura pessoal sem projeto, que eu converto em Item depois.
- Notification.

Se achar que falta algo no modelo, proponha antes de implementar.

## Regras que não podem ser quebradas
1. Toda mudança de status passa por um serviço de domínio no servidor que valida transição, campos obrigatórios e WIP. A tela nunca é a única validação.
2. Coluna acima do wipMax fica destacada; se wipBloqueante for verdadeiro, o movimento é recusado com mensagem clara.
3. Subtarefa sempre tem pai; épico só é pai de TASK ou BUG.
4. Ao entrar em status DONE o item recebe resolvedAt; ao sair, o campo é limpo.
5. Observer só lê e comenta; Member edita itens do projeto; Admin configura workflow, colunas e membros.
6. Exclusão de item é lógica e fica registrada no histórico.

## O que eu quero no MVP
- Login, convite por e-mail, troca de senha e papéis.
- Workspaces e projetos, com um editor de workflow (status, categorias, transições e campos obrigatórios).
- O board Kanban, que é o coração do sistema: colunas configuráveis, arrastar e soltar com atualização otimista e rollback em caso de erro, contador e limite WIP por coluna, swimlanes (nenhuma, responsável, épico ou prioridade) e indicador de quantos dias o card está na coluna.
- Filtros rápidos combináveis (meus itens, prioridade alta, atrasados, por etiqueta e por tipo), filtros salvos e busca global por chave e texto.
- Detalhe do item num painel lateral: todos os campos, checklist, comentários, anexos (até <TAMANHO> MB, só extensões permitidas), subitens e histórico.
- Inbox pessoal com captura rápida por atalho de teclado e triagem para um projeto.
- Tela "Meu trabalho" com os itens atribuídos a mim, agrupados por vencimento.
- Visões Lista/Tabela (ordenável e filtrável) e Calendário por data de entrega.
- Notificações in-app e por e-mail para atribuição, menção, comentário em item que sigo e vencimento em 24 h.

## O que fica para depois
Backlog e releases, links entre itens, relatórios de fluxo (CFD e cycle time), automações, timeline, sprints, API pública com webhooks e importação do Trello/Jira. Não implemente agora, mas não feche o modelo para eles.

## Requisitos técnicos que eu exijo
- Segurança: HTTPS, rate limit no login, proteção CSRF, validação de entrada com Zod, autorização checada em toda rota e ação de servidor, nenhum segredo no repositório e um .env.example documentado.
- LGPD: exportar e excluir os dados de um usuário; logs sem o conteúdo dos itens.
- Desempenho: um board com 500 itens carrega em menos de 2 s; índices nas FKs e em (projectId, statusId, rank).
- Funciona no celular, tem tema claro e escuro e navegação por teclado com foco visível.
- Operação: healthcheck, logs em stdout, backup diário com pg_dump mais o volume de anexos, retenção de 7 dias e um script de restore que funcione.

## Como vamos trabalhar
- Fase 0: me proponha a estrutura de pastas, o schema Prisma completo e a lista de rotas. Pare e espere minha aprovação.
- Fase 1: autenticação, workspaces, projetos e papéis.
- Fase 2: workflow, colunas e o serviço de transição, com testes unitários das regras 1 a 4.
- Fase 3: o board Kanban completo.
- Fase 4: detalhe do item, checklist, comentários, anexos e histórico.
- Fase 5: Inbox, Meu trabalho, Lista/Tabela, Calendário e filtros.
- Fase 6: notificações e e-mail.
- Fase 7: Docker Compose de produção, Caddy, backup/restore e um README de implantação na VPS, passo a passo.

Ao fim de cada fase quero: o código rodando, testes passando, migrations aplicadas e um resumo com o que foi feito, o que ficou pendente e como eu testo manualmente.

## Como eu vou dar o MVP por aceito
- Mover um item para um status sem transição cadastrada é recusado pelo servidor.
- Mover para uma coluna com WIP bloqueante cheio é recusado; se não for bloqueante, a coluna só fica destacada.
- Toda alteração de campo aparece no histórico com autor e data.
- Um Observer não consegue editar por nenhum caminho, nem pela tela nem por chamada direta.
- O backup gerado pelo cron é restaurado com sucesso num banco limpo.

Comece pela Fase 0.