import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createMetrics } from '../src/metrics.js';

function fakeRepository(overrides = {}) {
  return {
    list: async () => [],
    get: async () => undefined,
    create: async data => ({ id: 1, ...data }),
    update: async () => undefined,
    remove: async () => false,
    summary: async ({ month }) => ({ month, currency: 'EUR', total: '0.00', categories: [] }),
    ...overrides,
  };
}
const build = (repository = fakeRepository()) => createApp(repository, { metrics: createMetrics() });
const scrape = async app => (await request(app).get('/metrics').expect(200)).text;

describe('Métricas Prometheus da API', () => {
  it('expõe métricas em formato Prometheus', async () => {
    const response = await request(build()).get('/metrics').expect(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toContain('fintrack_process_cpu_user_seconds_total');
  });

  it('normaliza a rota e conta o estado', async () => {
    const app = build();
    await request(app).get('/api/expenses/42').expect(404);
    const text = await scrape(app);
    expect(text).toContain('fintrack_http_requests_total{method="GET",route="/api/expenses/:id",status_code="404"} 1');
    expect(text).not.toContain('/api/expenses/42');
  });

  it('ignora maiúsculas do pedido na etiqueta da rota', async () => {
    const app = build();
    await request(app).get('/api/Expenses/1').expect(404);
    await request(app).get('/aPi/EXPENSES').expect(200);
    const text = await scrape(app);
    expect(text).toContain('fintrack_http_requests_total{method="GET",route="/api/expenses/:id",status_code="404"} 1');
    expect(text).toContain('fintrack_http_requests_total{method="GET",route="/api/expenses",status_code="200"} 1');
    expect(text).not.toMatch(/route="[^"]*[A-Z]/);
  });

  it('agrupa caminhos desconhecidos', async () => {
    const app = build();
    await request(app).get('/nao-existe/123').expect(404);
    const text = await scrape(app);
    expect(text).toContain('fintrack_http_requests_total{method="GET",route="unmatched",status_code="404"} 1');
    expect(text).not.toContain('nao-existe');
  });

  it('mede operações e falhas do repositório', async () => {
    const app = build(fakeRepository({ list: async () => { throw new Error('SELECT secret FROM expenses password=xyz'); } }));
    await request(app).get('/api/expenses').expect(500);
    const text = await scrape(app);
    expect(text).toContain('fintrack_http_requests_total{method="GET",route="/api/expenses",status_code="500"} 1');
    expect(text).toContain('fintrack_db_operation_errors_total{operation="list"} 1');
    expect(text).toContain('fintrack_db_operation_duration_seconds_count{operation="list",outcome="error"} 1');
    for (const leaked of ['SELECT', 'secret', 'xyz']) expect(text).not.toContain(leaked);
  });

  it('não expõe dados das despesas', async () => {
    const app = build();
    await request(app).post('/api/expenses')
      .send({ amount: '987.65', date: '2026-11-19', category: 'CategoriaSecreta', description: 'DescricaoSecreta' })
      .expect(201);
    const text = await scrape(app);
    expect(text).toContain('fintrack_db_operation_duration_seconds_count{operation="create",outcome="success"} 1');
    for (const leaked of ['987.65', 'CategoriaSecreta', 'DescricaoSecreta']) expect(text).not.toContain(leaked);
  });

  it('isola registries entre instâncias', async () => {
    const first = build();
    const second = build();
    await request(first).get('/api/expenses').expect(200);
    await request(first).get('/api/expenses').expect(200);
    await request(second).get('/api/expenses').expect(200);
    expect(await scrape(first)).toContain('fintrack_http_requests_total{method="GET",route="/api/expenses",status_code="200"} 2');
    expect(await scrape(second)).toContain('fintrack_http_requests_total{method="GET",route="/api/expenses",status_code="200"} 1');
  });

  it('publica o estado do pool', async () => {
    const metrics = createMetrics({ pool: { totalCount: 3, idleCount: 2, waitingCount: 1 } });
    const text = await metrics.registry.metrics();
    expect(text).toContain('fintrack_db_pool_connections{state="total"} 3');
    expect(text).toContain('fintrack_db_pool_connections{state="waiting"} 1');
  });
});
