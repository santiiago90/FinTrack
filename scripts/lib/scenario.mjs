// Lógica pura do cenário controlado da XOPS-30 (testada em scenario.test.mjs).

export const CATEGORIES = ['Alimentação', 'Transportes', 'Casa', 'Lazer', 'Saúde', 'Educação'].map(c => 'Cenário ' + c);

const MIX = {
  normal: { list: 35, summary: 20, get: 20, create: 15, invalid: 10 },
  reads: { list: 50, summary: 50 },
};

function positiveInt(env, name, fallback) {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} tem de ser um inteiro positivo (recebido: ${raw}).`);
  return value;
}

export function phasesFromEnv(env = process.env) {
  return [
    { name: 'base', seconds: positiveInt(env, 'SCENARIO_BASE_S', 60), concurrency: 2, mix: MIX.normal },
    { name: 'rajada', seconds: positiveInt(env, 'SCENARIO_BURST_S', 60), concurrency: positiveInt(env, 'SCENARIO_BURST_CONCURRENCY', 60), mix: MIX.reads },
    { name: 'db-indisponivel', seconds: positiveInt(env, 'SCENARIO_OUTAGE_S', 30), concurrency: 2, mix: MIX.normal, pauseDb: true },
    { name: 'recuperacao', seconds: positiveInt(env, 'SCENARIO_RECOVERY_S', 60), concurrency: 2, mix: MIX.normal },
  ];
}

export function seedCount(env = process.env) {
  return positiveInt(env, 'SCENARIO_SEED', 300);
}

export function fakeExpense(i, today = new Date(), random = Math.random) {
  const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  date.setUTCDate(date.getUTCDate() - Math.floor(random() * 90));
  const cents = 200 + Math.floor(random() * 8001);
  return {
    amount: (cents / 100).toFixed(2),
    date: date.toISOString().slice(0, 10),
    category: CATEGORIES[i % CATEGORIES.length],
    description: 'Cenário despesa fictícia ' + (i + 1),
  };
}

export function pickRequest(mix, random = Math.random) {
  const entries = Object.entries(mix);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let point = random() * total;
  for (const [kind, weight] of entries) {
    if (point < weight) return kind;
    point -= weight;
  }
  return entries.at(-1)[0];
}
