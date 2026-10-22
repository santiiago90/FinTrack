import { readFileSync } from 'node:fs';
const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const findings = report.results.filter(result => result.extra.severity === 'ERROR');
if (findings.length || report.errors.length) {
  console.error('Gate SAST falhou:', findings.length, 'deteções ERROR;', report.errors.length, 'erros de análise.');
  process.exitCode = 1;
} else {
  console.log('Gate SAST aprovado: sem deteções ERROR e sem erros de análise.');
}
