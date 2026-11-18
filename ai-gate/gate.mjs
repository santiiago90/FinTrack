import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const config = JSON.parse(await readFile(new URL('./config.json', import.meta.url), 'utf8'));
const instructions = await readFile(new URL('./prompt.md', import.meta.url), 'utf8');
const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['decision', 'missingCases', 'reason'],
  properties: {
    decision: { type: 'string', enum: ['approve', 'reject'] },
    missingCases: { type: 'array', items: { type: 'string', enum: config.requiredCases } },
    reason: { type: 'string' },
  },
};
const digest = value => createHash('sha256').update(value).digest('hex');

export async function askOpenAI(request, { key = process.env.OPENAI_API_KEY, transport = fetch } = {}) {
  if (!key) throw new Error('OPENAI_API_KEY não configurada.');
  const response = await transport('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  if (!response.ok) throw new Error('API OpenAI: HTTP ' + response.status);
  const body = await response.json();
  if (body.status !== 'completed' || body.model !== request.model || !Array.isArray(body.output)) {
    throw new Error('Resposta incompleta ou versão do modelo inesperada.');
  }
  const output = body.output.filter(item => item.type === 'message' && item.role === 'assistant')
    .flatMap(item => item.content ?? []);
  if (output.length !== 1 || output[0].type !== 'output_text') throw new Error('Resposta sem decisão estruturada.');
  return JSON.parse(output[0].text);
}

export async function evaluate(evidence, ask = askOpenAI) {
  if (!evidence || Object.keys(evidence).sort().join(',') !== 'suitePassed,verifiedCases' ||
      typeof evidence.suitePassed !== 'boolean' || !Array.isArray(evidence.verifiedCases) ||
      evidence.verifiedCases.some(c => !config.requiredCases.includes(c)) ||
      new Set(evidence.verifiedCases).size !== evidence.verifiedCases.length) {
    throw new Error('Evidência inválida: envia apenas os campos e os casos previstos.');
  }
  const required = config.requiredCases;
  const missing = required.filter(c => !evidence.verifiedCases.includes(c)).sort();
  const expected = evidence.suitePassed && !missing.length ? 'approve' : 'reject';
  const request = {
    model: config.model,
    reasoning: { effort: config.reasoningEffort },
    max_output_tokens: config.maxOutputTokens,
    store: false,
    instructions,
    input: JSON.stringify({ suitePassed: evidence.suitePassed, verifiedCases: [...evidence.verifiedCases].sort(), requiredCases: required }),
    text: { format: { type: 'json_schema', name: 'fintrack_quality_gate', strict: true, schema } },
  };
  const results = [];
  for (let i = 0; i < config.repetitions; i++) {
    try {
      const result = await ask(structuredClone(request));
      if (!result || !['approve', 'reject'].includes(result.decision) || !Array.isArray(result.missingCases) ||
          result.missingCases.some(c => !required.includes(c)) ||
          new Set(result.missingCases).size !== result.missingCases.length ||
          typeof result.reason !== 'string' || !result.reason.trim() || result.reason.length > 1000) {
        throw new Error('Decisão fora do contrato.');
      }
      results.push({ decision: result.decision, missingCases: [...result.missingCases].sort(), reason: result.reason });
    } catch (error) {
      results.push({ error: error.message });
    }
  }
  const comparable = result => JSON.stringify([result.decision, result.missingCases]);
  const stable = results.every(r => !r.error) && results.every(r => comparable(r) === comparable(results[0]));
  const matchesPolicy = results.every(r => r.decision === expected && JSON.stringify(r.missingCases) === JSON.stringify(missing));
  return {
    model: config.model, config, promptSha256: digest(instructions),
    inputSha256: digest(request.input), requestSha256: digest(JSON.stringify(request)),
    expected, stable, matchesPolicy, results,
    passed: stable && matchesPolicy && expected === 'approve',
  };
}

async function main() {
  const [inputFile, reportPath = 'artifacts/ai-gate/report.json'] = process.argv.slice(2);
  if (!inputFile) throw new Error('Uso: node ai-gate/gate.mjs <evidência.json> [relatório.json]');
  const evidence = JSON.parse(await readFile(inputFile, 'utf8'));
  const report = await evaluate(evidence);
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify({ source: 'openai-responses', ...report }, null, 2) + '\n');
  console.log('Gate:', report.passed ? 'aprovado' : 'bloqueado', '| decisões estáveis:', report.stable, '| relatório:', reportPath);
  if (!report.passed) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}

