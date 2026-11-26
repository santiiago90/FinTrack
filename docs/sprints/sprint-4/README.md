# Sprint 4 — Observabilidade e entrega

[Visão geral do projeto](../../../README.md) · [Sprint 3](../sprint-3/README.md)

O objetivo é explicar o comportamento do FinTrack em execução, alertar sobre anomalias e entregar automaticamente só quando os gates obrigatórios passam.

## Tarefas

| Tarefa | Responsável no Jira | Critério de aceitação | Estado no repositório |
|---|---|---|---|
| [XOPS-29](https://santiagoadaofernandes.atlassian.net/browse/XOPS-29) | Santiago | Métricas HTTP e PostgreSQL, recolha Prometheus versionada, demonstração reproduzível | Integrado ([PR #3](https://github.com/santiiago90/FinTrack/pull/3)) |
| [XOPS-30](https://santiagoadaofernandes.atlassian.net/browse/XOPS-30) | João | Dashboard Grafana provisionado, vista de gargalo, cenário controlado e capturas | Implementado; evidência em [xops-30-evidencia.md](xops-30-evidencia.md) |
| [XOPS-31](https://santiagoadaofernandes.atlassian.net/browse/XOPS-31) | Santiago | Alertas versionados, disparo e recuperação, interpretação por IA com P2 | Por fazer |
| [XOPS-32](https://santiagoadaofernandes.atlassian.net/browse/XOPS-32) | João | Entrega condicionada aos gates, versão identificada, recuperação demonstrada | Por fazer |
| [XOPS-33](https://santiagoadaofernandes.atlassian.net/browse/XOPS-33) | Santiago | Gate de IA com evidência real dos testes e duas execuções comparadas | Por fazer |
| [XOPS-34](https://santiagoadaofernandes.atlassian.net/browse/XOPS-34) | João | Feedback Log com a falha de porta do DAST e uma observação do dashboard | Por fazer |
| [XOPS-35](https://santiagoadaofernandes.atlassian.net/browse/XOPS-35) | João | Cerimónias, documentação, demonstração e material para o relatório | Por fazer |

## Métricas da API (XOPS-29)

A API expõe `GET /metrics` em formato Prometheus, com a biblioteca `prom-client`. O código está em [`backend/src/metrics.js`](../../../backend/src/metrics.js).

| Métrica | Tipo | Etiquetas | O que mede |
|---|---|---|---|
| `fintrack_http_requests_total` | counter | `method`, `route`, `status_code` | Pedidos HTTP |
| `fintrack_http_request_duration_seconds` | histogram | `method`, `route`, `status_code` | Duração dos pedidos |
| `fintrack_db_operation_duration_seconds` | histogram | `operation`, `outcome` | Duração das operações do repositório PostgreSQL |
| `fintrack_db_operation_errors_total` | counter | `operation` | Operações PostgreSQL que falharam |
| `fintrack_db_pool_connections` | gauge | `state` (`total`, `idle`, `waiting`) | Ligações do pool |
| `fintrack_process_*`, `fintrack_nodejs_*` | vários | — | Métricas padrão do processo Node.js |

- **Rota normalizada:** a etiqueta `route` é o padrão Express, por exemplo `/api/expenses/:id`, nunca o caminho com o identificador. Pedidos sem rota ficam `unmatched`. Isto limita o número de séries.
- **Erros HTTP:** contam-se pelo `status_code` (`4xx` e `5xx`).
- **PostgreSQL sem dados sensíveis:** cada método do repositório (`list`, `get`, `create`, `update`, `remove`, `summary`) é medido pelo nome. O SQL, os parâmetros, os valores das despesas e as credenciais nunca entram nas etiquetas. Os testes em [`backend/tests/metrics.test.js`](../../../backend/tests/metrics.test.js) confirmam-no.
- **Exposição:** o nginx do staging só encaminha `/api/`, por isso `/metrics` não fica acessível pelo frontend. O Prometheus recolhe por dentro da rede do Compose, em `api:3000`.

## Executar staging com Prometheus

Da raiz do repositório, com Docker Desktop e Node.js 22:

~~~powershell
docker compose -p fintrack-sprint4 -f compose.staging.yaml up -d --build --wait --wait-timeout 120 web prometheus
node scripts/staging-smoke.mjs
node scripts/metrics-check.mjs
~~~

- O smoke test cria, filtra e apaga uma despesa fictícia.
- O `metrics-check` consulta o Prometheus até 60 s e confirma as séries HTTP e PostgreSQL desse fluxo. O resultado fica em `artifacts/observability/metrics-check.json`.
- A interface fica em http://127.0.0.1:8080 e o Prometheus em http://127.0.0.1:9090. Se as portas estiverem ocupadas, define `$env:STAGING_PORT` e `$env:PROMETHEUS_PORT` antes dos comandos.

Consultas úteis em http://127.0.0.1:9090/query:

~~~promql
sum by (route, status_code) (rate(fintrack_http_requests_total[1m]))
histogram_quantile(0.95, sum by (le, route) (rate(fintrack_http_request_duration_seconds_bucket[5m])))
sum by (operation) (rate(fintrack_db_operation_errors_total[5m]))
~~~

Para parar:

~~~powershell
docker compose -p fintrack-sprint4 -f compose.staging.yaml down
~~~

A configuração de recolha está em [`observability/prometheus/prometheus.yml`](../../../observability/prometheus/prometheus.yml), com intervalo de 5 s. O Prometheus guarda os dados dentro do container; parar o staging apaga-os.

## Dashboard e cenário controlado (XOPS-30)

O staging inclui um **Grafana** já configurado, em http://127.0.0.1:3001. Abre sem login, em modo só de leitura, diretamente no dashboard **FinTrack API**. O datasource e o dashboard estão versionados em [`observability/grafana/`](../../../observability/grafana/). As alterações feitas na interface não são guardadas: muda-se o JSON e reinicia-se o Grafana.

### Painéis

| Linha | Painel | Como ler |
|---|---|---|
| Tráfego e erros | Pedidos por segundo, por rota | Carga de cada rota normalizada |
| | Erros 5xx (%) | Falhas do servidor. Esperado: 0 na base e na recuperação. Na rajada, 5xx significam que pedidos esperaram mais de 2 s por uma ligação do pool, o que é um gargalo real a registar |
| | Erros 4xx por rota | Pedidos inválidos (400) e inexistentes (404), que são esperados no cenário |
| Latência | Latência HTTP p50 e p95 | Tempo medido na API, sem o nginx |
| | Latência PostgreSQL p95 por operação | Inclui a espera por uma ligação do pool |
| Dependência API → PostgreSQL | **API vs PostgreSQL (p95)** | Vista arquitetural: se as duas curvas sobem juntas, a latência da API vem da base de dados |
| | Pool de ligações PostgreSQL | `waiting` > 0 indica que as 10 ligações do pool estão todas ocupadas |
| | Erros PostgreSQL por operação | Timeouts e falhas das operações do repositório |
| | API disponível | `up` do Prometheus para a API |

As fases do cenário aparecem como anotações (marcas laranja) no eixo do tempo.

### Executar o cenário

Com o staging a correr (incluindo `grafana`), a partir da raiz do repositório:

**Windows (PowerShell):**

~~~powershell
docker compose -p fintrack-staging -f compose.staging.yaml up -d --build --wait --wait-timeout 180
node scripts/load-scenario.mjs
node scripts/scenario-report.mjs
cd observability/capture; npm ci; npx playwright install chromium; cd ../..
node observability/capture/capture.mjs
~~~

**macOS (Terminal):**

~~~bash
docker compose -p fintrack-staging -f compose.staging.yaml up -d --build --wait --wait-timeout 180
node scripts/load-scenario.mjs
node scripts/scenario-report.mjs
(cd observability/capture && npm ci && npx playwright install chromium)
node observability/capture/capture.mjs
~~~

O cenário demora cerca de 4 minutos e passa por estas fases:

| Fase | Duração | O que acontece |
|---|---|---|
| seed | — | Cria 300 despesas fictícias (categorias "Cenário …") |
| `base` | 60 s | 2 clientes em simultâneo com uma mistura de leituras, escritas e pedidos inválidos |
| `rajada` | 60 s | 60 clientes em simultâneo, só leituras (lista e resumo) |
| `db-indisponivel` | 30 s | `docker compose pause db`: o PostgreSQL congela e a API responde com erro ao fim de 2 a 5 s |
| `recuperacao` | 60 s | `unpause`, com o mesmo tráfego da fase base |

As durações mudam-se com `SCENARIO_BASE_S`, `SCENARIO_BURST_S`, `SCENARIO_OUTAGE_S`, `SCENARIO_RECOVERY_S`, `SCENARIO_BURST_CONCURRENCY` e `SCENARIO_SEED`. Se o cenário for interrompido com `Ctrl+C`, o PostgreSQL é retomado na mesma.

### Evidência gerada

Tudo fica em `artifacts/observability/`:

| Ficheiro | Conteúdo |
|---|---|
| `scenario-timeline.json` | Início e fim de cada fase, pedidos, falhas e códigos HTTP |
| `scenario-queries.json` | Cada consulta PromQL usada (do resumo e de todos os painéis) e as séries obtidas |
| `scenario-summary.md` / `.json` | Tabela por fase: pedidos/s, % de 5xx, p95 HTTP, p95 DB, máximo do pool à espera, total de erros DB. Cada linha mede só a sua fase, com uma consulta no fim da fase sobre a duração dela |
| `dashboard.png`, `dashboard-dependencia.png` | Capturas do dashboard na janela do cenário |

No CI, o job **scenario** do workflow FinTrack Observability corre o mesmo cenário em pushes para `main` e manualmente (*Run workflow*), e publica o artefacto `fintrack-scenario`.

### Resiliência da ligação ao PostgreSQL

Ao preparar o cenário descobriu-se que a API terminava se uma ligação inativa ao PostgreSQL falhasse (o `pg.Pool` emitia `error` sem ouvinte) e que não havia timeouts. O `backend/src/db.js` passou a tratar o erro do pool e a usar `DB_CONNECTION_TIMEOUT_MS` (2000 ms por omissão) e `DB_QUERY_TIMEOUT_MS` (5000 ms por omissão). Esta observação deve ser registada no Architectural Feedback Log (XOPS-34).

## CI

O workflow [**FinTrack Observability**](../../../.github/workflows/observability.yml) corre em pushes, PRs e manualmente:
1. arranca o staging com Prometheus;
2. executa o smoke test e o `metrics-check`;
3. confirma que `/metrics` não é servido pelo nginx;
4. publica o artefacto `fintrack-observability` (resultado das consultas, estado de `/metrics` público e logs), mesmo em falha.

## Limites

- Não há tracing distribuído nem logs estruturados.
- O Prometheus e o Grafana do staging não guardam dados entre execuções.
- Os histogramas de latência vão até 10 s; acima disso o p95 fica limitado a 10 s.
- Os gráficos usam `rate` sobre 30 s, por isso cada curva reage com até 30 s de atraso a uma mudança de fase.
- `/metrics` não tem autenticação; está protegido apenas por não ser publicado fora da rede do Compose. Não expor a porta 3000 da API.
- As métricas não distinguem utilizadores: o MVP continua sem autenticação.
- A duração PostgreSQL mede o método do repositório, incluindo a espera por uma ligação do pool; não separa tempo de rede e tempo de execução da query.
