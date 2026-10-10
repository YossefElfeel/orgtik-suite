import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(out, '../../..'), require = createRequire(path.join(root, 'apps/docs/package.json')), { chromium } = require('playwright');
const report = { scope: 'Ordinary Console source checkpoint; owned offset1100 mock runtime', checks: [], captures: [], errors: [] };
const check = (name, pass, details) => { report.checks.push({ name, pass: Boolean(pass), details }); if (!pass) throw Error(name + ' ' + JSON.stringify(details)); };
async function api(endpoint, session, method = 'GET', body, app = 'sos') {
  const response = await fetch(`http://localhost:${app === 'admin' ? 8608 : 8600}${endpoint}`, { method, headers: { ...(session ? { authorization: `Bearer ${session.tokens.accessToken}` } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const raw = await response.json(); if (!response.ok) throw Error(JSON.stringify(raw)); return raw.data;
}
const browser = await chromium.launch({ headless: true }), context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Africa/Cairo' }), page = await context.newPage();
page.setDefaultTimeout(120000); page.on('pageerror', error => report.errors.push(error.message)); page.on('console', message => { if (message.type() === 'error' && /hydration|Maximum update depth|MISSING_MESSAGE|Minified React|uncontrolled.*controlled/i.test(message.text())) report.errors.push(message.text()); });
try {
  await fetch('http://localhost:4608/en/auth');
  const person = await api('/api/auth/login', null, 'POST', { email: 'mona.adel@orgtik.test', password: 'Local@2026' });
  const session = await api('/api/auth/workspace', person, 'POST', { mode: 'staff', target: 'admin' });
  const handoff = await api('/api/auth/handoff', session, 'POST', { audience: 'staff:admin' });
  await page.goto(`http://localhost:4608/en/auth?code=${encodeURIComponent(handoff.code)}&redirect=/billing`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.getByRole('heading', { name: 'Billing operations', exact: true }).waitFor();
  await page.getByRole('table', { name: 'Invoices', exact: true }).locator('tbody tr').first().waitFor();
  check('Actual staff Console landing uses one search and bell', await page.getByRole('button', { name: 'Notifications', exact: true }).count() === 1 && await page.getByRole('button', { name: 'Search your workspace', exact: true }).count() === 1);
  for (const [route, title] of [['/billing', 'Billing operations'], ['/releases', 'Releases and announcements'], ['/ecosystem', 'Connections registry'], ['/staff/security', 'Mock two-step verification'], ['/staff/invitations', 'Staff invitations'], ['/tickets/targets', 'Ticket response targets'], ['/tax/checks', 'Mock tax ID checks'], ['/catalog/software', 'Software catalog'], ['/setup', 'Console setup']]) {
    await page.goto(`http://localhost:4608/en${route}`, { waitUntil: 'domcontentloaded' }); await page.getByRole('heading', { name: title, exact: true }).waitFor();
    await page.getByText('Loading current Console data', { exact: true }).waitFor({ state: 'hidden' });
    check('Ordinary route loaded: ' + route, !/MISSING_MESSAGE|ConsoleV3\./.test(await page.locator('body').innerText()));
    check('Contained page: ' + route, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const issues = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } })).violations.filter(issue => ['critical', 'serious'].includes(issue.impact)).map(issue => ({ id: issue.id, targets: issue.nodes.map(node => node.target) })));
    check('No serious/critical axe: ' + route, !issues.length, issues);
    const name = route.slice(1).replaceAll('/', '-') + '-en-light-1440.png'; await page.screenshot({ path: path.join(out, name) }); report.captures.push(name);
  }
  check('No runtime/catalog errors', report.errors.length === 0, report.errors); report.completed = true;
} catch (error) { report.failure = error.message; await page.screenshot({ path: path.join(out, 'probe-failure.png') }).catch(() => {}); throw error; }
finally { fs.writeFileSync(path.join(out, 'probe.json'), JSON.stringify(report, null, 2) + '\n'); await browser.close(); }
console.log(JSON.stringify({ checks: report.checks.length, captures: report.captures.length, completed: report.completed }));
