import assert from 'node:assert/strict';
import { test } from 'node:test';
import { phaseQueries, rowFromInstant, toMarkdown } from './report.mjs';

const phase = { name: 'rajada', start: '2026-11-26T10:01:00.000Z', end: '2026-11-26T10:02:00.400Z' };

test('consultas usam só a janela da própria fase', () => {
  const q = phaseQueries(phase);
  assert.equal(q.seconds, 60);
  for (const expr of Object.values(q.exprs)) assert.match(expr, /\[60s(:5s)?\]/, expr);
  assert.doesNotMatch(Object.values(q.exprs).join('\n'), /\[30s\]/);
  assert.match(q.exprs.rps, /\/ 60$/);
  assert.match(q.exprs.poolWaitingMax, /^max_over_time\(/);
  assert.equal(q.time, Date.parse(phase.end) / 1000);
  // Sem nenhum erro não há série: o resultado tem de ser 0, não vazio.
  assert.match(q.exprs.errorPct, /or vector\(0\)/);
  assert.match(q.exprs.dbErrors, /or vector\(0\)$/);
});

test('linha da fase a partir de resultados instantâneos', () => {
  const v = value => [{ metric: {}, value: [0, String(value)] }];
  const row = rowFromInstant(phase, { rps: v(30), errorPct: v(0), httpP95: v(0.2), dbP95: v(0.15), poolWaitingMax: v(7), dbErrors: v(0) });
  assert.deepEqual(row, { phase: 'rajada', rps: 30, errorPct: 0, httpP95Ms: 200, dbP95Ms: 150, poolWaitingMax: 7, dbErrors: 0 });
});

test('resultados vazios ou NaN dão null', () => {
  const row = rowFromInstant(phase, { rps: [], errorPct: [{ metric: {}, value: [0, 'NaN'] }] });
  assert.equal(row.rps, null);
  assert.equal(row.errorPct, null);
  assert.equal(row.dbErrors, null);
});

test('tabela markdown com traço para valores em falta', () => {
  const md = toMarkdown([{ phase: 'base', rps: 3, errorPct: null, httpP95Ms: 12.345, dbP95Ms: 5, poolWaitingMax: 0, dbErrors: null }]);
  assert.match(md, /^\| Fase \| Pedidos\/s \| 5xx % \| p95 HTTP \(ms\) \| p95 DB \(ms\) \| Pool à espera \(máx\) \| Erros DB \(total\) \|$/m);
  assert.match(md, /^\| base \| 3\.00 \| — \| 12\.3 \| 5\.0 \| 0 \| — \|$/m);
});
