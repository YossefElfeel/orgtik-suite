import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const out = import.meta.dirname, root = path.resolve(out, '../../..'), require = createRequire(path.join(root, 'apps/docs/package.json')), { chromium } = require('playwright');
const copy = JSON.parse(fs.readFileSync(path.join(root, 'apps/files/messages/en.json'))).FilesV3;
const report = { checks: [], errors: [], console: [], completed: false };
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Africa/Cairo' }), page = await context.newPage();
page.setDefaultTimeout(60000); page.setDefaultNavigationTimeout(180000);
page.on('pageerror', error => report.errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') report.console.push(message.text()); });
async function api(url, session, body, port = 8200) { const response = await fetch(`http://localhost:${port}${url}`, { method: body ? 'POST' : 'GET', headers: { ...(session ? { Authorization: `Bearer ${session.tokens.accessToken}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); const result = await response.json(); if (!response.ok) throw Error(`${url}: ${response.status} ${JSON.stringify(result)}`); return result.data; }
try {
  await page.goto('http://localhost:4202/en/auth', { waitUntil: 'networkidle' });
  const session = await api('/api/auth/login', null, { email: 'nour.khaled@nilefoods.test', password: 'Local@2026', mode: 'workspace', workspaceId: 'ws_nile', target: 'files' });
  const handoff = await api('/api/auth/handoff', session, { audience: 'tool:files' });
  await page.goto(`http://localhost:4202/en/auth?code=${encodeURIComponent(handoff.code)}`, { waitUntil: 'domcontentloaded' }); await page.waitForURL(url => !url.pathname.endsWith('/auth'));
  await page.getByRole('heading', { name: copy.library, exact: true }).waitFor(); await page.getByRole('searchbox', { name: copy.searchFiles }).waitFor();
  await page.evaluate(() => document.fonts.ready); await page.addStyleTag({ content: 'nextjs-portal{display:none !important}' }); await page.screenshot({ path: path.join(out, 'initial-library.png') });
  report.checks.push({ name: 'One ordinary global notification trigger', pass: await page.getByRole('button', { name: 'Notifications', exact: true }).count() === 1 });
  report.checks.push({ name: 'No presentation navigation', pass: await page.locator('aside a[href*="presentation"]').count() === 0 });
  report.checks.push({ name: 'Visible current library record', pass: await page.locator('tbody tr').count() > 0 });
  report.completed = true;
} catch (error) { report.failure = error.stack; await page.screenshot({ path: path.join(out, 'probe-failure.png') }).catch(() => {}); process.exitCode = 1; }
finally { fs.writeFileSync(path.join(out, 'probe.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report)); await browser.close(); }
