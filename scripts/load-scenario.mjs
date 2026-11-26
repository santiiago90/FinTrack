// Cenário controlado da XOPS-30: tráfego em fases pelo nginx do staging, com o PostgreSQL congelado numa fase.
// Uso: node scripts/load-scenario.mjs   (staging a correr; ver docs/sprints/sprint-4/README.md)
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fakeExpense, phasesFromEnv, pickRequest, seedCount } from './lib/scenario.mjs';

const origin = 'http://127.0.0.1:' + (process.env.STAGING_PORT || 8080);
const grafana = 'http://127.0.0.1:' + (process.env.GRAFANA_PORT || 3001);
const grafanaAuth = 'Basic ' + Buffer.from((process.env.GRAFANA_USER || 'admin') + ':' + (process.env.GRAFANA_PASSWORD || 'staging_only_password')).toString('base64');
const project = process.env.COMPOSE_PROJECT || 'fintrack-staging';
const output = 'artifacts/observability';
const phases = phasesFromEnv();
const ids = [];
const today = new Date();
const months = [0, 1, 2].map(back => {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - back, 1));
  return d.toISOString().slice(0, 7);
});
const any = list => list[Math.floor(Math.random() * list.length)];

let dbPaused = false;
let aborted = false;
function compose(...args) {
  const result = spawnSync('docker', ['compose', '-p', project, '-f', 'compose.staging.yaml', ...args], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('docker compose ' + args.join(' ') + ' terminou com código ' + result.status);
}
function resumeDb() {
  if (!dbPaused) return;
  compose('unpause', 'db');
  dbPaused = false; // Só depois do sucesso, para uma nova tentativa ainda ser possível.
  console.log('PostgreSQL retomado.');
}
// Ctrl+C ou cancelamento do CI: parar o tráfego, retomar o PostgreSQL e gravar a linha temporal.
// Um segundo sinal força a saída, depois de tentar retomar o PostgreSQL.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (aborted) {
      try { resumeDb(); } finally { process.exit(130); }
    }
    aborted = true;
    console.warn('Interrompido: a terminar a fase atual e a retomar o PostgreSQL...');
  });
}

async function call(path, options = {}) {
  const response = await fetch(origin + path, {
    ...options,
    headers: { 'content-type': 'application/json', ...options.headers },
    signal: AbortSignal.timeout(10000),
  });
  await response.arrayBuffer();
  return response;
}

async function annotate(phase) {
  try {
    const response = await fetch(grafana + '/api/annotations', {
      method: 'POST',
      headers: { authorization: grafanaAuth, 'content-type': 'application/json' },
      body: JSON.stringify({ dashboardUID: 'fintrack-api', time: Date.parse(phase.start), timeEnd: Date.parse(phase.end), tags: ['cenario', phase.name], text: 'Fase ' + phase.name }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.warn('Anotação Grafana recusada para', phase.name, '- HTTP', response.status);
  } catch (error) {
    console.warn('Anotação Grafana indisponível para', phase.name, '-', error.message);
  }
}

async function request(kind) {
  switch (kind) {
    case 'list': return call('/api/expenses?month=' + any(months));
    case 'summary': return call('/api/expenses/summary?month=' + any(months));
    case 'get': return call('/api/expenses/' + (ids.length ? any(ids) : 1));
    case 'create': {
      const response = await fetch(origin + '/api/expenses', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(fakeExpense(ids.length + 1000)), signal: AbortSignal.timeout(10000),
      });
      if (response.status === 201) ids.push((await response.json()).id); else await response.arrayBuffer();
      return response;
    }
    case 'invalid': return call('/api/expenses', { method: 'POST', body: JSON.stringify({ amount: '-1', date: 'ontem', category: '' }) });
    default: throw new Error('Pedido desconhecido: ' + kind);
  }
}

async function seed() {
  const total = seedCount();
  let next = 0, failed = 0;
  await Promise.all(Array.from({ length: 5 }, async () => {
    while (next < total && !aborted) {
      const i = next++;
      try {
        const response = await call('/api/expenses', { method: 'POST', body: JSON.stringify(fakeExpense(i)) });
        if (response.status !== 201) failed++;
      } catch { failed++; }
    }
  }));
  const list = await (await fetch(origin + '/api/expenses', { signal: AbortSignal.timeout(10000) })).json();
  ids.push(...list.map(e => e.id));
  console.log(`Seed: ${total - failed}/${total} despesas fictícias criadas.`);
  if (failed === total) throw new Error('O seed falhou por completo: o staging está a correr?');
}

async function runPhase(phase) {
  const stats = { name: phase.name, start: new Date().toISOString(), requests: 0, failures: 0, status: {} };
  if (phase.pauseDb) {
    dbPaused = true; // Antes do pause: se este for interrompido, o unpause é tentado na mesma.
    compose('pause', 'db');
    console.log('PostgreSQL congelado.');
  }
  try {
    const deadline = Date.now() + phase.seconds * 1000;
    await Promise.all(Array.from({ length: phase.concurrency }, async () => {
      while (Date.now() < deadline && !aborted) {
        try {
          const response = await request(pickRequest(phase.mix));
          stats.requests++;
          stats.status[response.status] = (stats.status[response.status] || 0) + 1;
          if (response.status >= 500) stats.failures++;
        } catch (error) {
          stats.requests++;
          stats.failures++;
          stats.status[error.name] = (stats.status[error.name] || 0) + 1;
        }
      }
    }));
  } finally {
    if (phase.pauseDb) resumeDb();
  }
  stats.end = new Date().toISOString();
  console.log(`Fase ${phase.name}: ${stats.requests} pedidos, ${stats.failures} falhas, estados ${JSON.stringify(stats.status)}`);
  return stats;
}

const timeline = { startedAt: new Date().toISOString(), origin, project, phases: [] };
try {
  await seed();
  for (const phase of phases) {
    if (aborted) break;
    const stats = await runPhase(phase);
    timeline.phases.push(stats);
    await annotate(stats);
  }
} finally {
  resumeDb();
  timeline.endedAt = new Date().toISOString();
  timeline.aborted = aborted;
  mkdirSync(output, { recursive: true });
  writeFileSync(output + '/scenario-timeline.json', JSON.stringify(timeline, null, 2) + '\n');
  console.log('Linha temporal:', output + '/scenario-timeline.json');
}
