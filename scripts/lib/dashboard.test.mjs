import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const dashboard = JSON.parse(readFileSync(new URL('../../observability/grafana/dashboards/fintrack-api.json', import.meta.url), 'utf8'));
const panels = dashboard.panels.filter(panel => panel.type !== 'row');
const exprs = panels.flatMap(panel => (panel.targets ?? []).map(target => target.expr));
const allowed = /^(fintrack_(http_requests_total|http_request_duration_seconds(_bucket|_sum|_count)?|db_operation_duration_seconds(_bucket|_sum|_count)?|db_operation_errors_total|db_pool_connections)|up)$/;

test('dashboard com uid fixo e datasource provisionado', () => {
  assert.equal(dashboard.uid, 'fintrack-api');
  assert.ok(panels.length >= 8);
  for (const panel of panels) assert.deepEqual(panel.datasource, { type: 'prometheus', uid: 'fintrack-prometheus' }, panel.title);
});

test('cobre tráfego, erros, latência, PostgreSQL e pool', () => {
  const titles = panels.map(panel => panel.title).join(' | ');
  for (const word of ['Pedidos', 'Erros', 'Latência HTTP', 'PostgreSQL', 'Pool']) assert.match(titles, new RegExp(word), word);
});

test('só usa métricas publicadas pela API', () => {
  assert.ok(exprs.length > 0);
  for (const expr of exprs) {
    const metrics = expr.match(/\b(fintrack_[a-z_]+|up)\b(?=\s*[{[(]|\s*$|\s*\))/g) ?? [];
    assert.ok(metrics.length, expr);
    for (const metric of metrics) assert.match(metric, allowed, expr);
    assert.doesNotMatch(expr, /\/api\/expenses\/\d/, expr);
  }
});

test('vista API vs PostgreSQL junta latência HTTP e da base de dados', () => {
  const panel = panels.find(p => /API vs PostgreSQL/.test(p.title));
  assert.ok(panel, 'falta o painel API vs PostgreSQL');
  const own = panel.targets.map(t => t.expr).join('\n');
  assert.match(own, /http_request_duration/);
  assert.match(own, /db_operation_duration/);
});
