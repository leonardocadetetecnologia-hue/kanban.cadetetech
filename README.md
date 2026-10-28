# Kanban CadeteTech

Protótipo visual e especificação de um gestor de projetos e tarefas para VPS Linux.

## Estado atual

O visual minimalista foi aprovado como direção de design: preto e tons neutros, navegação lateral discreta, quatro colunas e detalhe em painel. A versão enriquecida inclui progresso por checklist, subtarefas, comentários, referências de anexos e atividade.

**Este repositório ainda contém um protótipo. O backend, a autenticação, o banco de dados e a implantação do MVP não foram implementados.** As alterações da demonstração ficam em memória e são descartadas ao recarregar. Os nomes e tarefas são exemplos.

## Prévia online

Acesse a [prévia privada do Kanban](https://kanban-leonardo-prototipo.leocadete.chatgpt.site) usando a conta proprietária. Publicação confirmada em 28/10/2026. As alterações permanecem em memória; o backend ainda não foi implementado.

## Abrir em outra máquina

Clone ou baixe este repositório e abra `index.html` em um navegador moderno. O arquivo é autossuficiente; não exige instalação de dependências para a prévia.

Para servir por HTTP com Node.js:

```sh
npm start
```

Abra `http://127.0.0.1:4173`. O servidor é apenas de arquivos estáticos para desenvolvimento local.

## Retomar no Codex online

Conecte este repositório ao ambiente de nuvem da sua conta. No início da próxima tarefa, peça:

> Leia AGENTS.md, PROJECT_CONTEXT.md, MASTER_PROMPT.md e docs/REQUISITOS.md. Retome o projeto a partir do protótipo aprovado, preservando o tema preto, os cantos dos cartões de 9 px e o espaçamento interno de 10 px. O backend ainda não começou. Revise docs/FASE_0.md e as decisões pendentes; trabalhe por fases e aguarde minha confirmação antes de iniciar a próxima fase.

O envio ao GitHub disponibiliza os arquivos; a seleção e configuração do ambiente Codex Cloud continuam dependendo da sua conta.

## Arquivos

- `index.html`: prévia portátil e autossuficiente, exportada da versão atual.
- `src/kanban-minimal.html`: fonte do protótipo inline, com estilos e interações. Sua execução original usa os ícones fornecidos pelo ambiente; a prévia exportada inclui o runtime necessário.
- `PROJECT_CONTEXT.md`: decisões, estado e ponto de retomada, com referências portáteis.
- `MASTER_PROMPT.md`: diretrizes de engenharia fornecidas para o projeto.
- `docs/REQUISITOS.md`: escopo, domínio, stack e fases solicitadas.
- `docs/FASE_0.md`: proposta técnica para revisão, ainda não convertida em migrations.
- `tests/preview.cjs`: testes de interação e de overflow horizontal da prévia.

Durante esta fase de design, a fonte inline e a exportação representam a mesma versão. Se alterar uma delas, mantenha a outra correspondente. A implementação Next.js deverá substituir este protótipo quando a fase correspondente for autorizada.

## Testar o protótipo

Requer Node.js e Playwright. A versão da dependência corresponde à utilizada na verificação original.

```sh
npm install
npx playwright install chromium
npm test
```

Opcionalmente, configure `CHROME_PATH` com o executável de um Chrome já instalado. O teste verifica progresso do checklist, inclusão de passos, comentários como texto, atividade, atualização do cartão e ausência de overflow nas larguras de 320 a 1920 px. Não é uma verificação do backend.

## Planejamento do MVP

Next.js App Router, TypeScript estrito, PostgreSQL/Prisma, Tailwind/shadcn, dnd-kit, autenticação madura com Argon2, pg-boss, SMTP, anexos locais, Docker Compose e Caddy. As versões e compatibilidades serão definidas no início da implementação.

Pendências: nome definitivo, domínio e características da VPS; limites de anexos; detalhes das permissões e hierarquia; vencimentos; exclusão e retenção; status por coluna; arquivamento; aprovação técnica da Fase 0 e início da Fase 1.

Nenhuma senha, token ou arquivo `.env` deve ser versionado.
