import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { createApp } from '../src/app.js';
import { expenseRepository } from '../src/expenses/repository.js';

let db, app;
const expense = { amount: '12.30', date: '2026-10-21', category: 'Alimentação', description: 'Almoço' };
beforeAll(async () => {
  // CI uses an isolated PostgreSQL service; local runs use PostgreSQL WASM.
  db = process.env.TEST_DATABASE_URL ? new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL }) : new PGlite();
  const sql = await readFile(new URL('../../database/001-expenses.sql', import.meta.url), 'utf8');
  if (db.exec) await db.exec(sql); else await db.query(sql);
  app = createApp(expenseRepository(db));
}, 30000);
beforeEach(async () => { await db.query('TRUNCATE expenses RESTART IDENTITY'); });
afterAll(async () => { if (db?.close) await db.close(); else await db?.end(); });
describe('API de despesas com persistência SQL', () => {
  it('cria, consulta, atualiza e elimina com respostas coerentes', async () => {
    const created = await request(app).post('/api/expenses').send(expense).expect(201);
    expect(created.headers.location).toBe('/api/expenses/1');
    expect(created.body).toMatchObject({ id: 1, ...expense });
    const reloadedApp = createApp(expenseRepository(db));
    expect((await request(reloadedApp).get('/api/expenses/1').expect(200)).body).toEqual(created.body);
    expect((await request(app).put('/api/expenses/1').send({ ...expense, amount: '20.45' }).expect(200)).body.amount).toBe('20.45');
    await request(app).delete('/api/expenses/1').expect(204);
    await request(app).get('/api/expenses/1').expect(404);
    await request(app).put('/api/expenses/1').send(expense).expect(404);
    await request(app).delete('/api/expenses/1').expect(404);
  });
  it('filtra mês e categoria e soma cêntimos sem arredondamentos', async () => {
    for (const item of [
      { ...expense, amount: '0.10' }, { ...expense, amount: '0.20' },
      { ...expense, amount: '2.05', category: 'Casa' },
      { ...expense, amount: '99.99', date: '2026-11-01' },
    ]) await request(app).post('/api/expenses').send(item).expect(201);
    const list = await request(app).get('/api/expenses?month=2026-10&category=Alimenta%C3%A7%C3%A3o').expect(200);
    expect(list.body).toHaveLength(2);
    const summary = await request(app).get('/api/expenses/summary?month=2026-10').expect(200);
    expect(summary.body.total).toBe('2.35');
    expect(summary.body.categories).toContainEqual({ category: 'Alimentação', total: '0.30', count: 2 });
    expect((await request(app).get('/api/expenses/summary?month=2026-12').expect(200)).body.total).toBe('0.00');
  });
  it.each([
    [{ amount: 0 }, 'amount'], [{ amount: -1 }, 'amount'], [{ amount: '1.001' }, 'amount'],
    [{ amount: '10000000000' }, 'amount'], [{ amount: true }, 'amount'],
    [{ date: '2026-02-30' }, 'date'], [{ date: 'invalid' }, 'date'], [{ date: '0000-01-01' }, 'date'],
    [{ category: ' ' }, 'category'], [{ category: 'a'.repeat(81) }, 'category'],
    [{ description: null }, 'description'], [{ description: 'a'.repeat(501) }, 'description'],
  ])('rejeita dados inválidos %j', async (changes, field) => {
    const result = await request(app).post('/api/expenses').send({ ...expense, ...changes }).expect(400);
    expect(result.body.fields[field]).toBeTruthy();
    expect((await db.query('SELECT * FROM expenses')).rows).toHaveLength(0);
  });
  it('aceita ano bissexto, descrição omitida e categoria com apóstrofo', async () => {
    const created = await request(app).post('/api/expenses').send({ amount: '1.00', date: '2024-02-29', category: "D'Água" }).expect(201);
    expect(created.body.description).toBe('');
    expect((await request(app).get("/api/expenses").query({ category: "D'Água" }).expect(200)).body).toHaveLength(1);
  });
  it('rejeita campos em falta, filtros, identificadores e JSON inválidos', async () => {
    await request(app).post('/api/expenses').send({}).expect(400);
    for (const path of ['?month=2026-13', '?month[]=2026-10', '?category=', '/summary', '/0', '/2147483648', '/abc'])
      await request(app).get('/api/expenses' + path).expect(400);
    await request(app).post('/api/expenses').set('Content-Type', 'application/json').send('{').expect(400);
  });
});
