import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES, fakeExpense, phasesFromEnv, pickRequest } from './scenario.mjs';

test('fases por omissão', () => {
  const phases = phasesFromEnv({});
  assert.deepEqual(phases.map(p => p.name), ['base', 'rajada', 'db-indisponivel', 'recuperacao']);
  assert.deepEqual(phases.map(p => p.seconds), [60, 60, 30, 60]);
  assert.deepEqual(phases.map(p => p.concurrency), [2, 60, 2, 2]);
});

test('variáveis de ambiente', () => {
  const phases = phasesFromEnv({ SCENARIO_BASE_S: '5', SCENARIO_BURST_S: '6', SCENARIO_OUTAGE_S: '7', SCENARIO_RECOVERY_S: '8', SCENARIO_BURST_CONCURRENCY: '9' });
  assert.deepEqual(phases.map(p => p.seconds), [5, 6, 7, 8]);
  assert.equal(phases[1].concurrency, 9);
  assert.throws(() => phasesFromEnv({ SCENARIO_BURST_S: 'abc' }), /SCENARIO_BURST_S/);
  assert.throws(() => phasesFromEnv({ SCENARIO_BURST_CONCURRENCY: '0' }), /SCENARIO_BURST_CONCURRENCY/);
});

test('despesa fictícia válida', () => {
  const today = new Date('2026-11-26T12:00:00Z');
  const oldest = new Date('2026-08-28T00:00:00Z');
  for (let i = 0; i < 200; i++) {
    const e = fakeExpense(i, today);
    assert.match(e.amount, /^\d+\.\d{2}$/);
    assert.ok(Number(e.amount) >= 2 && Number(e.amount) <= 82, e.amount);
    assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(new Date(e.date) >= oldest && new Date(e.date) <= today, e.date);
    assert.ok(CATEGORIES.includes(e.category));
    assert.ok(e.category.startsWith('Cenário ') && e.description.startsWith('Cenário '));
  }
  assert.equal(CATEGORIES.length, 6);
});

test('mistura da rajada só tem leituras', () => {
  const burst = phasesFromEnv({})[1];
  for (let i = 0; i < 100; i++) assert.ok(['list', 'summary'].includes(pickRequest(burst.mix, () => i / 100)));
  const base = phasesFromEnv({})[0];
  const seen = new Set(Array.from({ length: 100 }, (_, i) => pickRequest(base.mix, () => i / 100)));
  for (const kind of ['list', 'summary', 'get', 'create', 'invalid']) assert.ok(seen.has(kind), kind);
});
