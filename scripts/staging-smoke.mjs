import assert from 'node:assert/strict';

const origin = 'http://127.0.0.1:' + (process.env.STAGING_PORT || 8080);
async function request(path, options) {
  const response = await fetch(origin + path, { ...options, signal: AbortSignal.timeout(5000) });
  assert.ok(response.ok, path + ': HTTP ' + response.status);
  return response;
}

const page = await request('/');
assert.match(await page.text(), /<div id="root"/);
assert.equal((await (await request('/api/health')).json()).status, 'ok');

const created = await request('/api/expenses', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ amount: '12.30', date: '2026-11-11', category: 'Teste', description: 'Smoke staging' }),
});
assert.equal(created.status, 201);
const expense = await created.json();
assert.ok(Number.isInteger(expense.id) && expense.id > 0);
try {
  const items = await (await request('/api/expenses?month=2026-11&category=Teste')).json();
  assert.ok(items.some(item => item.id === expense.id && item.amount === '12.30'));
} finally {
  const deleted = await request('/api/expenses/' + expense.id, { method: 'DELETE' });
  assert.equal(deleted.status, 204);
}
console.log('Staging: frontend, proxy, API e PostgreSQL verificados.');

