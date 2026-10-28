# Fase 0 — proposta do gestor de projetos e tarefas

Esta proposta cobre o MVP da especificação. Não há implementação, migrations ou infraestrutura implantada nesta fase. O nome, domínio e características da VPS permanecem em aberto. A interface será em português brasileiro.

## Estrutura proposta

```text
src/
  app/
    (auth)/                  views: login, recuperação e convite
    (app)/                   views: telas autenticadas
    api/                     controllers: HTTP e healthcheck
  components/                interface, board, formulários e acessibilidade
  server/
    auth/                    configuração da biblioteca e sessão
    authorization/           associação e verificações de permissão
    domain/                  regras, transições e histórico
    services/                casos de uso transacionais
    repositories/            consultas Prisma
    jobs/                    agendamentos e processamento pg-boss
    notifications/           notificações e SMTP
    storage/                 anexos locais e validações
  lib/                       utilitários compartilhados e validações Zod
  types/
prisma/
  schema.prisma
  migrations/
  seed.ts
tests/
  unit/                      Vitest: regras e autorização
  integration/               banco, concorrência e rotas
  e2e/                       Playwright: fluxos principais
deploy/
  Caddyfile
  compose.yml
  backup.sh
  restore.sh
  cron.example
  Dockerfile
docs/
  ARQUITETURA.md             camadas, fluxos e decisões
  FUNCIONALIDADES.md         regras, fluxos e endpoints
  ACESSOS_E_CREDENCIAIS.md   inventário sem segredos
  MATRIZ_DE_PERMISSOES.md    permissões efetivas do backend
  BANCO_DE_DADOS.md          modelo, constraints e migrations
  INTEGRACOES.md             SMTP e outras integrações presentes
  DECISOES_TECNICAS.md       decisões e alternativas relevantes
  TESTES_E_QUALIDADE.md      estratégia e resultados
  PERFORMANCE_E_RESPONSIVIDADE.md
  DEPLOY_E_OPERACAO.md       implantação e recuperação
  PENDENCIAS_E_RISCOS.md
.env.example
.gitignore
MASTER_PROMPT.md
AGENTS.md
PROJECT_CONTEXT.md
README.md
```

A organização segue MVC com serviços: rotas HTTP coordenam requisições, componentes apresentam dados e serviços concentram regras; repositórios isolam consultas quando necessário. Validadores Zod definem contratos de entrada. Os arquivos de documentação serão criados com conteúdo conforme cada fase e atualizados quando afetados, sem registrar credenciais reais. `MASTER_PROMPT.md` é a referência de engenharia fornecida; `AGENTS.md` sintetizará instruções específicas e não duplicará segredos.

Além dos testes de domínio e autorização, a validação das interfaces contemplará larguras de 320, 375, 768, 1024, 1366 e 1920 px, estados de carregamento, vazio, erro e sucesso, caracteres em português e navegação por teclado. Formatter, lint, typecheck, testes, build e verificações de banco serão executados quando aplicáveis à fase e disponíveis; resultados não executados serão informados.

## Modelo proposto

O esquema abaixo é a proposta lógica completa para o MVP, expressa em Prisma. A configuração definitiva da biblioteca de autenticação poderá exigir adaptação de nomes e campos de suas tabelas, sem alterar as regras de domínio. IDs são `cuid`, datas são armazenadas em UTC e renderizadas conforme o fuso configurado. Campos de data sem horário são `@db.Date`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role { ADMIN MEMBER OBSERVER }
enum StatusCategory { TODO IN_PROGRESS DONE }
enum ItemType { EPIC TASK BUG SUBTASK }
enum NotificationType { ASSIGNED MENTION COMMENT DUE_SOON }
enum TransitionField { ASSIGNEE PRIORITY START_DATE DUE_DATE ESTIMATE DESCRIPTION }

model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  disabledAt    DateTime?
  accounts      Account[]
  sessions      Session[]
  workspaceMemberships WorkspaceMember[]
  projectMemberships ProjectMember[]
  invitationsSent Invitation[] @relation("InvitationSender")
  assignedItems Item[] @relation("ItemAssignee")
  reportedItems Item[] @relation("ItemReporter")
  checklistAssignments ChecklistItem[] @relation("ChecklistAssignee")
  comments Comment[]
  attachments Attachment[]
  history ItemHistory[]
  filters SavedFilter[]
  inbox InboxEntry[]
  notifications Notification[]
  watches ItemWatch[]
}

// Tabelas de autenticação: sujeitos à adaptação ao provedor escolhido.
model Account {
  id                    String @id @default(cuid())
  userId                String
  providerId            String
  accountId             String
  passwordHash          String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  user                  User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([providerId, accountId])
  @@index([userId])
}

model Session {
  id        String @id @default(cuid())
  tokenHash String @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([expiresAt])
}

model Verification {
  id         String @id @default(cuid())
  identifier String
  valueHash  String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([identifier])
  @@index([expiresAt])
}

model Workspace {
  id        String @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  members   WorkspaceMember[]
  projects  Project[]
  invitations Invitation[]
}

model WorkspaceMember {
  workspaceId String
  userId      String
  role        Role @default(MEMBER)
  createdAt   DateTime @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([workspaceId, userId])
  @@index([userId])
}

model Invitation {
  id          String @id @default(cuid())
  workspaceId String
  email       String
  role        Role
  tokenHash   String @unique
  invitedById String
  expiresAt   DateTime
  acceptedAt  DateTime?
  revokedAt   DateTime?
  createdAt   DateTime @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  invitedBy   User @relation("InvitationSender", fields: [invitedById], references: [id])
  @@index([workspaceId, email])
}

model Project {
  id          String @id @default(cuid())
  workspaceId String
  key         String
  name        String
  description String?
  nextNumber  Int @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  members     ProjectMember[]
  statuses    Status[]
  transitions Transition[]
  columns     BoardColumn[]
  items       Item[]
  labels      Label[]
  filters     SavedFilter[]
  @@unique([workspaceId, key])
  @@index([workspaceId])
}

model ProjectMember {
  projectId String
  userId    String
  createdAt DateTime @default(now())
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([projectId, userId])
  @@index([userId])
}

model Status {
  id         String @id @default(cuid())
  projectId  String
  name       String
  category   StatusCategory
  sortOrder  Int
  project    Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  outgoing   Transition[] @relation("TransitionFrom")
  incoming   Transition[] @relation("TransitionTo")
  columnMappings BoardColumnStatus[]
  items      Item[]
  @@unique([projectId, name])
  @@index([projectId, sortOrder])
}

model Transition {
  id             String @id @default(cuid())
  projectId      String
  fromStatusId   String
  toStatusId     String
  requiredFields TransitionField[]
  project        Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  fromStatus     Status @relation("TransitionFrom", fields: [fromStatusId], references: [id], onDelete: Restrict)
  toStatus       Status @relation("TransitionTo", fields: [toStatusId], references: [id], onDelete: Restrict)
  @@unique([projectId, fromStatusId, toStatusId])
  @@index([fromStatusId])
  @@index([toStatusId])
}

model BoardColumn {
  id            String @id @default(cuid())
  projectId     String
  name          String
  sortOrder     Int
  wipMin        Int?
  wipMax        Int?
  wipBlocking   Boolean @default(false)
  project       Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  statuses      BoardColumnStatus[]
  @@unique([projectId, name])
  @@index([projectId, sortOrder])
}

model BoardColumnStatus {
  columnId String
  statusId String @unique
  column   BoardColumn @relation(fields: [columnId], references: [id], onDelete: Cascade)
  status   Status @relation(fields: [statusId], references: [id], onDelete: Cascade)
  @@id([columnId, statusId])
}

model Item {
  id              String @id @default(cuid())
  projectId       String
  number          Int
  type            ItemType
  title           String
  description     String? @db.Text
  statusId        String
  parentId        String?
  assigneeId      String?
  reporterId      String?
  priority        Int @default(3)
  startDate       DateTime? @db.Date
  dueDate         DateTime? @db.Date
  estimate        Decimal? @db.Decimal(10, 2)
  rank            String
  statusChangedAt DateTime @default(now())
  resolvedAt      DateTime?
  deletedAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  project         Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  status          Status @relation(fields: [statusId], references: [id], onDelete: Restrict)
  parent          Item? @relation("ItemTree", fields: [parentId], references: [id], onDelete: Restrict)
  children        Item[] @relation("ItemTree")
  assignee        User? @relation("ItemAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  reporter        User? @relation("ItemReporter", fields: [reporterId], references: [id], onDelete: SetNull)
  labels          ItemLabel[]
  checklist       ChecklistItem[]
  comments        Comment[]
  attachments     Attachment[]
  history         ItemHistory[]
  watches         ItemWatch[]
  @@unique([projectId, number])
  @@index([projectId, statusId, rank])
  @@index([projectId, deletedAt])
  @@index([assigneeId, dueDate])
  @@index([parentId])
  @@index([reporterId])
}

model Label {
  id        String @id @default(cuid())
  projectId String
  name      String
  color     String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  items     ItemLabel[]
  @@unique([projectId, name])
}

model ItemLabel {
  itemId  String
  labelId String
  item    Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  label   Label @relation(fields: [labelId], references: [id], onDelete: Cascade)
  @@id([itemId, labelId])
  @@index([labelId])
}

model ChecklistItem {
  id         String @id @default(cuid())
  itemId     String
  text       String
  completed  Boolean @default(false)
  assigneeId String?
  dueDate    DateTime? @db.Date
  sortOrder  Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  item       Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  assignee   User? @relation("ChecklistAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  @@index([itemId, sortOrder])
  @@index([assigneeId])
}

model Comment {
  id        String @id @default(cuid())
  itemId    String
  authorId  String?
  body      String @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  item      Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  author    User? @relation(fields: [authorId], references: [id], onDelete: SetNull)
  @@index([itemId, createdAt])
  @@index([authorId])
}

model Attachment {
  id           String @id @default(cuid())
  itemId       String
  uploadedById String?
  originalName String
  storageKey   String @unique
  contentType  String
  sizeBytes    BigInt
  createdAt    DateTime @default(now())
  item         Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  uploadedBy   User? @relation(fields: [uploadedById], references: [id], onDelete: SetNull)
  @@index([itemId])
  @@index([uploadedById])
}

model ItemHistory {
  id        String @id @default(cuid())
  itemId    String
  authorId  String?
  field     String
  oldValue  Json?
  newValue  Json?
  createdAt DateTime @default(now())
  item      Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  author    User? @relation(fields: [authorId], references: [id], onDelete: SetNull)
  @@index([itemId, createdAt])
  @@index([authorId])
}

model ItemWatch {
  itemId    String
  userId    String
  createdAt DateTime @default(now())
  item      Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([itemId, userId])
  @@index([userId])
}

model SavedFilter {
  id        String @id @default(cuid())
  projectId String
  ownerId   String
  name      String
  criteria  Json
  shared    Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  owner     User @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  @@index([projectId, shared])
  @@index([ownerId])
}

model InboxEntry {
  id        String @id @default(cuid())
  userId    String
  title     String
  body      String? @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, createdAt])
}

model Notification {
  id        String @id @default(cuid())
  userId    String
  type      NotificationType
  itemId    String?
  payload   Json
  dedupeKey String? @unique
  readAt    DateTime?
  createdAt DateTime @default(now())
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, readAt, createdAt])
}
```

### Regras e integridade adicionais

- O papel pertence ao workspace. O acesso ao projeto exige `ProjectMember` e associação ativa ao workspace; a proposta é que administradores também sejam membros explícitos do projeto. Observadores leem e comentam; membros editam itens; administradores configuram o projeto. Toda operação verifica associação e papel no servidor.
- Status, colunas, transições, itens, pais e etiquetas relacionados devem pertencer ao mesmo projeto; responsáveis devem ter acesso ao projeto. Essas invariantes serão verificadas no serviço e reforçadas por chaves compostas/constraints SQL na migration, onde aplicável.
- O serviço rejeita ciclos na hierarquia; SUBTASK exige pai e EPIC só aceita TASK ou BUG como filho. Restrições adicionais de hierarquia devem ser decididas, pois a especificação não as define.
- Cada status pertence a uma única coluna neste MVP. `statusChangedAt` registra mudança de status, não necessariamente mudança física de coluna quando há vários status na mesma coluna. Para mostrar **dias na coluna** corretamente, proponho acrescentar `columnChangedAt` ao item e atualizá-lo somente quando a coluna mudar; configurações que remapeiam status precisam definir como tratar esse relógio.
- Toda edição de item e seus componentes, inclusive checklist, rótulos, comentários e anexos, gera evento no histórico na mesma transação da alteração. Eventos podem usar campos como `checklist.created` e JSON estruturado. Exclusão lógica registra autor, data e mudança; exclusões físicas só segundo a política LGPD aprovada.
- A mudança de status valida a transição e campos, conta itens ativos de todos os status da coluna de destino, e aplica WIP antes de salvar. A verificação e atualização precisam de transação com bloqueio por coluna ou isolamento e repetição apropriados para impedir duas movimentações simultâneas de ultrapassarem o limite. Mover entre status da mesma coluna não incrementa seu total.
- A numeração é reservada atomicamente por projeto. A chave exibida é `Project.key` + `number`; como a chave é única por workspace, a busca global precisa do contexto do workspace ou de uma regra de desambiguação.
- Para notificações vencendo em 24 horas, datas sem horário não definem um instante exato: é preciso escolher fuso e horário de referência. Os jobs usam deduplicação persistente e tentativas; envio por SMTP depende de configuração e disponibilidade externa.
- Menções devem resolver usuários com acesso ao projeto; Markdown deve ser sanitizado ao renderizar. Downloads de anexos passam por autorização; limite, extensões e validação de conteúdo serão configuráveis após definição.
- A exclusão de dados pessoais pode conflitar com histórico, comentários, anexos e dados de equipe. A proposta técnica inicial é anonimizar a autoria e remover dados estritamente pessoais, com tratamento explícito para texto livre e backups; o procedimento exato precisa ser aprovado antes da implementação LGPD.
- Constraints adicionais de SQL: prioridade entre 1 e 4, estimativa não negativa, WIP não negativo e mínimo não superior ao máximo. Busca global por texto poderá usar índices PostgreSQL apropriados e será medida com dados representativos. A meta de 2 s depende de hardware, rede e volume e precisa ser aferida na VPS.

## Rotas propostas

Páginas web, todas autenticadas salvo indicação:

| Rota | Finalidade |
|---|---|
| `/login` | Entrada e recuperação de acesso |
| `/recuperar-senha`, `/redefinir-senha` | Solicitação e troca de senha |
| `/convites/[token]` | Aceitar convite |
| `/` | Entrada na visão pessoal e seleção de workspace |
| `/meu-trabalho` | Itens atribuídos, agrupados por vencimento |
| `/inbox` | Captura e triagem pessoal |
| `/busca` | Busca por chave e texto |
| `/notificacoes` | Central in-app |
| `/configuracoes/conta` | Conta, senha e solicitação de exportação/exclusão |
| `/w/[workspaceId]/projetos` | Projetos do workspace |
| `/w/[workspaceId]/membros` | Membros e convites |
| `/w/[workspaceId]/p/[projectId]/board` | Kanban, filtros, swimlanes e painel lateral |
| `/w/[workspaceId]/p/[projectId]/lista` | Tabela filtrável e ordenável |
| `/w/[workspaceId]/p/[projectId]/calendario` | Calendário por vencimento |
| `/w/[workspaceId]/p/[projectId]/itens/[itemId]` | Link direto para item, com apresentação em painel quando possível |
| `/w/[workspaceId]/p/[projectId]/configuracoes` | Projeto e membros |
| `/w/[workspaceId]/p/[projectId]/workflow` | Status e transições |
| `/w/[workspaceId]/p/[projectId]/colunas` | Colunas, mapeamento e WIP |

Endpoints internos propostos; não constituem uma API pública com token ou webhooks:

| Método e rota | Uso |
|---|---|
| `GET /api/health` | Saúde da aplicação e conectividade do banco, sem expor segredos |
| `GET, POST /api/auth/[...all]` | Sessão, login, recuperação e demais operações do provedor |
| `GET, POST /api/workspaces` | Listar e criar workspaces |
| `GET, PATCH /api/workspaces/[workspaceId]` | Consultar e editar workspace |
| `GET, POST /api/workspaces/[workspaceId]/members` | Listar membros e enviar convite |
| `PATCH, DELETE /api/workspaces/[workspaceId]/members/[userId]` | Alterar papel ou remover membro |
| `POST /api/invitations/[token]/accept` | Aceitar convite |
| `GET, POST /api/workspaces/[workspaceId]/projects` | Listar e criar projetos |
| `GET, PATCH /api/projects/[projectId]` | Consultar e editar projeto |
| `GET, POST /api/projects/[projectId]/members` | Listar e adicionar membros |
| `DELETE /api/projects/[projectId]/members/[userId]` | Remover membro de projeto |
| `GET, POST /api/projects/[projectId]/statuses` | Listar e criar status |
| `PATCH, DELETE /api/projects/[projectId]/statuses/[statusId]` | Editar ou remover status quando permitido |
| `GET, POST /api/projects/[projectId]/transitions` | Listar e criar transições |
| `PATCH, DELETE /api/projects/[projectId]/transitions/[transitionId]` | Editar ou remover transição |
| `GET, POST /api/projects/[projectId]/columns` | Listar e criar colunas |
| `PATCH, DELETE /api/projects/[projectId]/columns/[columnId]` | Configurar coluna, status e WIP |
| `GET /api/projects/[projectId]/board` | Dados do board com filtros e paginação apropriada |
| `GET, POST /api/projects/[projectId]/items` | Consultar e criar itens |
| `GET, PATCH, DELETE /api/items/[itemId]` | Detalhe, edição e exclusão lógica |
| `POST /api/items/[itemId]/transition` | Transição e posição; validação e histórico no servidor |
| `POST /api/items/[itemId]/rank` | Reordenação sem troca de status |
| `GET, POST /api/items/[itemId]/checklist` | Listar e adicionar passos |
| `PATCH, DELETE /api/items/[itemId]/checklist/[checklistId]` | Editar e remover passos |
| `GET, POST /api/items/[itemId]/comments` | Listar e publicar comentários |
| `PATCH, DELETE /api/items/[itemId]/comments/[commentId]` | Editar ou remover comentário conforme política |
| `GET, POST /api/items/[itemId]/attachments` | Listar e enviar anexos |
| `GET, DELETE /api/items/[itemId]/attachments/[attachmentId]` | Download autorizado ou remoção |
| `GET /api/items/[itemId]/history` | Histórico paginado |
| `PUT, DELETE /api/items/[itemId]/watch` | Seguir ou deixar de seguir |
| `GET, POST /api/projects/[projectId]/labels` | Listar e criar etiquetas |
| `PATCH, DELETE /api/projects/[projectId]/labels/[labelId]` | Editar e remover etiquetas |
| `GET, POST /api/projects/[projectId]/filters` | Listar e salvar filtros |
| `PATCH, DELETE /api/filters/[filterId]` | Editar e remover filtro autorizado |
| `GET, POST /api/inbox` | Listar e capturar entradas pessoais |
| `PATCH, DELETE /api/inbox/[entryId]` | Editar e remover entrada própria |
| `POST /api/inbox/[entryId]/convert` | Converter em item de projeto, atomicamente |
| `GET /api/my-work`, `GET /api/search` | Visão pessoal e busca autorizada |
| `GET /api/notifications` | Listar notificações próprias |
| `PATCH /api/notifications/[notificationId]` | Marcar como lida |
| `POST /api/account/export`, `POST /api/account/delete` | Solicitar exportação ou exclusão conforme política aprovada |

Todas as rotas validam sessão, escopo e entrada. Rotas que alteram dados usam proteção CSRF adequada ao mecanismo de sessão. Uploads recebem limites também no proxy. Não há implementação de versão pública da API nesta fase.

## Decisões a confirmar

1. **Nome do sistema**, domínio, distribuição Linux e quantidade de RAM da VPS.
2. **Anexos:** tamanho máximo por arquivo e lista de extensões permitidas.
3. **Permissões:** administradores precisam ser adicionados a cada projeto para acessá-lo, ou podem acessar todos os projetos do workspace? A proposta acima usa associação explícita para todos.
4. **Hierarquia:** além das duas regras especificadas, quais tipos podem ser pais de subtarefas? Permitimos TASK e BUG como pais, por exemplo?
5. **Vencimento:** fuso e horário de referência para o aviso de 24 horas quando o item possui apenas data. Sugestão: `America/Sao_Paulo`, às 9h do dia anterior.
6. **LGPD:** política de anonimização e retenção para comentários, histórico, anexos e backups após solicitação de exclusão.
7. **Fluxo visual:** uma coluna pode conter vários status. Ao arrastar para essa coluna, qual status de destino escolher? Sugestão: solicitar escolha quando houver mais de um destino válido.
8. **Arquivamento:** a seção de comparação cita arquivar itens, mas o recorte do MVP e o modelo só definem exclusão lógica. Confirmar se arquivamento deve existir no MVP; se sim, acrescentar `archivedAt` e regra de visibilidade/WIP.

## Encerramento da fase

Proposta pronta para revisão. Nenhum código foi executado, nenhuma migration foi aplicada e nenhum teste foi realizado: a Fase 0 é de desenho. Após aprovação e esclarecimento dos pontos que afetem a Fase 1, a próxima etapa será autenticação, workspaces, projetos e papéis, com os testes e instruções de execução correspondentes.
