import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const output = 'artifacts/dast';
mkdirSync(output, { recursive: true });
const run = mkdtempSync(join(output, 'run-'));
if (process.platform !== 'win32') chmodSync(run, 0o777); // Volume de relatórios; ZAP usa outro UID no CI.
const results = [];
for (const [name, path] of [['web', '/'], ['api', '/api/expenses']]) {
  const target = 'http://web:8080' + path;
  const json = name + '.json';
  const command = spawnSync('docker', ['compose', '-p', 'fintrack-sprint3', '-f', 'compose.staging.yaml',
    'run', '--rm', '--no-deps', 'zap', 'zap-baseline.py', '-t', target,
    '-m', '1', '-T', '4', '-I', '-J', basename(run) + '/' + json, '-r', basename(run) + '/' + name + '.html'],
    { stdio: 'inherit', timeout: 420000 });
  try {
    if (command.error || ![0, 2].includes(command.status)) throw new Error('ZAP terminou com código ' + command.status);
    const report = JSON.parse(readFileSync(join(run, json), 'utf8'));
    const sites = report.site;
    if (!Array.isArray(sites) || !sites.length || !sites.every(site => Array.isArray(site.alerts)) ||
        !sites.some(site => site['@name'] === 'http://web:8080')) throw new Error('Relatório sem o alvo esperado');
    const alerts = sites.flatMap(site => site.alerts);
    if (alerts.some(alert => !['0', '1', '2', '3'].includes(String(alert.riskcode)))) throw new Error('Relatório com severidade inválida');
    const blocking = alerts.filter(alert => Number(alert.riskcode) >= 2);
    results.push({ target, alerts: alerts.length, blocking: blocking.map(a => ({ id: a.pluginid, name: a.name, risk: a.riskcode })) });
  } catch (error) {
    results.push({ target, error: error.message });
  }
}
writeFileSync(join(run, 'gate.json'), JSON.stringify(results, null, 2) + '\n');
console.log('Relatórios:', run);
if (results.some(r => r.error || r.blocking.length)) process.exitCode = 1;

