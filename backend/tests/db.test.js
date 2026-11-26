import { afterEach, describe, expect, it, vi } from 'vitest';
import net from 'node:net';
import { createPool } from '../src/db.js';

const pools = [];
const track = pool => { pools.push(pool); return pool; };
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(pools.splice(0).map(pool => pool.end().catch(() => {})));
});

describe('Pool PostgreSQL', () => {
  it('aplica timeouts por omissão', () => {
    const pool = track(createPool({}));
    expect(pool.options.connectionTimeoutMillis).toBe(2000);
    expect(pool.options.query_timeout).toBe(5000);
  });

  it('lê timeouts do ambiente', () => {
    const pool = track(createPool({ DB_CONNECTION_TIMEOUT_MS: '300', DB_QUERY_TIMEOUT_MS: '900' }));
    expect(pool.options.connectionTimeoutMillis).toBe(300);
    expect(pool.options.query_timeout).toBe(900);
  });

  it('recusa timeouts inválidos em vez de os desligar', () => {
    expect(() => createPool({ DB_CONNECTION_TIMEOUT_MS: 'abc' })).toThrow(/DB_CONNECTION_TIMEOUT_MS/);
    expect(() => createPool({ DB_QUERY_TIMEOUT_MS: '0' })).toThrow(/DB_QUERY_TIMEOUT_MS/);
  });

  it('falha depressa quando a base não responde', async () => {
    const sockets = [];
    const server = net.createServer(socket => sockets.push(socket));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const pool = track(createPool({ DB_HOST: '127.0.0.1', DB_PORT: String(server.address().port), DB_CONNECTION_TIMEOUT_MS: '300' }));
      const start = Date.now();
      await expect(pool.query('SELECT 1')).rejects.toThrow();
      expect(Date.now() - start).toBeLessThan(2000);
    } finally {
      sockets.forEach(socket => socket.destroy());
      await new Promise(resolve => server.close(resolve));
    }
  });

  it('não termina o processo com erro de ligação inativa', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pool = track(createPool({}));
    expect(() => pool.emit('error', Object.assign(new Error('password=xyz'), { code: '57P01' }))).not.toThrow();
    expect(JSON.stringify(spy.mock.calls)).toContain('57P01');
    expect(JSON.stringify(spy.mock.calls)).not.toContain('xyz');
  });
});
