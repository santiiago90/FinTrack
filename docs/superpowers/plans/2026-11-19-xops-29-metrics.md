# XOPS-29 Métricas HTTP e PostgreSQL — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A API FinTrack expõe métricas Prometheus de pedidos HTTP e de operações PostgreSQL, recolhidas por um Prometheus no staging e verificadas no CI.

**Architecture:** `backend/src/metrics.js` cria um registry `prom-client` por instância da aplicação, um middleware HTTP que etiqueta pela rota Express normalizada e um invólucro de repositório que mede cada método sem tocar no SQL. `createApp` aplica ambos e serve `GET /metrics`, fora de `/api` e por isso não encaminhado pelo nginx. O Prometheus junta-se a `compose.staging.yaml`; um workflow novo arranca o staging, executa o fluxo de despesas e consulta o Prometheus.

**Tech Stack:** Node 22, Express 5, prom-client 15.1.3, Vitest + Supertest, Prometheus v3.5.0, Docker Compose, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-19-xops-29-metrics-design.md`

## Global Constraints

- Prefixo de todas as métricas: `fintrack_`.
- Nomes: `fintrack_http_requests_total`, `fintrack_http_request_duration_seconds` (etiquetas `method,route,status_code`); `fintrack_db_operation_duration_seconds` (`operation,outcome`), `fintrack_db_operation_errors_total` (`operation`), `fintrack_db_pool_connections` (`state` = `total|idle|waiting`).
- Pedido sem rota Express: `route="unmatched"`.
- `outcome` = `success|error`; `operation` = nome do método do repositório.
- Nada de SQL, valores de despesas, parâmetros ou credenciais no texto de `/metrics`.
- Prometheus: recolha de `api:3000/metrics` a cada 5 s; porta publicada `127.0.0.1:9090`.
- Commits com o autor `Santiago Fernandes <santiagoadaofernandes@gmail.com>` e sem linhas de atribuição ou coautoria.
- Os 17 testes existentes continuam a passar; `npm run lint` e `npm run build` continuam verdes.

## Review Focus

- `createApp` é chamado várias vezes no mesmo processo (testes): cada chamada tem de ter um registry próprio, sem o erro "metric already registered".
- IDs e valores no caminho (`/api/expenses/42`, `/api/expenses/abc`) não podem virar etiquetas; só o padrão `/api/expenses/:id`.
- Pedido a `/metrics` não se conta a si próprio como `unmatched` com caminho bruto; fica `route="/metrics"`.
- Um repositório que lança erro tem de continuar a propagar o erro original (o handler devolve 500) depois de registar a falha.
- Num erro que sai do router, o Express repõe `req.baseUrl` antes do `finish`: a rota tem de ser capturada quando é resolvida (por exemplo, guardando `req.baseUrl + req.route.path` no primeiro `res.on('finish')` registado dentro do pedido, ou num hook que corre dentro do router), não depois.
- Pedidos interrompidos pelo cliente (`close` sem `finish`) não devem rebentar o middleware; basta não os contar.

---

### Task 1: Módulo de métricas e integração na API

**Files:**
- Create: `backend/src/metrics.js`
- Modify: `backend/src/app.js`, `backend/package.json`, `backend/package-lock.json`
- Test: `backend/tests/metrics.test.js`

**Interfaces:**
- Produces: `createMetrics({ pool } = {}) -> { registry, httpMiddleware, instrumentRepository(repo) -> repo, handler(req, res) }`.
- Produces: `createApp(repository = expenseRepository(pool), { metrics = createMetrics({ pool }) } = {})`. Envolve sempre o repositório recebido com `metrics.instrumentRepository` e serve `GET /metrics` com `content-type` do registry.

- [ ] **Step 1: Instalar a dependência**

Run: `cd backend && npm install prom-client@15.1.3`
Expected: `prom-client` em `dependencies` e no lockfile.

- [ ] **Step 2: Escrever os testes que falham** em `backend/tests/metrics.test.js`, com um repositório falso em memória (sem base de dados) e `createMetrics()` sem pool:
  - `expõe métricas em formato Prometheus`: `GET /metrics` responde 200, `content-type` com `text/plain` e corpo com `fintrack_process_cpu_user_seconds_total`.
  - `normaliza a rota e conta o estado`: depois de `GET /api/expenses/42` (o repositório falso devolve `undefined`, logo 404), o corpo contém `fintrack_http_requests_total{method="GET",route="/api/expenses/:id",status_code="404"} 1` e não contém `/api/expenses/42`.
  - `agrupa caminhos desconhecidos`: `GET /nao-existe/123` dá `route="unmatched"` e o corpo não contém `nao-existe`.
  - `mede operações e falhas do repositório`: com `list` a rejeitar `new Error('SELECT secret FROM expenses password=xyz')`, `GET /api/expenses` responde 500; o corpo contém `fintrack_http_requests_total{method="GET",route="/api/expenses",status_code="500"} 1`, `fintrack_db_operation_errors_total{operation="list"} 1` e `fintrack_db_operation_duration_seconds_count{operation="list",outcome="error"} 1`; não contém `SELECT`, `secret` nem `xyz`.
  - `não expõe dados das despesas`: depois de `POST /api/expenses` com `{ amount: '987.65', date: '2026-11-19', category: 'CategoriaSecreta', description: 'DescricaoSecreta' }`, o corpo contém `fintrack_db_operation_duration_seconds_count{operation="create",outcome="success"} 1` e não contém `987.65`, `CategoriaSecreta` nem `DescricaoSecreta`.
  - `isola registries entre instâncias`: duas chamadas a `createApp(fake)` não lançam erro e cada `/metrics` conta só os seus pedidos.
  - `publica o estado do pool`: `createMetrics({ pool: { totalCount: 3, idleCount: 2, waitingCount: 1 } })` dá `fintrack_db_pool_connections{state="waiting"} 1` em `registry.metrics()`.

- [ ] **Step 3: Correr e ver falhar**

Run: `cd backend && npx vitest run tests/metrics.test.js`
Expected: FAIL (`../src/metrics.js` não existe).

- [ ] **Step 4: Implementar `backend/src/metrics.js` e ligar em `app.js`**

Notas de implementação:
- `new Registry()` por chamada e `collectDefaultMetrics({ register, prefix: 'fintrack_' })`.
- Gauge do pool com `collect()` a ler `totalCount`, `idleCount` e `waitingCount`; só é registado quando há `pool`.
- O middleware guarda `process.hrtime.bigint()` e, no `res.on('finish')`, calcula `route = req.route ? req.baseUrl + req.route.path : 'unmatched'`.
- `instrumentRepository` devolve um objeto com os mesmos métodos: `async (...args)` que mede, regista `success` ou `error` (e incrementa o contador de erros) e volta a lançar o erro original.
- Em `app.js`, o middleware fica antes de `express.json` e `GET /metrics` antes do 404.
- Buckets do histograma HTTP: `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5]`. DB: `[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 1]`.

- [ ] **Step 5: Correr tudo**

Run: `cd backend && npm run lint && npm run build && npm test`
Expected: lint e build sem erros; 24 testes aprovados (17 anteriores e 7 novos).

- [ ] **Step 6: Commit**

```bash
git add backend/src/metrics.js backend/src/app.js backend/tests/metrics.test.js backend/package.json backend/package-lock.json
git commit -m "feat: expõe métricas HTTP e PostgreSQL na API (XOPS-29)"
```

### Task 2: Prometheus no staging, verificação no CI e documentação

**Files:**
- Create: `observability/prometheus/prometheus.yml`, `scripts/metrics-check.mjs`, `.github/workflows/observability.yml`, `docs/sprints/sprint-4/README.md`
- Modify: `compose.staging.yaml`, `README.md` (linha "Métricas | Prometheus | Por integrar")

**Interfaces:**
- Consumes: `GET api:3000/metrics` da Task 1; `scripts/staging-smoke.mjs` (cria, filtra e apaga uma despesa).
- Produces: serviço Compose `prometheus` em `127.0.0.1:${PROMETHEUS_PORT:-9090}`; `scripts/metrics-check.mjs` com saída `artifacts/observability/metrics-check.json`; workflow `FinTrack Observability` com o artefacto `fintrack-observability`. A XOPS-30 e a XOPS-31 vão estender estes três.

- [ ] **Step 1: Configuração versionada**
  - `prometheus.yml`: `global.scrape_interval: 5s`, job `fintrack-api` com target `api:3000` e `metrics_path: /metrics`.
  - Serviço `prometheus`:
    - imagem `prom/prometheus:v3.5.0`;
    - volume `./observability/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro`;
    - `depends_on: api (service_healthy)`;
    - healthcheck `wget -q -O /dev/null http://127.0.0.1:9090/-/ready`;
    - porta `127.0.0.1:${PROMETHEUS_PORT:-9090}:9090`.

- [ ] **Step 2: `scripts/metrics-check.mjs`**
  - Consulta `http://127.0.0.1:${PROMETHEUS_PORT||9090}/api/v1/query` até 60 s (intervalo de 2 s), até as três consultas devolverem resultados:
    - `sum by (route, status_code) (fintrack_http_requests_total)`;
    - `sum by (operation, outcome) (fintrack_db_operation_duration_seconds_count)`;
    - `up{job="fintrack-api"}`.
  - Afirma que existe `route="/api/expenses"` com `status_code="201"`, `route="/api/expenses/:id"` com `status_code="204"`, operações `create`, `list` e `remove` com `outcome="success"`, e `up` igual a 1.
  - Afirma que nenhuma série tem um `route` com dígitos.
  - Escreve as consultas, os resultados e um timestamp em `artifacts/observability/metrics-check.json`; sai com código 1 em falha.

- [ ] **Step 3: Workflow `.github/workflows/observability.yml`**
  - Corre em `push`, `pull_request` e `workflow_dispatch`, com `permissions: contents: read`, `timeout-minutes: 15` e `STAGING_PORT: '8080'`.
  - Passos:
    - `docker compose -p fintrack-sprint4 -f compose.staging.yaml up -d --build --wait --wait-timeout 120 web prometheus`;
    - `node scripts/staging-smoke.mjs`;
    - `node scripts/metrics-check.mjs`;
    - `curl -sf http://127.0.0.1:8080/metrics` tem de falhar ou dar 404, ou seja, não pode devolver o texto Prometheus (prova de que o nginx não expõe as métricas). Guardar o código HTTP no artefacto;
    - logs e upload `fintrack-observability` com `if: always()`;
    - `down` com `if: always()`.

- [ ] **Step 4: Documentação**
  - `docs/sprints/sprint-4/README.md` tem:
    - tabela XOPS-29 a 35 (responsável e critério, com o estado real: só a 29 tem entrega);
    - métricas e etiquetas (copiadas das Global Constraints);
    - comandos PowerShell: staging com Prometheus, smoke, `metrics-check`, abrir `http://127.0.0.1:9090`, três consultas de exemplo;
    - limites: sem tracing, sem logs estruturados, `/metrics` sem autenticação mas só na rede interna.
  - `README.md`: Prometheus passa a "Integrado no staging (Sprint 4)".

- [ ] **Step 5: Validar localmente o que este ambiente permite**

Run: `node --check scripts/metrics-check.mjs && cd backend && npm test`
Expected: sem erros. Sem Docker aqui, a prova do Prometheus é o workflow remoto (passo 7).

- [ ] **Step 6: Commit e push**

```bash
git add observability scripts/metrics-check.mjs .github/workflows/observability.yml compose.staging.yaml docs/sprints/sprint-4/README.md README.md
git commit -m "feat: recolhe métricas com Prometheus no staging (XOPS-29)"
git push -u origin claude/stoic-euler-l9rt2d
```

- [ ] **Step 7: Verificar no GitHub Actions**

Expected: `FinTrack CI`, `FinTrack DAST`, `FinTrack AI Gate` e `FinTrack Observability` com conclusão `success` no commit enviado. Em falha, ler os logs do job, corrigir e voltar ao passo 6.
