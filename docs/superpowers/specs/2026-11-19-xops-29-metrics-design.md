# XOPS-29 — Métricas HTTP e PostgreSQL (desenho)

## Contexto
Nenhuma das 7 tarefas do Sprint 4 (XOPS-29 a 35) tem código. O utilizador quer fazer todas e deixou a ordem ao meu critério. A ordem é a das dependências:

1. **XOPS-29** Métricas (este desenho)
2. XOPS-30 Grafana
3. XOPS-31 Alertas e IA
4. XOPS-33 Gate de IA com evidência real
5. XOPS-32 Entrega e rollback
6. XOPS-34 Feedback Log
7. XOPS-35 Documentação e review

Cada uma tem desenho e aprovação próprios. Pendentes do Sprint 3 a levar em conta: o P2 real (XOPS-26) nunca correu, porque falta `OPENAI_API_KEY` nos secrets, e as XOPS-23 a 28 continuam em To Do no Jira, embora o código esteja em `main`.

## Objetivo da XOPS-29
Critérios de aceitação do Jira:
1. Contagem, erros e duração dos pedidos HTTP por rota normalizada.
2. Duração e falhas das operações PostgreSQL, sem expor SQL, despesas ou credenciais.
3. Endpoint de métricas e recolha pelo Prometheus em Docker, com configuração versionada.
4. Demonstração num fluxo de despesas, com instruções para reproduzir.

## Abordagens consideradas
- **prom-client mais Prometheus (escolhida):** biblioteca padrão de Node, pouco código, formato nativo do Prometheus e do Grafana (XOPS-30).
- OpenTelemetry SDK mais coletor: dá tracing, mas acrescenta um componente e muita configuração para dois serviços. É excessivo para o MVP.
- Formato de texto escrito à mão: sem dependência, mas obriga a reimplementar histogramas. Sem vantagem real.

## Desenho
**Backend**
- `backend/src/metrics.js` (novo): `createMetrics(registry = new Registry())` devolve:
  - o middleware HTTP;
  - `instrumentRepository(repo)`;
  - um handler para `/metrics`.
- Métricas definidas em `createMetrics`:
  - `collectDefaultMetrics` com prefixo `fintrack_`;
  - `fintrack_http_requests_total{method,route,status_code}` (counter);
  - `fintrack_http_request_duration_seconds{method,route,status_code}` (histogram);
  - `fintrack_db_operation_duration_seconds{operation,outcome}` (histogram);
  - `fintrack_db_operation_errors_total{operation}` (counter);
  - gauges `fintrack_db_pool_connections{state=total|idle|waiting}`, lidos do `pool` no momento da recolha.
- **Rota normalizada:** `req.baseUrl + req.route.path` no evento `finish`, por exemplo `/api/expenses/:id`. Pedidos sem rota levam `route="unmatched"`, o que evita cardinalidade ilimitada. Os erros saem do `status_code` (4xx e 5xx).
- **PostgreSQL:** instrumento no repositório (`backend/src/expenses/repository.js` fica intacto) e não no `pool.query`. Cada método (`list`, `get`, `create`, `update`, `remove`, `summary`) é envolvido e a etiqueta `operation` é o nome do método. Assim nenhum texto SQL nem parâmetro chega às métricas.
- **`backend/src/app.js`:**
  - `createApp(repository, { metrics })` aplica o middleware e expõe `GET /metrics`, fora de `/api`;
  - o default de produção usa `instrumentRepository(expenseRepository(pool))`;
  - os testes criam um registry novo em cada caso.
- **Exposição:** o nginx só encaminha `/api/`, por isso `/metrics` não fica público. O Prometheus recolhe por dentro da rede do Compose, em `api:3000`.

**Infraestrutura**
- `observability/prometheus/prometheus.yml` (novo): recolha de `api:3000/metrics` a cada 5 s.
- `compose.staging.yaml`: serviço `prometheus` com imagem de versão fixa, configuração montada só para leitura e porta `127.0.0.1:9090`. O DAST arranca só `web` e não é afetado.

**Demonstração e CI**
- `scripts/metrics-check.mjs` (novo):
  - depois do `staging-smoke.mjs`, consulta a API do Prometheus;
  - confirma séries HTTP com a rota normalizada e séries de DB por operação;
  - guarda o resultado em `artifacts/observability/`.
- `.github/workflows/observability.yml` (novo), a correr em push, PR e manualmente:
  - staging com Prometheus, smoke, `metrics-check`, logs;
  - publicação do artefacto `fintrack-observability`. Este workflow é a base que a XOPS-30 e a XOPS-31 vão estender.
- `docs/sprints/sprint-4/README.md` (novo): tabela das tarefas, métricas e etiquetas, comandos de reprodução e limites.

**Testes (vitest, em `backend/tests/metrics.test.js`)**
- `/metrics` devolve o formato Prometheus.
- O pedido a `/api/expenses/42` é contado como `route="/api/expenses/:id"`; um 404 sem rota fica `unmatched`.
- Um erro simulado no repositório incrementa `fintrack_db_operation_errors_total{operation="list"}` e devolve 500.
- O texto das métricas não contém valores de despesas, SQL nem a palavra-passe.
- Os 17 testes existentes continuam a passar.

## Git
- Repor `claude/stoic-euler-l9rt2d` a partir de `origin/main`, que já contém o Sprint 3.
- Commits com o autor `Santiago Fernandes <santiagoadaofernandes@gmail.com>` e **sem linhas de atribuição** (pedido do utilizador).
- Push para essa branch, sem PR e sem mexer no Jira, a não ser que o utilizador peça.

## Verificação
- `npm run lint`, `npm run build` e `npm test` no backend.
- `docker compose -f compose.staging.yaml up` com a chamada a `/metrics` e as queries ao Prometheus, se o Docker estiver disponível aqui. O daemon parece parado; nesse caso a prova é o workflow `observability.yml` no GitHub Actions depois do push.
