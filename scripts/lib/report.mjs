// Resumo por fase do cenário (XOPS-30). Cada fase é medida só na sua própria janela,
// com consultas instantâneas avaliadas no fim da fase sobre [duração da fase].

const API = 'route=~"/api/expenses.*"';

export function phaseQueries(phase) {
  const seconds = Math.max(5, Math.round((Date.parse(phase.end) - Date.parse(phase.start)) / 1000));
  const w = `[${seconds}s]`;
  return {
    seconds,
    time: Date.parse(phase.end) / 1000,
    exprs: {
      rps: `sum(increase(fintrack_http_requests_total{${API}}${w})) / ${seconds}`,
      errorPct: `100 * (sum(increase(fintrack_http_requests_total{route!="/metrics",status_code=~"5.."}${w})) or vector(0)) / clamp_min(sum(increase(fintrack_http_requests_total{route!="/metrics"}${w})), 1e-9)`,
      httpP95: `histogram_quantile(0.95, sum by (le) (increase(fintrack_http_request_duration_seconds_bucket{${API}}${w})))`,
      dbP95: `histogram_quantile(0.95, sum by (le) (increase(fintrack_db_operation_duration_seconds_bucket${w})))`,
      poolWaitingMax: `max_over_time(sum(fintrack_db_pool_connections{state="waiting"})[${seconds}s:5s])`,
      dbErrors: `sum(increase(fintrack_db_operation_errors_total${w})) or vector(0)`,
    },
  };
}

function scalar(result) {
  const value = Number(result?.[0]?.value?.[1]);
  return Number.isFinite(value) ? value : null;
}
const ms = value => (value === null ? null : value * 1000);

export function rowFromInstant(phase, results) {
  return {
    phase: phase.name,
    rps: scalar(results.rps),
    errorPct: scalar(results.errorPct),
    httpP95Ms: ms(scalar(results.httpP95)),
    dbP95Ms: ms(scalar(results.dbP95)),
    poolWaitingMax: scalar(results.poolWaitingMax),
    dbErrors: scalar(results.dbErrors),
  };
}

const fmt = (value, digits) => (value === null || value === undefined ? '—' : value.toFixed(digits));
export function toMarkdown(rows) {
  const header = '| Fase | Pedidos/s | 5xx % | p95 HTTP (ms) | p95 DB (ms) | Pool à espera (máx) | Erros DB (total) |\n|---|---|---|---|---|---|---|';
  const body = rows.map(r => `| ${r.phase} | ${fmt(r.rps, 2)} | ${fmt(r.errorPct, 1)} | ${fmt(r.httpP95Ms, 1)} | ${fmt(r.dbP95Ms, 1)} | ${fmt(r.poolWaitingMax, 0)} | ${fmt(r.dbErrors, 0)} |`);
  return [header, ...body].join('\n') + '\n';
}
