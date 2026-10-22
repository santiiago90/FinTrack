# FinTrack — Gestor de despesas pessoais

O **FinTrack** é uma aplicação web que ajuda estudantes e jovens adultos a registar despesas, organizar gastos por categoria e perceber quanto gastam em cada mês.

O projeto é desenvolvido na unidade curricular **Plataformas e Serviços X-Ops**, na Universidade da Beira Interior, no ano letivo **2026/2027**, por **Santiago Fernandes e João**.

Além da aplicação, o projeto explora a construção de uma pipeline de qualidade e entrega de software: testes automatizados, análise de segurança, validações assistidas por IA e observabilidade, introduzidos progressivamente ao longo dos sprints.

## Ideia e objetivo

O FinTrack pretende centralizar o registo de despesas que, de outra forma, ficariam dispersas por apontamentos ou aplicações diferentes. O utilizador consegue manter um histórico e consultar o total mensal e a distribuição por categoria.

O MVP concentra-se no acompanhamento de despesas. Autenticação, receitas, orçamentos e funcionalidades financeiras avançadas não fazem parte da implementação atual.

## Documentação por sprint

Cada sprint tem um README próprio, com o respetivo objetivo, trabalho realizado, instruções e evidências disponíveis.

| Sprint | Foco | Documento |
|---|---|---|
| Sprint 1 | Fundação do projeto, requisitos, arquitetura e CI inicial | [README do Sprint 1](docs/sprints/sprint-1/README.md) |
| Sprint 2 | MVP de despesas, persistência PostgreSQL, interface e SAST | [README do Sprint 2](docs/sprints/sprint-2/README.md) |

Os documentos dos restantes sprints serão criados quando esses sprints começarem. O planeamento detalhado e o estado das tarefas são acompanhados no Jira.

**Para instalar e executar a versão atual, segue o [guia de arranque do Sprint 2](docs/sprints/sprint-2/README.md#primeira-instalação).**

## Funcionalidades implementadas

- Criar, consultar, editar e eliminar despesas.
- Guardar montante em EUR, data, categoria e descrição opcional.
- Validar dados e apresentar mensagens de erro por campo.
- Filtrar o histórico por mês e categoria.
- Consultar o total mensal e o total por categoria.
- Persistir os dados em PostgreSQL, com volume Docker.
- Executar testes automatizados e análise estática de segurança.

O MVP funciona localmente, para um único utilizador, sem autenticação. As configurações de arranque limitam os serviços ao computador local por defeito.

## Arquitetura

O projeto segue a decisão de **monólito modular**, com separação entre apresentação, API e persistência.

```text
Navegador
   |
   v
React + Vite  -- HTTP/JSON -->  API Express  -- SQL parametrizado -->  PostgreSQL
Frontend                       Backend                             Docker + volume
```

Na execução de desenvolvimento, o Vite encaminha os pedidos `/api` para o backend. O backend valida os pedidos e acede à base de dados através de um repositório SQL.

| Componente | Tecnologia | Papel |
|---|---|---|
| Interface | React + Vite | Formulários, histórico, filtros e resumo mensal |
| API | Node.js + Express | Endpoints HTTP, validação e tratamento de erros |
| Persistência | PostgreSQL 16 + `pg` | Armazenamento e agregação de despesas |
| Ambiente local | Docker Compose | Serviço PostgreSQL com volume persistente |
| Testes | Vitest, Supertest e PGlite | Verificação dos endpoints e regras de dados |
| Qualidade | ESLint | Análise estática do backend |
| Segurança | Semgrep | Deteção de padrões de código inseguros |
| CI | GitHub Actions | Execução automática dos checks em push e Pull Request |

Atualmente, **apenas PostgreSQL corre num container**. O backend e o frontend são iniciados separadamente com npm.

## Estrutura principal

```text
FinTrack/
├── backend/                 # API Express, validação, repositório e testes
├── frontend/                # Interface React e configuração Vite
├── database/                # Esquema SQL
├── security/                # Dependências, verificador e fixture SAST
├── .github/workflows/       # Pipeline GitHub Actions
├── docs/
│   └── sprints/             # README de cada sprint iniciado
├── compose.yaml             # PostgreSQL local
├── .env.example             # Exemplo de configuração do Compose
└── README.md                # Visão geral do projeto
```

## Qualidade e segurança

A pipeline configurada inclui três jobs: validação do backend, build do frontend e SAST com Semgrep. Os comandos e os limites dos checks estão descritos no [Sprint 2](docs/sprints/sprint-2/README.md#testes-e-qualidade).

DAST, gates de IA reproduzíveis, deployment e observabilidade fazem parte da evolução do projeto; não estão implementados nesta versão. A existência do workflow no código não substitui a confirmação da sua execução no GitHub Actions.

## Organização do trabalho

O projeto segue Scrum, com backlog e tarefas em Jira, revisão cruzada e rotação do papel de Product Owner. Desde o Sprint 2, as falhas reais da pipeline devem alimentar o **Architectural Feedback Log**, relacionando causa, decisão arquitetural afetada e correção estrutural.

## Referências do projeto

- [Repositório GitHub](https://github.com/santiiago90/FinTrack)
- [Execuções GitHub Actions](https://github.com/santiiago90/FinTrack/actions)
- [Quadro Jira](https://santiagoadaofernandes.atlassian.net/jira/software/projects/XOPS/boards/34/backlog)
- [Requisitos do MVP](docs/mvp-requirements.md)
- [ADR-001: monólito modular](docs/adr-001-modular-monolith.md)
- [Contrato da API de despesas](docs/api-expenses.md)
- [Configuração e limites do SAST](docs/security.md)

Os READMEs dos sprints descrevem os incrementos concretos. Os documentos de requisitos e arquitetura podem incluir contexto histórico e funcionalidades previstas.
