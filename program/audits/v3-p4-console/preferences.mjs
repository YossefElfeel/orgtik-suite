import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(out, '../../..'), require = createRequire(path.join(root, 'apps/docs/package.json')), { chromium } = require('playwright');
const report = { scope: 'Actual staff menu before late native preference projection', checks: [], errors: [] };
const check = (name, pass) => { report.checks.push({ name, pass: Boolean(pass) }); if (!pass) throw Error(name); };
async function api(port, endpoint, token, method = 'GET', body) {
  const response = await fetch(`http://localhost:${port}${endpoint}`, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const raw = await response.json(); if (!response.ok) throw Error(JSON.stringify(raw)); return raw.data;
}
const browser = await chromium.launch({ headless: true }), context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await context.newPage();
page.setDefaultTimeout(120000); page.on('pageerror', error => report.errors.push(error.message));
let release; const hold = new Promise(resolve => { release = resolve; }); let patches = 0;
page.on('request', request => { if (request.url().endsWith('/v1/admin/console/preferences') && request.method() === 'PATCH') patches++; });
try {
  const person = await api(8600, '/api/auth/login', null, 'POST', { email: 'mona.adel@orgtik.test', password: 'Local@2026' });
  const staff = await api(8600, '/api/auth/workspace', person.tokens.accessToken, 'POST', { mode: 'staff', target: 'admin' });
  await api(8608, '/v1/admin/console/preferences', staff.tokens.accessToken, 'PATCH', { theme: 'light' });
  const code = await api(8600, '/api/auth/handoff', staff.tokens.accessToken, 'POST', { audience: 'staff:admin' });
  await page.route('**/v1/admin/console/frame', async intercepted => { const response = await intercepted.fetch(); await hold; await intercepted.fulfill({ response }); });
  await page.goto(`http://localhost:4608/en/auth?code=${encodeURIComponent(code.code)}&redirect=/billing`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Billing operations', exact: true, level: 1 }).waitFor();
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  const saved = page.waitForResponse(response => response.url().endsWith('/v1/admin/console/preferences') && response.request().method() === 'PATCH');
  await page.getByRole('menuitemradio', { name: 'Dark', exact: true }).click();
  check('Actual staff menu writes guarded native preference', (await saved).ok());
  release();
  await page.waitForResponse(response => response.url().endsWith('/v1/admin/console/frame'));
  check('Late saved light projection preserves explicit dark menu choice', await page.evaluate(() => document.documentElement.dataset.theme === 'dark'));
  check('Exactly one native staff menu preference write', patches === 1);
  check('Native current staff record stores dark', (await api(8608, '/v1/admin/console/frame', staff.tokens.accessToken)).preferences.theme === 'dark');
  await page.unroute('**/v1/admin/console/frame');
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByRole('heading', { name: 'Billing operations', exact: true, level: 1 }).waitFor();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  check('Fresh ordinary Console reload adopts native dark preference', await page.evaluate(() => document.documentElement.dataset.theme === 'dark'));
  check('No runtime errors', !report.errors.length);
  await page.screenshot({ path: path.join(out, 'native-staff-preferences-en-dark-1440.png') }); report.completed = true;
} catch (error) { report.failure = error.message; release(); await page.screenshot({ path: path.join(out, 'preferences-failure.png') }).catch(() => {}); throw error; }
finally { fs.writeFileSync(path.join(out, 'preferences.json'), JSON.stringify(report, null, 2) + '\n'); await browser.close(); }
console.log(JSON.stringify(report));
