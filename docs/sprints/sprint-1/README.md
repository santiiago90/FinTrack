# Sprint 1 — Fundação do projeto e CI inicial

[Visão geral do projeto](../../../README.md) · [Sprint 2](../sprint-2/README.md)

## Objetivo

Preparar a base do FinTrack: definir o problema e o âmbito do MVP, escolher a arquitetura, organizar o trabalho e criar uma primeira aplicação backend com integração contínua.

Este documento descreve o incremento do Sprint 1. Os ficheiros no repositório evoluem nos sprints seguintes; para instalar e executar a versão atual, segue o [README do Sprint 2](../sprint-2/README.md#primeira-instalação).

## Equipa e organização

| Papel | Responsável registado |
|---|---|
| Product Owner do Sprint 1 | Santiago Fernandes |
| Equipa | Santiago Fernandes e João |
| Product Owner previsto para o Sprint 2 | João |

O [planeamento do Sprint 1](../../sprint-1-planning.md) regista o objetivo, as responsabilidades, os riscos, a revisão cruzada e a definição de concluído. O detalhe das atividades e as evidências Scrum são acompanhados no Jira.

## Trabalho preparado neste sprint

### Requisitos e âmbito do MVP

Foi documentado o problema de acompanhar despesas pessoais, o utilizador-alvo e o âmbito inicial da aplicação:

- Registo de despesas com montante em EUR, data, categoria e descrição opcional.
- Consulta, edição e eliminação de despesas.
- Filtros por mês e categoria.
- Resumo mensal, incluindo totais por categoria.
- Persistência dos dados.

O MVP foi delimitado para uso local de um único utilizador, sem autenticação. Estas funcionalidades foram definidas como requisitos; o CRUD completo, a interface e a persistência foram implementados no Sprint 2.

### Arquitetura

O [ADR-001](../../adr-001-modular-monolith.md) estabelece uma arquitetura monolítica modular:

- **Frontend:** React + Vite.
- **Backend:** Node.js + Express, através de uma API REST.
- **Persistência:** PostgreSQL.

A decisão documenta contexto, alternativas e consequências. A separação das responsabilidades permite desenvolver e testar o backend sem misturar a interface com o acesso à base de dados.

### Backend inicial

O incremento inicial incluiu:

- Configuração npm e dependências do backend.
- Aplicação Express separada do ficheiro que inicia o servidor.
- Endpoint `GET /api/health`.
- Exemplo de configuração de ambiente e exclusão de ficheiros locais do Git.

O endpoint de saúde responde com HTTP `200` e um corpo semelhante a:

```json
{
  "status": "ok",
  "message": "API FinTrack em funcionamento"
}
```

Este endpoint confirma que o processo HTTP responde. Não verifica a existência de tabelas nem a ligação à base de dados.

### Qualidade e integração contínua inicial

- Configuração ESLint para o backend.
- Teste do endpoint de saúde com Vitest e Supertest.
- Verificação de sintaxe com `node --check`.
- Workflow GitHub Actions com instalação por `npm ci`, lint, verificação de sintaxe e testes.

O workflow atual também contém os incrementos do Sprint 2. Para consultar uma versão histórica exata da pipeline, usa o histórico Git; este README não reconstrói nem substitui esse histórico.

## Ficheiros de referência

| Ficheiro | Papel |
|---|---|
| [`docs/mvp-requirements.md`](../../mvp-requirements.md) | Problema, utilizador e requisitos do MVP |
| [`docs/adr-001-modular-monolith.md`](../../adr-001-modular-monolith.md) | Decisão de arquitetura |
| [`docs/architecture.md`](../../architecture.md) | Diagrama arquitetural |
| [`docs/sprint-1-planning.md`](../../sprint-1-planning.md) | Planeamento e organização do sprint |
| [`docs/project-links.md`](../../project-links.md) | Ligações e visão do pipeline planeado |
| [`backend/src/app.js`](../../../backend/src/app.js) | Aplicação HTTP; expandida no Sprint 2 |
| [`backend/src/server.js`](../../../backend/src/server.js) | Arranque do servidor |
| [`backend/tests/health.test.js`](../../../backend/tests/health.test.js) | Teste inicial do endpoint de saúde |
| [`backend/eslint.config.js`](../../../backend/eslint.config.js) | Configuração de lint |
| [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) | Workflow CI; expandido no Sprint 2 |

## Como verificar a base do backend

Depois de preparar a versão atual pelas instruções do Sprint 2, o backend pode ser iniciado assim, a partir da raiz do repositório:

```powershell
cd backend
npm start
```

Noutro terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

Os comandos de qualidade do backend são:

```powershell
# Dentro de backend
npm run lint
npm run build
npm test
```

Na versão atual, `npm test` executa também os testes acrescentados no Sprint 2. Estes comandos não se limitam automaticamente ao incremento histórico do Sprint 1.

## Evidências e conclusão

A definição de concluído registada no planeamento exige código/documentação integrados, CI bem-sucedido e evidências associadas às tarefas Jira, após revisão cruzada.

- [Consultar o histórico e os Pull Requests](https://github.com/santiiago90/FinTrack)
- [Consultar as execuções de CI](https://github.com/santiiago90/FinTrack/actions)
- [Consultar as tarefas no Jira](https://santiagoadaofernandes.atlassian.net/jira/software/projects/XOPS/boards/34/backlog)

Estes links são pontos de consulta; não constituem, por si só, prova de uma execução ou cerimónia específica. As evidências de planning, daily, review e retrospetiva devem corresponder aos registos efetivamente realizados pela equipa.
