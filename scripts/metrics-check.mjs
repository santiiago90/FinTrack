// Confirma que o Prometheus do staging recolheu as métricas do fluxo de despesas (XOPS-29).
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const prometheus = 'http://127.0.0.1:' + (process.env.PROMETHEUS_PORT || 9090);
const queries = {
  http: 'sum by (route, status_code) (fintrack_http_requests_total)',
  db: 'sum by (operation, outcome) (fintrack_db_operation_duration_seconds_count)',
  up: 'up{job="fintrack-api"}',
};

async function query(expr) {
  const url = prometheus + '/api/v1/query?query=' + encodeURIComponent(expr);
  const body = await (await fetch(url, { signal: AbortSignal.timeout(5000) })).json();
  assert.equal(body.status, 'success', expr + ': ' + JSON.stringify(body));
  return body.data.result.map(r => ({ labels: r.metric, value: Number(r.value[1]) }));
}

function check(results) {
  const has = (series, labels) => series.some(s => Object.entries(labels).every(([k, v]) => s.labels[k] === v) && s.value > 0);
  assert.ok(has(results.http, { route: '/api/expenses', status_code: '201' }), 'falta POST /api/expenses 201');
  assert.ok(has(results.http, { route: '/api/expenses/:id', status_code: '204' }), 'falta DELETE /api/expenses/:id 204');
  for (const operation of ['create', 'list', 'remove']) {
    assert.ok(has(results.db, { operation, outcome: 'success' }), 'falta a operação ' + operation);
  }
  assert.ok(results.up.length === 1 && results.up[0].value === 1, 'alvo fintrack-api indisponível');
  const raw = results.http.filter(s => /\d/.test(s.labels.route ?? ''));
  assert.equal(raw.length, 0, 'rotas com identificadores: ' + JSON.stringify(raw));
}

const deadline = Date.now() + 60000;
let results, failure;
while (Date.now() < deadline) {
  try {
    results = Object.fromEntries(await Promise.all(Object.entries(queries).map(async ([k, q]) => [k, await query(q)])));
    check(results);
    failure = undefined;
    break;
  } catch (error) {
    failure = error;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
mkdirSync('artifacts/observability', { recursive: true });
writeFileSync('artifacts/observability/metrics-check.json', JSON.stringify({
  checkedAt: new Date().toISOString(), prometheus, queries, results: results ?? null,
  passed: !failure, error: failure?.message ?? null,
}, null, 2) + '\n');
if (failure) {
  console.error('Métricas: falhou —', failure.message);
  process.exitCode = 1;
} else {
  console.log('Métricas: rotas HTTP normalizadas e operações PostgreSQL recolhidas pelo Prometheus.');
}
