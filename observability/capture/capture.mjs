// Captura o dashboard FinTrack API na janela do último cenário (XOPS-30).
// Uso, a partir da raiz do repositório: node observability/capture/capture.mjs
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const output = 'artifacts/observability';
const grafana = 'http://127.0.0.1:' + (process.env.GRAFANA_PORT || 3001);
const timeline = JSON.parse(readFileSync(output + '/scenario-timeline.json', 'utf8'));
const from = Date.parse(timeline.phases[0].start) - 15000;
const to = Date.parse(timeline.endedAt) + 15000;
const url = `${grafana}/d/fintrack-api/fintrack-api?orgId=1&from=${from}&to=${to}&refresh=&kiosk`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.getByText('API vs PostgreSQL (p95)').first().waitFor({ timeout: 30000 });
  // Com 1400 px de altura todos os painéis ficam visíveis, por isso o Grafana carrega-os todos.
  // Esperar até não haver indicadores de carregamento em duas verificações seguidas (máx. 45 s).
  const loading = '[aria-label*="loading" i], [data-testid*="loading" i], [class*="LoadingIndicator"]';
  let quiet = 0;
  for (const deadline = Date.now() + 45000; quiet < 2 && Date.now() < deadline;) {
    quiet = (await page.locator(loading).count()) === 0 ? quiet + 1 : 0;
    await page.waitForTimeout(1000);
  }
  if (quiet < 2) console.warn('Alguns painéis ainda estavam a carregar ao fim de 45 s; a captura pode estar incompleta.');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: output + '/dashboard.png', fullPage: true });
  try {
    const panel = page.locator('section', { hasText: 'API vs PostgreSQL (p95)' }).last();
    await panel.screenshot({ path: output + '/dashboard-dependencia.png', timeout: 10000 });
  } catch (error) {
    console.warn('Captura do painel API vs PostgreSQL falhou; a página inteira foi guardada.', error.message);
  }
  console.log('Capturas guardadas em', output);
} finally {
  await browser.close();
}
