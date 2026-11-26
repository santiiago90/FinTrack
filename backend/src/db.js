import pg from 'pg';

const number = (value, fallback) => (value === undefined || value === '' ? fallback : Number(value));
function timeout(env, name, fallback) {
  const value = number(env[name], fallback);
  // Um valor inválido seria tratado pelo pg como "sem timeout"; é melhor falhar no arranque.
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} tem de ser um inteiro positivo em milissegundos (recebido: ${env[name]}).`);
  return value;
}

// Timeouts evitam pedidos pendurados quando o PostgreSQL deixa de responder (XOPS-30).
export function createPool(env = process.env) {
  const pool = new pg.Pool({
    host: env.DB_HOST || 'localhost',
    port: number(env.DB_PORT, 5432),
    database: env.DB_NAME || 'fintrack',
    user: env.DB_USER || 'fintrack',
    password: env.DB_PASSWORD,
    connectionTimeoutMillis: timeout(env, 'DB_CONNECTION_TIMEOUT_MS', 2000),
    query_timeout: timeout(env, 'DB_QUERY_TIMEOUT_MS', 5000),
  });
  // Sem este ouvinte, o pg-pool emite 'error' numa ligação inativa e o processo termina.
  pool.on('error', error => console.error('Falha numa ligação inativa do PostgreSQL', { code: error.code }));
  return pool;
}

export const pool = createPool();
