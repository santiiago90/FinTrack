# XOPS-30: dashboard Grafana e cenário controlado (plano de implementação)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grafana provisionado no staging, com um dashboard que mostra o gargalo e a dependência entre a API e o PostgreSQL, alimentado por um cenário em fases cuja evidência (consultas, resumo e capturas) é gerada automaticamente.

**Architecture:** O staging ganha o serviço `grafana`, com datasource e dashboard versionados em `observability/grafana/`. Um cenário Node (`scripts/load-scenario.mjs`) gera tráfego pelo nginx em fases e congela o PostgreSQL com `docker compose pause`. Um relatório (`scripts/scenario-report.mjs`) consulta o Prometheus sobre a janela do cenário, e um capturador Playwright isolado (`observability/capture/`) fotografa o dashboard. A lógica pura vive em `scripts/lib/` e é testada com `node --test`. A API ganha timeouts e o tratamento de erros do pool.

**Tech Stack:** Node 22, pg 8.23, Vitest, `node:test`, Grafana OSS 13.0.1, Prometheus v3.5.0, Playwright 1.65.1, Docker Compose, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-26-xops-30-grafana-design.md`

## Global Constraints
- Nenhum SQL, valor de despesa ou credencial em métricas, etiquetas, anotações ou logs.
- Imagens com versão fixa; tudo publicado apenas em `127.0.0.1`. Grafana em `${GRAFANA_PORT:-3001}`.
- Grafana: datasource uid `fintrack-prometheus`, dashboard uid `fintrack-api`, acesso anónimo `Viewer`, administrador `admin` / `staging_only_password` (apenas no staging).
- Timeouts da base de dados por omissão: `DB_CONNECTION_TIMEOUT_MS=2000`, `DB_QUERY_TIMEOUT_MS=5000`.
- Fases e durações por omissão: `seed` 300 despesas, `base` 60 s com concorrência 2, `rajada` 60 s com concorrência 60, `db-indisponivel` 30 s com concorrência 2, `recuperacao` 60 s com concorrência 2.
- Dados fictícios: as categorias e descrições começam por `Cenário`.
- Artefactos em `artifacts/observability/`: `scenario-timeline.json`, `scenario-queries.json`, `scenario-summary.json`, `scenario-summary.md` e `dashboard*.png`.
- Commits feitos pelo utilizador. Esta sessão entrega um patch e não faz push.

## Review Focus
- O cenário é interrompido (Ctrl+C ou erro) com a base de dados em `pause`: o `unpause` tem de acontecer na mesma (`finally` e tratamento de `SIGINT`).
- O Grafana arranca antes de o Prometheus ter dados: os painéis mostram "No data" sem erros de datasource, e a captura espera pelo fim do carregamento.
- A janela do relatório tem de cobrir a última recolha do Prometheus (5 s): o relatório espera 10 s depois do fim do cenário.
- A concorrência 60 sobre o nginx não pode esgotar as portas do runner: os pedidos usam o `fetch` com keep-alive por omissão, com timeout por pedido de 10 s.
- As variáveis de duração inválidas (por exemplo `SCENARIO_BURST_S=abc`) têm de falhar logo, com uma mensagem clara (testado em `scenario.test.mjs`).

---

### Task 1: Resiliência da ligação ao PostgreSQL
**Files:**
- Modify: `backend/src/db.js`
- Test: `backend/tests/db.test.js`
- Docs: `backend/.env.example` ganha as duas variáveis novas.

**Interfaces:** Produces `createPool(env = process.env) -> pg.Pool`, com `export const pool = createPool()`. O contrato de `pool` não muda para `app.js`, `metrics.js` e `migrate.js`.

- [ ] **Step 1: Testes que falham**
  - `aplica timeouts por omissão`: `createPool({})` → `options.connectionTimeoutMillis === 2000` e `options.query_timeout === 5000`.
  - `lê timeouts do ambiente`: `{ DB_CONNECTION_TIMEOUT_MS: '300', DB_QUERY_TIMEOUT_MS: '900' }` → 300 e 900.
  - `falha depressa quando a base não responde`: um servidor `net` em `127.0.0.1:0` que aceita e nunca responde; `createPool({ DB_PORT, DB_CONNECTION_TIMEOUT_MS: '300' }).query('SELECT 1')` rejeita em menos de 2000 ms.
  - `não termina o processo com erro de ligação inativa`: com `console.error` substituído por um espião, `pool.emit('error', Object.assign(new Error('password=xyz'), { code: '57P01' }))` não lança; o espião recebe `57P01`, e o que regista não contém `xyz`.
- [ ] **Step 2:** `cd backend && npx vitest run tests/db.test.js` → FAIL (`createPool` não existe).
- [ ] **Step 3:** Implementar `createPool`. Os timeouts passam por `Number(...)` com valor por omissão; o `pool.on('error', err => console.error('Falha numa ligação inativa do PostgreSQL', { code: err.code }))`.
- [ ] **Step 4:** `npm run lint && npm run build && npm test` → todos verdes (25 + 4).
- [ ] **Step 5:** Commit `fix: timeouts e tratamento de erros do pool PostgreSQL (XOPS-30)`.

### Task 2: Grafana provisionado e dashboard
**Files:**
- Create: `observability/grafana/provisioning/datasources/prometheus.yml`, `observability/grafana/provisioning/dashboards/fintrack.yml`, `observability/grafana/dashboards/fintrack-api.json`
- Modify: `compose.staging.yaml`
- Test: `scripts/lib/dashboard.test.mjs`

**Interfaces:** Produces o dashboard uid `fintrack-api` e o caminho `/d/fintrack-api/fintrack-api`. Cada painel tem `targets[].expr`, que a Task 4 reutiliza a partir do JSON.

- [ ] **Step 1: Testes que falham** em `scripts/lib/dashboard.test.mjs`:
  - o JSON é lido, tem `uid === 'fintrack-api'`, e todos os painéis usam o datasource `{ type: 'prometheus', uid: 'fintrack-prometheus' }`;
  - há painéis com títulos que incluem `Pedidos`, `Erros`, `Latência HTTP`, `PostgreSQL` e `Pool`;
  - cada `expr` só usa métricas `fintrack_*` da XOPS-29 ou `up`;
  - nenhuma `expr` contém `/api/expenses/` seguido de um dígito;
  - existe um painel "API vs PostgreSQL" com pelo menos duas `expr`, uma `http_request_duration` e outra `db_operation_duration`.
- [ ] **Step 2:** `node --test scripts/lib/dashboard.test.mjs` → FAIL (o ficheiro não existe).
- [ ] **Step 3:** Criar o provisioning e o dashboard, com `refresh: '5s'`, `schemaVersion` atual e três linhas como no spec. Criar o serviço `grafana` no compose:
  - imagem `grafana/grafana-oss:13.0.1`;
  - volumes `:ro`;
  - `GF_AUTH_ANONYMOUS_ENABLED=true`, `GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer`, `GF_SECURITY_ADMIN_PASSWORD=staging_only_password`;
  - `GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH` apontado ao JSON;
  - `GF_ANALYTICS_REPORTING_ENABLED=false`;
  - healthcheck `wget -q -O /dev/null http://127.0.0.1:3000/api/health`;
  - `depends_on: prometheus (service_healthy)`.
- [ ] **Step 4:** `node --test scripts/lib/dashboard.test.mjs` → PASS. `python3 -c "import yaml"` sobre o compose e os dois YAML de provisioning, sem erros.
- [ ] **Step 5:** Commit `feat: Grafana provisionado com dashboard da API (XOPS-30)`.

### Task 3: Cenário controlado
**Files:**
- Create: `scripts/lib/scenario.mjs`, `scripts/lib/scenario.test.mjs`, `scripts/load-scenario.mjs`

**Interfaces:** Produces:
- `phasesFromEnv(env) -> Array<{ name, seconds, concurrency, mix }>`, que lança `Error` com o nome da variável quando o valor é inválido;
- `fakeExpense(i, today = new Date()) -> { amount: string, date: 'YYYY-MM-DD', category, description }`;
- `pickRequest(mix, random = Math.random) -> 'list' | 'summary' | 'get' | 'create' | 'invalid'`;
- o ficheiro `artifacts/observability/scenario-timeline.json`, com o formato `{ startedAt, endedAt, phases: [{ name, start, end, requests, failures }] }` e datas ISO.

- [ ] **Step 1: Testes que falham**
  - `fases por omissão`: os nomes por ordem são `base`, `rajada`, `db-indisponivel` e `recuperacao`, com segundos `60/60/30/60` e concorrência `2/60/2/2`.
  - `variáveis de ambiente`: `SCENARIO_BASE_S`, `SCENARIO_BURST_S`, `SCENARIO_OUTAGE_S`, `SCENARIO_RECOVERY_S`, `SCENARIO_BURST_CONCURRENCY` e `SCENARIO_SEED`; `SCENARIO_BURST_S=abc` lança uma mensagem que contém `SCENARIO_BURST_S`.
  - `despesa fictícia válida`: 200 chamadas dão um `amount` entre `2.00` e `82.00` com duas casas decimais, uma data nos últimos 90 dias, a categoria a começar por `Cenário ` e uma de 6 categorias.
  - `mistura da rajada`: com `random` determinístico, a fase `rajada` só devolve `list` ou `summary`.
- [ ] **Step 2:** `node --test scripts/lib/scenario.test.mjs` → FAIL.
- [ ] **Step 3:** Implementar `scenario.mjs` e o executável `load-scenario.mjs`.
  - O executável faz o `seed` com 5 pedidos `POST` em simultâneo e depois corre as fases com N trabalhadores em ciclo até ao fim de cada fase.
  - Na fase `db-indisponivel` chama `docker compose -p ${COMPOSE_PROJECT || 'fintrack-staging'} -f compose.staging.yaml pause db` e, no fim, `unpause db`. O `unpause` está num `finally` e também no tratamento de `SIGINT`.
  - Anotações: faz `POST` a `http://127.0.0.1:${GRAFANA_PORT||3001}/api/annotations` com autenticação básica de administrador, um por fase, com `dashboardUID: 'fintrack-api'`. Se falhar, só avisa, porque as anotações não são críticas.
  - Os pedidos usam um timeout de 10 s. As falhas são contadas por fase e não interrompem o cenário. No fim imprime uma tabela por fase.
- [ ] **Step 4:** `node --test scripts/lib/scenario.test.mjs` → PASS; `node --check scripts/load-scenario.mjs`.
- [ ] **Step 5:** Commit `feat: cenário controlado em fases para o staging (XOPS-30)`.

### Task 4: Relatório e capturas
**Files:**
- Create: `scripts/lib/report.mjs`, `scripts/lib/report.test.mjs`, `scripts/scenario-report.mjs`, `observability/capture/package.json`, `observability/capture/package-lock.json`, `observability/capture/capture.mjs`
- Modify: `.gitignore` (`observability/capture/node_modules/` já está coberto por `node_modules/`; confirmar)

**Interfaces:**
- Consumes o `scenario-timeline.json` (Task 3) e as `expr` do dashboard (Task 2).
- Produces `summarizePhases(timeline, series) -> Array<{ phase, rps, errorPct, httpP95Ms, dbP95Ms, poolWaitingMax, dbErrors }>` e `toMarkdown(rows) -> string`.

- [ ] **Step 1: Testes que falham** em `report.test.mjs`, com séries sintéticas no formato `query_range` do Prometheus (`[{ metric, values: [[ts, '1.5'], ...] }]`) e uma timeline de duas fases:
  - o `rps` é a média dos valores dentro de cada fase;
  - `poolWaitingMax` é o máximo;
  - pontos fora de todas as fases são ignorados;
  - séries vazias dão `null`, não `0`;
  - `toMarkdown` gera uma tabela com o cabeçalho `| Fase | Pedidos/s | 5xx % | p95 HTTP (ms) | p95 DB (ms) | Pool à espera (máx) | Erros DB |`, e os `null` aparecem como `—`.
- [ ] **Step 2:** `node --test scripts/lib/report.test.mjs` → FAIL.
- [ ] **Step 3:** Implementar:
  - `report.mjs`;
  - `scenario-report.mjs`: lê a timeline, espera 10 s e faz `query_range` com `step=5s` para as séries do resumo; escreve `scenario-queries.json` com cada `expr` e resultado, `scenario-summary.json` e `.md`;
  - `capture.mjs`: com `playwright` do Chromium, abre `http://127.0.0.1:${GRAFANA_PORT||3001}/d/fintrack-api/fintrack-api?from=<ms>&to=<ms>&kiosk`, espera `networkidle` e que não haja indicadores de carregamento, e grava `dashboard.png` (página inteira, 1600 px de largura, `deviceScaleFactor` 1) e `dashboard-dependencia.png` (painel "API vs PostgreSQL");
  - `package.json` com `"type": "module"`, `"private": true`, `playwright` `1.65.1` e o lockfile gerado com `npm install`.
- [ ] **Step 4:** `node --test scripts/lib/*.test.mjs` → PASS; `node --check` nos executáveis; `cd observability/capture && npm ci` → OK.
- [ ] **Step 5:** Commit `feat: relatório do cenário e capturas do dashboard (XOPS-30)`.

### Task 5: CI e documentação
**Files:**
- Modify: `.github/workflows/observability.yml`, `docs/sprints/sprint-4/README.md`, `docs/como-executar.md`
- Create: `docs/sprints/sprint-4/xops-30-evidencia.md`

- [ ] **Step 1:** No job `metrics`, acrescentar `node --test scripts/lib/*.test.mjs` antes de arrancar o staging e incluir `grafana` no `up`.
- [ ] **Step 2:** Criar o job `scenario`, com `if: github.event_name == 'workflow_dispatch' || (github.event_name == 'push' && github.ref == 'refs/heads/main')`, `timeout-minutes: 20`, `COMPOSE_PROJECT=fintrack-staging`, e os passos:
  1. `up --build --wait` de `web`, `prometheus` e `grafana`;
  2. smoke;
  3. `node scripts/load-scenario.mjs`;
  4. `node scripts/scenario-report.mjs`;
  5. `cd observability/capture && npm ci && npx playwright install --with-deps chromium && node capture.mjs`;
  6. logs, upload `fintrack-scenario` e `down` com `if: always()`.
- [ ] **Step 3:** Documentação:
  - secção "Dashboard e cenário" no README do Sprint 4, com comandos de Windows e macOS, URLs, o significado de cada painel e como ler o resumo;
  - Grafana nas URLs do `como-executar.md`;
  - `xops-30-evidencia.md` com a estrutura (execução, tabela, capturas, interpretação por fase) e a interpretação marcada como "a preencher com os números da primeira execução real".
- [ ] **Step 4:** Validar o YAML do workflow; correr a suite do backend e todos os `node --test`.
- [ ] **Step 5:** Commit `ci: cenário de observabilidade com Grafana e documentação (XOPS-30)`.

### Entrega
Juntar os commits num patch com `git format-patch origin/main` ou `git diff`, para o utilizador testar no Docker do Mac e fazer ele o commit.
