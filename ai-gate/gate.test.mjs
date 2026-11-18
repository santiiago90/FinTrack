import assert from 'node:assert/strict';
import { test } from 'node:test';
import { askOpenAI, evaluate } from './gate.mjs';

const good = { suitePassed: true, verifiedCases: ['fluxo_valido', 'entrada_invalida'] };
const approve = { decision: 'approve', missingCases: [], reason: 'Dois casos verificados.' };
const reject = { decision: 'reject', missingCases: ['entrada_invalida'], reason: 'Falta o teste negativo.' };

test('duas chamadas com payload idêntico, aprova evidência completa', async () => {
  const requests = [];
  const result = await evaluate(good, async request => { requests.push(request); return approve; });
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(requests[0].store, false);
  assert.equal(result.stable, true);
  assert.equal(result.passed, true);
});

test('rejeita evidência incompleta mesmo se o modelo aprovar', async () => {
  const incomplete = { ...good, verifiedCases: ['fluxo_valido'] };
  assert.equal((await evaluate(incomplete, async () => approve)).passed, false);
  const result = await evaluate(incomplete, async () => reject);
  assert.equal(result.stable, true);
  assert.equal(result.matchesPolicy, true);
  assert.equal(result.passed, false);
});

test('não aprova uma suite falhada', async () => {
  const result = await evaluate({ ...good, suitePassed: false }, async () => approve);
  assert.equal(result.passed, false);
});

test('bloqueia divergência, saída inválida e falha do fornecedor', async () => {
  let call = 0;
  assert.equal((await evaluate(good, async () => call++ === 0 ? approve : reject)).stable, false);
  assert.equal((await evaluate(good, async () => ({ decision: 'maybe' }))).passed, false);
  const failure = await evaluate(good, async () => { throw new Error('Serviço indisponível'); });
  assert.equal(failure.passed, false);
  assert.equal(failure.results.length, 2);
});

test('recusa campos arbitrários antes de chamar o fornecedor', async () => {
  await assert.rejects(evaluate({ ...good, sourceCode: 'não transmitir' }, async () => {
    assert.fail('Não devia chamar o fornecedor');
  }), /Evidência inválida/);
});

test('cliente exige chave e recusa resposta não concluída', async () => {
  await assert.rejects(askOpenAI({}, { key: '' }), /não configurada/);
  const transport = async () => ({ ok: true, json: async () => ({ status: 'incomplete' }) });
  await assert.rejects(askOpenAI({}, { key: 'dummy', transport }), /incompleta/);
});

