// Consulta o Prometheus sobre o cenário e escreve consultas, séries e um resumo por fase (XOPS-30).
import { readFileSync, writeFileSync } from 'node:fs';
import { phaseQueries, rowFromInstant, toMarkdown } from './lib/report.mjs';

const output = 'artifacts/observability';
const prometheus = 'http://127.0.0.1:' + (process.env.PROMETHEUS_PORT || 9090);
const timeline = JSON.parse(readFileSync(output + '/scenario-timeline.json', 'utf8'));
if (!timeline.phases?.length) {
  console.error('A linha temporal não tem fases: o cenário falhou antes de gerar tráfego. Ver o output do load-scenario.');
  process.exit(1);
}
const dashboard = JSON.parse(readFileSync('observability/grafana/dashboards/fintrack-api.json', 'utf8'));
const start = Date.parse(timeline.phases[0].start) / 1000 - 15;
const end = Date.parse(timeline.endedAt) / 1000 + 15;

// Esperar pela última recolha do Prometheus (intervalo de 5 s) depois do fim do cenário.
const wait = Math.max(0, end * 1000 - Date.now()) + 10000;
console.log(`A aguardar ${Math.round(wait / 1000)} s pela última recolha do Prometheus...`);
await new Promise(resolve => setTimeout(resolve, wait));

async function prom(path, params) {
  const body = await (await fetch(prometheus + path + '?' + new URLSearchParams(params), { signal: AbortSignal.timeout(15000) })).json();
  if (body.status !== 'success') throw new Error('Prometheus recusou a consulta: ' + params.query + ' — ' + (body.error || 'sem detalhe'));
  return body.data.result;
}

const phases = [];
for (const phase of timeline.phases) {
  const { seconds, time, exprs } = phaseQueries(phase);
  const results = {};
  for (const [name, expr] of Object.entries(exprs)) results[name] = await prom('/api/v1/query', { query: expr, time: String(time) });
  phases.push({ phase: phase.name, seconds, time: new Date(time * 1000).toISOString(), queries: exprs, results, row: rowFromInstant(phase, results) });
}

const panels = [];
for (const panel of dashboard.panels.filter(p => p.targets)) {
  for (const target of panel.targets) {
    panels.push({ panel: panel.title, legend: target.legendFormat, expr: target.expr,
      result: await prom('/api/v1/query_range', { query: target.expr, start: String(start), end: String(end), step: '5s' }) });
  }
}

const rows = phases.map(p => p.row);
const window = { start: new Date(start * 1000).toISOString(), end: new Date(end * 1000).toISOString(), step: '5s' };
writeFileSync(output + '/scenario-queries.json', JSON.stringify({ prometheus, window, phases, panels }, null, 2) + '\n');
writeFileSync(output + '/scenario-summary.json', JSON.stringify({ generatedAt: new Date().toISOString(), timeline, rows }, null, 2) + '\n');
const table = toMarkdown(rows);
writeFileSync(output + '/scenario-summary.md', `# Resumo do cenário XOPS-30\n\nJanela: ${window.start} → ${window.end}. Cada linha mede só a sua fase (consulta instantânea no fim da fase sobre a duração da fase).\n\n${table}`);
console.log(table);
