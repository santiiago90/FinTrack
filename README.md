# FinTrack — Gestão de Despesas Pessoais e Pipeline Inteligente de CI/CD

O **FinTrack** é uma aplicação web para registar despesas pessoais, organizar gastos por categoria e acompanhar os totais de cada mês.

O projeto tem duas vertentes complementares:

- **Produto:** desenvolver uma aplicação útil para acompanhar despesas pessoais.
- **Engenharia:** conceber, implementar e avaliar uma pipeline de CI/CD com testes automatizados, verificações de segurança, validações assistidas por inteligência artificial e observabilidade.

O desenvolvimento é realizado no âmbito da unidade curricular **Plataformas e Serviços X-Ops**, da **Universidade da Beira Interior**, no ano letivo **2026/2027**.

| Informação | Identificação |
|---|---|
| Projeto | FinTrack |
| Equipa | Santiago Fernandes e João Estevão |
| Instituição | Universidade da Beira Interior |
| Unidade curricular | Plataformas e Serviços X-Ops |
| Docente | Nuno Pombo |
| Metodologia | Scrum |
| Estado | Desenvolvimento incremental |

## 1. Problema e solução

Quando as despesas ficam dispersas por apontamentos, movimentos bancários e aplicações diferentes, torna-se difícil manter um histórico e perceber quanto se gasta em cada categoria.

O FinTrack pretende centralizar essa informação numa interface simples, permitindo:

- Registar despesas com os dados essenciais.
- Consultar e corrigir o histórico.
- Organizar despesas por categoria.
- Filtrar os registos por mês e categoria.
- Consultar o total mensal e a distribuição dos gastos.
- Manter os dados disponíveis após reiniciar a aplicação.

O utilizador-alvo é, sobretudo, o estudante universitário ou jovem adulto que procura uma forma acessível de acompanhar as suas despesas.

## 2. Objetivos do projeto

### Aplicação

Construir uma aplicação funcional, com regras de validação claras, persistência dos dados e uma interface compreensível.

### DevOps e DevSecOps

- Automatizar a instalação, a verificação e os testes do software.
- Integrar análise estática e dinâmica de segurança.
- Aplicar critérios de qualidade antes da integração e da entrega.
- Preparar ambientes de execução reproduzíveis.
- Evoluir para uma pipeline com deployment e validação do sistema em execução.

### Inteligência artificial e observabilidade

- Utilizar ferramentas de IA como apoio ao desenvolvimento.
- Introduzir validações assistidas por IA na pipeline.
- Avaliar a estabilidade e as limitações das decisões desses mecanismos.
- Recolher métricas e apresentar informação operacional.
- Relacionar falhas e anomalias com decisões arquiteturais.

### Colaboração

- Organizar o trabalho em sprints.
- Manter o backlog e as tarefas atualizados no Jira.
- Realizar revisão cruzada.
- Documentar as cerimónias Scrum e a rotação do Product Owner.
- Registar decisões, resultados e aprendizagens.

## 3. Âmbito funcional

### MVP implementado

O incremento desenvolvido até ao Sprint 2 concentra-se na gestão de **despesas em EUR**.

| Funcionalidade | Comportamento |
|---|---|
| Criar despesas | Registar montante, data, categoria e descrição opcional |
| Consultar despesas | Apresentar o histórico e consultar registos individuais pela API |
| Editar despesas | Atualizar os dados de uma despesa existente |
| Eliminar despesas | Remover uma despesa, com confirmação na interface |
| Filtrar | Consultar despesas por mês e categoria |
| Resumo mensal | Apresentar o total do mês e os totais por categoria |
| Validar dados | Rejeitar entradas inválidas com mensagens claras |
| Persistir dados | Guardar despesas em PostgreSQL |

A interface inclui estados de carregamento, lista vazia, sucesso e erro.

**O filtro de categoria restringe o histórico. O resumo apresentado na interface mantém o total do mês completo.**

### Limites do MVP

A versão atual funciona **localmente, para um único utilizador e sem autenticação**.

Não estão implementados neste incremento:

- Registo e login de utilizadores.
- Isolamento de dados entre vários utilizadores.
- Gestão de receitas e cálculo de saldo.
- Orçamentos e limites de despesa.
- Importação de movimentos bancários.
- Exportação de relatórios.
- Recomendações financeiras automáticas.

Estas funcionalidades poderão ser avaliadas posteriormente, sem comprometer o foco principal do projeto: a aplicação e a pipeline de qualidade que a suporta.

## 4. Arquitetura

O FinTrack segue uma arquitetura de **monólito modular**, com separação entre a interface, o backend e a persistência.

```text
Utilizador
    |
    v
Frontend React + Vite
    |
    | HTTP / JSON
    v
API Node.js + Express
    |
    | Validação e operações sobre despesas
    v
Repositório SQL
    |
    | Consultas parametrizadas
    v
PostgreSQL
    |
    v
Volume persistente Docker
```

### Responsabilidades

- **Frontend:** recolher os dados, comunicar com a API e apresentar resultados.
- **Backend:** validar pedidos, executar operações e preparar respostas HTTP.
- **Repositório:** concentrar as consultas SQL e as agregações.
- **PostgreSQL:** persistir dados e impor restrições de integridade.
- **Pipeline:** automatizar verificações e, progressivamente, os mecanismos de entrega e monitorização.

A escolha de um monólito modular mantém a complexidade adequada a uma equipa de dois elementos, permitindo evoluir o código com responsabilidades separadas.

Atualmente, as rotas, as validações e o acesso SQL das despesas estão organizados em `backend/src/expenses/`.

## 5. Tecnologias

### Utilizadas na implementação atual

| Área | Tecnologia | Finalidade |
|---|---|---|
| Frontend | React | Construção da interface |
| Ferramentas frontend | Vite | Desenvolvimento e build |
| Linguagens | JavaScript, HTML e CSS | Implementação da aplicação |
| Backend | Node.js + Express | API REST |
| Acesso à base de dados | `pg` | Ligações e consultas PostgreSQL |
| Persistência | PostgreSQL 16 | Armazenamento e agregação de despesas |
| Ambiente local | Docker + Docker Compose | Execução do PostgreSQL |
| Testes | Vitest + Supertest | Verificação dos endpoints e comportamento |
| Base de testes local | PGlite | Execução de PostgreSQL em WASM |
| Qualidade | ESLint | Análise estática do backend |
| SAST | Semgrep | Deteção de padrões de código inseguros |
| CI | GitHub Actions | Automatização dos checks |
| Versionamento | Git + GitHub | Histórico e revisão de alterações |
| Gestão do trabalho | Jira | Backlog, tarefas e evidências |
| Apoio por IA | ChatGPT + Codex | Desenvolvimento, testes, análise e documentação |

### Previstas para a evolução do projeto

| Área | Tecnologia ou abordagem prevista | Estado |
|---|---|---|
| DAST | OWASP ZAP | Por integrar |
| Métricas | Prometheus | Por integrar |
| Dashboards | Grafana | Por integrar |
| Gates de IA | Integração com um modelo através de API | Modelo, configuração e critérios por definir |
| Ambientes | Containerização dos componentes necessários e staging | Por completar |
| Entrega | Automatização de deployment e validação | Por implementar |

As tecnologias previstas representam o plano de evolução. Não devem ser interpretadas como componentes já disponíveis na aplicação.

## 6. Pipeline de qualidade e entrega

### Configuração atual

O workflow GitHub Actions executa em eventos de `push` e `pull_request`.

| Job | Verificações |
|---|---|
| `backend-ci` | Instalação, ESLint, verificação de sintaxe e testes com PostgreSQL 16 de teste |
| `frontend-ci` | Instalação e build da interface |
| `sast` | Semgrep, teste de deteção e verificação do relatório |

A configuração da pipeline está em `.github/workflows/ci.yml`.

A existência do workflow no código não comprova que uma execução remota tenha sido aprovada. Os resultados devem ser confirmados no GitHub Actions para a versão em avaliação.

### Evolução prevista

A pipeline deverá evoluir para suportar o seguinte fluxo:

```text
Alteração de código / Pull Request
                |
                v
Instalação, lint, build e testes
                |
                v
Análise estática de segurança
                |
                v
Validações assistidas por IA
                |
                v
Deployment para staging
                |
                v
Testes dinâmicos de segurança
                |
                v
Avaliação dos critérios de qualidade
                |
                v
Entrega e observabilidade
```

Este fluxo é uma visão de implementação. A ordem e as dependências concretas dos jobs serão definidas à medida que os componentes forem integrados.

### Segurança estática

O Semgrep utiliza regras locais versionadas para detetar alguns padrões relacionados com:

- Execução dinâmica de código.
- Construção dinâmica de funções.
- HTML não sanitizado.
- Execução de comandos shell.
- SQL interpolado.

O gate atual rejeita deteções de severidade `ERROR` e erros de análise.

Uma fixture deliberadamente insegura confirma que o mecanismo consegue detetar e bloquear um caso conhecido. Essa fixture não é executada pela aplicação.

As regras atuais têm cobertura limitada. Não substituem testes dinâmicos, análise de dependências ou revisão humana.

## 7. Utilização de inteligência artificial

ChatGPT e Codex são utilizados como ferramentas de apoio à implementação, revisão, criação de testes, diagnóstico de erros e documentação.

Os resultados são sujeitos a revisão e validação pela equipa.

**Utilizar IA durante o desenvolvimento não equivale a ter um gate de IA automatizado na pipeline.** A integração desse gate exige:

- Um objetivo e um âmbito definidos.
- Critérios explícitos de aprovação e rejeição.
- Identificação do modelo e da respetiva versão.
- Prompts e parâmetros versionados.
- Registo dos resultados.
- Avaliação de estabilidade entre execuções.

A avaliação deverá considerar benefícios, limitações, falsos positivos, inconsistências e implicações éticas. Credenciais e dados pessoais não devem ser incluídos nos conteúdos enviados aos modelos.

## 8. Práticas arquiteturais exigidas pelo projeto

### P1 — CI/CD Pipelines as Architectural Feedback

A partir do **Sprint 2**, as falhas reais da pipeline devem ser registadas no Jira sob uma identificação de **Architectural Feedback**.

Cada registo deve incluir:

1. Falha observada e ligação à execução.
2. Causa.
3. Decisão ou propriedade arquitetural exposta.
4. Correção estrutural aplicada.
5. Evidência da melhoria.

O objetivo é compreender o que a falha revela sobre dependências, acoplamento ou contratos entre componentes.

### P2 — Reproducible AI-Gate Pipelines

A partir do **Sprint 3**, a configuração de cada gate assistido por IA deve acompanhar o código:

- Template do prompt.
- Modelo e versão.
- Parâmetros.
- Limiares de decisão.

O mesmo gate deve ser executado pelo menos duas vezes sob a mesma configuração. A equipa deve documentar se a decisão se mantém estável e explicar eventuais diferenças e medidas de mitigação.

P1 e P2 devem ser apresentados nas Sprint Reviews e consolidados no relatório final.

## 9. Observabilidade prevista

A camada de observabilidade deverá apoiar o diagnóstico do comportamento da aplicação e da pipeline.

Estão previstas métricas como:

- Duração e volume dos pedidos HTTP.
- Taxa de erros.
- Disponibilidade dos serviços.
- Comportamento das dependências.
- Utilização de recursos relevantes.

Prometheus está previsto para recolha de métricas e Grafana para visualização.

Pelo menos um dashboard ou alerta deverá evidenciar uma questão arquitetural, como um gargalo ou uma dependência inesperada entre componentes. A integração de análise e alertas assistidos por IA será avaliada durante essa evolução.

Esta camada ainda não está implementada no incremento atual.

## 10. Estrutura do repositório

```text
FinTrack/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── src/
│   │   ├── expenses/
│   │   │   ├── routes.js
│   │   │   ├── validation.js
│   │   │   └── repository.js
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── db.js
│   │   └── migrate.js
│   ├── tests/
│   ├── .env.example
│   ├── eslint.config.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── package-lock.json
├── database/
│   └── 001-expenses.sql
├── security/
│   ├── fixtures/
│   ├── check-report.mjs
│   └── requirements.txt
├── docs/
│   └── sprints/
│       ├── sprint-1/
│       │   └── README.md
│       └── sprint-2/
│           └── README.md
├── .env.example
├── .gitignore
├── .semgrep.yml
├── .semgrepignore
├── compose.yaml
└── README.md
```

Outras pastas podem ser acrescentadas ou utilizadas à medida que novas responsabilidades forem implementadas.

## 11. Executar localmente

### Requisitos

- Git.
- Node.js 22.12 ou superior, numa versão compatível com as dependências, e npm.
- Docker Desktop com suporte a containers Linux e Docker Compose.
- Portas locais `3000` e `5432` disponíveis.

O CI usa Node.js 22. Python é necessário apenas para executar Semgrep localmente; o job SAST prepara o seu próprio ambiente.

**Na configuração atual, apenas PostgreSQL corre no Docker. O backend e o frontend precisam de ser iniciados separadamente.**

### Primeira instalação

#### 1. Obter o repositório

```powershell
git clone https://github.com/santiiago90/FinTrack.git
cd FinTrack
```

Usa uma versão que contenha o incremento que pretendes executar. Alterações ainda apenas locais não aparecem num novo clone.

#### 2. Criar a configuração local

Numa instalação nova, antes de existirem os ficheiros `.env`:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

Define a mesma palavra-passe em `DB_PASSWORD`, nos dois ficheiros.

- `.env` da raiz: configuração utilizada pelo Docker Compose.
- `backend/.env`: configuração utilizada pela API.

Não publiques estes ficheiros. Os `.env.example` são os modelos destinados ao repositório.

#### 3. Arrancar PostgreSQL

Abre o Docker Desktop e aguarda até o motor estar pronto. Na raiz do projeto:

```powershell
docker compose up -d --wait db
docker compose ps
```

O Compose cria o container e o volume quando ainda não existem. Não é necessário criar o container manualmente no Docker Desktop.

#### 4. Preparar e iniciar o backend

No primeiro terminal:

```powershell
cd backend
npm ci
npm run migrate
npm start
```

Mantém o terminal aberto. A API utiliza, por defeito, `http://127.0.0.1:3000`.

#### 5. Iniciar o frontend

Abre outro terminal na raiz do repositório:

```powershell
cd frontend
npm ci
npm run dev
```

Abre o endereço `Local` indicado pelo Vite, normalmente `http://127.0.0.1:5173`.

Se essa porta estiver ocupada, o Vite pode utilizar outra, como `5174`.

### Arranques seguintes

Na raiz, no primeiro terminal:

```powershell
docker compose up -d --wait db
cd backend
npm start
```

Noutro terminal, também a partir da raiz:

```powershell
cd frontend
npm run dev
```

Não é necessário reinstalar as dependências nem repetir a preparação inicial em cada utilização.

### Verificar a aplicação

Com o backend em execução, noutro terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
Invoke-RestMethod http://127.0.0.1:3000/api/expenses
```

O endpoint de saúde verifica que o processo HTTP responde. A consulta das despesas também exercita o acesso à base de dados.

### Parar os serviços

Usa `Ctrl+C` nos terminais do backend e do frontend.

Para parar PostgreSQL, na raiz:

```powershell
docker compose stop db
```

Os dados permanecem no volume nomeado. **Remover o volume ou usar `docker compose down -v` elimina os dados persistidos.**

## 12. Testes e validação

### Backend

Dentro de `backend`:

```powershell
npm run lint
npm run build
npm test
```

O build do backend verifica a sintaxe de `app.js` e `server.js`. Os testes verificam o comportamento HTTP e o acesso aos dados.

### Frontend

Dentro de `frontend`:

```powershell
npm run build
```

O comando gera os ficheiros de produção em `frontend/dist`. Não inicia a API nem publica a aplicação.

### Base de dados de testes

- Localmente, a suite usa PGlite.
- No CI, usa PostgreSQL 16 através de `TEST_DATABASE_URL`.

**A variável `TEST_DATABASE_URL` deve apontar exclusivamente para uma base de testes descartável. A suite limpa a tabela `expenses` antes de cada teste.**

### Executar SAST localmente

Na raiz, com Python instalado:

```powershell
python -m venv .venv-sast
.\.venv-sast\Scripts\python.exe -m pip install -r security/requirements.txt
.\.venv-sast\Scripts\semgrep.exe scan --config .semgrep.yml --metrics off --disable-version-check --strict --error --json-output security/semgrep-results.json backend/src frontend/src
node security/check-report.mjs security/semgrep-results.json
```

O ambiente Python e os relatórios gerados estão excluídos do Git.

## 13. Problemas frequentes

| Sintoma | Verificação |
|---|---|
| Vite mostra `ECONNREFUSED 127.0.0.1:3000` | Confirmar que o backend foi iniciado com `npm start` |
| `Cannot find package 'dotenv'` | Executar `npm ci` dentro de `backend` nessa cópia do projeto |
| Falha na ligação ao PostgreSQL | Confirmar Docker Desktop, estado de `db`, host e porta |
| `password authentication failed` | Confirmar que a credencial atual da base corresponde a `backend/.env` |
| `relation expenses does not exist` | Executar `npm run migrate` dentro de `backend` |
| Vite utiliza `5174` | Usar o URL indicado e verificar se existe outro frontend em execução |
| CI não encontra `package-lock.json` | Confirmar que backend e frontend estão na raiz correta e que os lockfiles foram incluídos no commit |

Alterar apenas `DB_PASSWORD` nos ficheiros não muda a palavra-passe de um PostgreSQL já inicializado. A credencial também tem de ser alterada na base de dados.

## 14. Metodologia e organização

O projeto segue Scrum, organizado em cinco sprints de duas semanas, conforme o enunciado.

A equipa deve manter:

- Product Backlog e Sprint Backlogs atualizados.
- Tarefas e estados acompanhados no Jira.
- Evidências de planning, daily, review e retrospetiva.
- Um Product Owner identificado em cada sprint, com rotação documentada.
- Revisão cruzada das alterações.
- Team Contract com responsabilidades, expectativas e gestão de dificuldades.
- Ligações para código, decisões, resultados e artefactos.
- Acesso do docente ao espaço Jira do projeto.

As apresentações intermédias devem mostrar o incremento realizado, as decisões tomadas, os problemas encontrados e as aprendizagens.

## 15. Entregáveis previstos

Em alinhamento com o enunciado, o resultado final deverá incluir:

- Aplicação funcional que permita demonstrar a pipeline.
- Protótipo funcional de CI/CD com qualidade e segurança integradas.
- Gates assistidos por IA e avaliação crítica dos seus resultados.
- Camada de observabilidade com informação arquitetural.
- Documentação da arquitetura, decisões e evolução dos sprints.
- Architectural Feedback Log no Jira.
- Verificação documentada da reprodutibilidade dos gates de IA.
- Demonstração ao vivo do fluxo da pipeline e das melhorias realizadas.
- Relatório final em formato **IEEE**, com **até 10 páginas**.

Esta lista descreve os resultados exigidos para o projeto completo. Não representa uma declaração de que todos já foram entregues.

## 16. Documentação dos sprints

| Sprint | Documento | Conteúdo |
|---|---|---|
| Sprint 1 | [Fundação do projeto e CI inicial](docs/sprints/sprint-1/README.md) | Requisitos, arquitetura, backend inicial e organização |
| Sprint 2 | [MVP de despesas, persistência e SAST](docs/sprints/sprint-2/README.md) | Implementações, configuração, arranque, testes e segurança |

As referências dos restantes sprints serão acrescentadas quando esses sprints começarem.

Cada README de sprint deve identificar o objetivo, o trabalho realizado, a validação disponível e os pontos ainda por concluir.