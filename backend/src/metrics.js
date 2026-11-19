import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

const HTTP_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5];
const DB_BUCKETS = [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 1];
const seconds = start => Number(process.hrtime.bigint() - start) / 1e9;

// Cada instância da aplicação tem o seu registry, para os testes poderem criar várias.
export function createMetrics({ pool } = {}) {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: 'fintrack_' });

  const httpLabels = ['method', 'route', 'status_code'];
  const httpRequests = new Counter({
    name: 'fintrack_http_requests_total', help: 'Pedidos HTTP por rota normalizada.',
    labelNames: httpLabels, registers: [registry],
  });
  const httpDuration = new Histogram({
    name: 'fintrack_http_request_duration_seconds', help: 'Duração dos pedidos HTTP em segundos.',
    labelNames: httpLabels, buckets: HTTP_BUCKETS, registers: [registry],
  });
  const dbDuration = new Histogram({
    name: 'fintrack_db_operation_duration_seconds', help: 'Duração das operações do repositório PostgreSQL em segundos.',
    labelNames: ['operation', 'outcome'], buckets: DB_BUCKETS, registers: [registry],
  });
  const dbErrors = new Counter({
    name: 'fintrack_db_operation_errors_total', help: 'Operações do repositório PostgreSQL que falharam.',
    labelNames: ['operation'], registers: [registry],
  });
  if (pool) {
    new Gauge({
      name: 'fintrack_db_pool_connections', help: 'Ligações do pool PostgreSQL por estado.',
      labelNames: ['state'], registers: [registry],
      collect() {
        this.set({ state: 'total' }, pool.totalCount);
        this.set({ state: 'idle' }, pool.idleCount);
        this.set({ state: 'waiting' }, pool.waitingCount);
      },
    });
  }

  function httpMiddleware(req, res, next) {
    const start = process.hrtime.bigint();
    // Guardar a rota quando o Express a resolve: em caso de erro, req.baseUrl é reposto antes do 'finish'.
    // O Express compara caminhos sem distinguir maiúsculas; a etiqueta fica em minúsculas para não multiplicar séries.
    let current, route = 'unmatched';
    Object.defineProperty(req, 'route', {
      configurable: true, enumerable: true,
      get: () => current,
      set(value) { current = value; if (typeof value?.path === 'string') route = (req.baseUrl + value.path).replace(/(.)\/$/, '$1').toLowerCase(); },
    });
    res.on('finish', () => {
      const labels = { method: req.method, route, status_code: String(res.statusCode) };
      httpRequests.inc(labels);
      httpDuration.observe(labels, seconds(start));
    });
    next();
  }

  // Mede cada método pelo nome; o SQL e os parâmetros nunca chegam às etiquetas.
  function instrumentRepository(repository) {
    return Object.fromEntries(Object.entries(repository).map(([operation, method]) => {
      if (typeof method !== 'function') return [operation, method];
      return [operation, async (...args) => {
        const start = process.hrtime.bigint();
        try {
          const result = await method.apply(repository, args);
          dbDuration.observe({ operation, outcome: 'success' }, seconds(start));
          return result;
        } catch (error) {
          dbDuration.observe({ operation, outcome: 'error' }, seconds(start));
          dbErrors.inc({ operation });
          throw error;
        }
      }];
    }));
  }

  async function handler(req, res) {
    res.set('Content-Type', registry.contentType).send(await registry.metrics());
  }

  return { registry, httpMiddleware, instrumentRepository, handler };
}
