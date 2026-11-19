# Sprint 4 — Observabilidade e entrega

[Visão geral do projeto](../../../README.md) · [Sprint 3](../sprint-3/README.md)

O objetivo é explicar o comportamento do FinTrack em execução, alertar sobre anomalias e entregar automaticamente só quando os gates obrigatórios passam.

## Tarefas

| Tarefa | Responsável no Jira | Critério de aceitação | Estado no repositório |
|---|---|---|---|
| [XOPS-29](https://santiagoadaofernandes.atlassian.net/browse/XOPS-29) | Santiago | Métricas HTTP e PostgreSQL, recolha Prometheus versionada, demonstração reproduzível | Entregue nesta branch |
| [XOPS-30](https://santiagoadaofernandes.atlassian.net/browse/XOPS-30) | João | Dashboard Grafana provisionado, vista de gargalo, cenário controlado e capturas | Por fazer |
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

## CI

O workflow [**FinTrack Observability**](../../../.github/workflows/observability.yml) corre em pushes, PRs e manualmente:
1. arranca o staging com Prometheus;
2. executa o smoke test e o `metrics-check`;
3. confirma que `/metrics` não é servido pelo nginx;
4. publica o artefacto `fintrack-observability` (resultado das consultas, estado de `/metrics` público e logs), mesmo em falha.

## Limites

- Só métricas: não há tracing distribuído nem logs estruturados.
- `/metrics` não tem autenticação; está protegido apenas por não ser publicado fora da rede do Compose. Não expor a porta 3000 da API.
- As métricas não distinguem utilizadores: o MVP continua sem autenticação.
- A duração PostgreSQL mede o método do repositório, incluindo a espera por uma ligação do pool; não separa tempo de rede e tempo de execução da query.
