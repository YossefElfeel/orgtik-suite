import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(out, '../../..'), require = createRequire(path.join(root, 'apps/docs/package.json')), { chromium } = require('playwright');
const report = { scope: 'Actual ordinary Console callbacks, retained records and response recovery', checks: [], captures: [], errors: [] };
const check = (name, pass, details) => { report.checks.push({ name, pass: Boolean(pass), details }); if (!pass) throw Error(name + ' ' + JSON.stringify(details)); };
let staff, tasksName; const releaseTitle = 'Native Console v3 proof ' + process.pid;
async function api(endpoint, method = 'GET', body, app = 'admin', token = staff?.tokens.accessToken) {
  const response = await fetch(`http://localhost:${app === 'admin' ? 8608 : 8600}${endpoint}`, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const raw = await response.json(); if (!response.ok) throw Error(JSON.stringify(raw)); return raw.data;
}
const browser = await chromium.launch({ headless: true }), context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Africa/Cairo', acceptDownloads: true }), page = await context.newPage();
page.setDefaultTimeout(120000); page.on('pageerror', error => report.errors.push(error.message));
async function route(url, title) { await page.goto(`http://localhost:4608/en${url}`, { waitUntil: 'domcontentloaded' }); await page.getByRole('heading', { name: title, exact: true, level: 1 }).waitFor(); await page.getByText('Loading current Console data', { exact: true }).waitFor({ state: 'hidden' }); }
async function select(label, option) { await page.getByRole('combobox', { name: label, exact: true }).click(); await page.getByRole('option', { name: option, exact: true }).click(); }
async function mutation(endpoint, callback) { const response = page.waitForResponse(r => r.url().endsWith('/v1/admin/console' + endpoint) && ['POST', 'PATCH'].includes(r.request().method())); await callback(); const result = await response; const json = await result.json(); check('Native callback ' + endpoint, result.ok(), json); return json.data; }
async function capture(name) { await page.screenshot({ path: path.join(out, name + '.png') }); report.captures.push(name + '.png'); }
try {
  await fetch('http://localhost:4608/en/auth');
  const person = await api('/api/auth/login', 'POST', { email: 'mona.adel@orgtik.test', password: 'Local@2026' }, 'sos', null);
  staff = await api('/api/auth/workspace', 'POST', { mode: 'staff', target: 'admin' }, 'sos', person.tokens.accessToken);
  tasksName = (await api('/v1/admin/tools')).find(tool => tool.key === 'tasks').name.en;
  const handoff = await api('/api/auth/handoff', 'POST', { audience: 'staff:admin' }, 'sos');
  await page.goto(`http://localhost:4608/en/auth?code=${encodeURIComponent(handoff.code)}&redirect=/releases`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.getByRole('heading', { name: 'Releases and announcements', exact: true }).waitFor();
  await select('Tool', tasksName);
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill(releaseTitle);
  await page.getByRole('textbox', { name: 'Publication text', exact: true }).fill('Saved from the ordinary Console release form.');
  await page.getByRole('textbox', { name: 'Version', exact: true }).fill('v3-proof');
  const release = await mutation('/releases', () => page.getByRole('button', { name: 'Publish', exact: true }).click());
  await page.getByRole('table').getByText(releaseTitle, { exact: true }).waitFor();
  check('Release persisted on actual owner list', (await api('/v1/admin/console/releases')).some(row => row.id === release.id));
  await capture('flow-release');
  await route('/staff/security', 'Mock two-step verification');
  if (await page.getByRole('textbox', { name: 'Verification code', exact: true }).count()) {
    await page.getByRole('textbox', { name: 'Verification code', exact: true }).fill('246810');
    await mutation('/staff/security', () => page.getByRole('button', { name: 'Enable mock verification', exact: true }).click());
  }
  check('Native staff mock verification preference persisted', (await api('/v1/admin/console/staff/security')).enabled);
  await capture('flow-staff-verification');
  await route('/setup', 'Console setup');
  const setupTitles = { catalog: 'Review tools and plans', pricing: 'Review pricing and currencies', security: 'Review staff verification', billing: 'Review billing operations' };
  for (const step of (await api('/v1/admin/console/setup')).filter(row => row.ready && !row.complete)) {
    const row = page.locator('li').filter({ has: page.getByRole('link', { name: setupTitles[step.id], exact: true }) }).filter({ has: page.getByRole('button', { name: 'Mark reviewed', exact: true }) });
    await mutation('/setup/review', () => row.getByRole('button', { name: 'Mark reviewed', exact: true }).click());
    await row.waitFor({ state: 'hidden' });
  }
  check('Current-person ready setup reviews persisted', (await api('/v1/admin/console/setup')).filter(row => row.ready).every(row => row.complete));
  await capture('flow-setup');
  await route('/tickets/targets', 'Ticket response targets');
  const tickets = await api('/v1/admin/console/tickets/sla'), ticket = tickets[0];
  await select('Support', `${ticket.number} · ${ticket.subject}`);
  await page.getByRole('spinbutton', { name: 'Response time in minutes', exact: true }).fill('90');
  await mutation(`/tickets/${ticket.ticketId}/sla`, () => page.getByRole('button', { name: 'Save response target', exact: true }).click());
  check('Actual ticket response target persisted', (await api('/v1/admin/console/tickets/sla')).find(row => row.ticketId === ticket.ticketId).policy.minutes === 90);
  await capture('flow-ticket-target');
  await route('/tax/checks', 'Mock tax ID checks');
  await select('Workspace', 'Nile Foods');
  await page.getByRole('textbox', { name: 'Tax ID', exact: true }).fill('CH-DEMO-001');
  const tax = await mutation('/tax/verify', () => page.getByRole('button', { name: 'Run mock check', exact: true }).click());
  check('Mock tax sample visibly accepted without submission', tax.state === 'accepted_mock' && tax.submitted === false);
  await page.getByRole('table').getByText('CH-DEMO-001', { exact: true }).waitFor();
  await capture('flow-tax-check');
  await route('/catalog/software?offer=tasks', 'Software catalog');
  const nativeNames = { en: 'English', ar: 'العربية', de: 'Deutsch', fr: 'Français', it: 'Italiano' };
  const original = (await api('/v1/admin/console/software-catalog')).offers.find(row => row.id === 'tasks');
  for (const [key, label] of [['name', 'Name'], ['description', 'Description'], ['capabilities', 'Capabilities, one per line']]) {
    const group = page.getByRole('group', { name: label, exact: true });
    for (const [locale, nativeName] of Object.entries(nativeNames)) {
      await group.getByRole('tab', { name: new RegExp(nativeName) }).click();
      await group.getByRole('textbox', { name: `${label} (${nativeName})`, exact: true }).fill(key === 'name' ? original.name[locale] : key === 'description' ? `Native Tasks catalog description (${locale})` : `Native Tasks capability (${locale})`);
    }
  }
  await mutation('/software-catalog/tasks', () => page.getByRole('button', { name: 'Publish', exact: true }).click());
  const published = (await api('/v1/admin/console/software-catalog')).offers.find(row => row.id === 'tasks');
  check('Five-language software metadata published on actual offer', published.publishedAt && Object.keys(nativeNames).every(locale => published.description[locale].endsWith(`(${locale})`) && published.capabilities[locale].length === 1));
  await capture('flow-software-publish');
  await route('/billing', 'Billing operations');
  await page.getByRole('textbox', { name: 'Billing country code', exact: true }).fill('EG');
  await page.getByRole('textbox', { name: 'Series prefix', exact: true }).fill('QA');
  await page.getByRole('spinbutton', { name: 'Next document number', exact: true }).fill('7000');
  await mutation('/billing/series', () => page.getByRole('button', { name: 'Save series', exact: true }).click());
  const billing = await api('/v1/admin/console/billing'), paid = billing.invoices.find(row => row.state === 'paid');
  await page.getByRole('button', { name: paid.number, exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await mutation(`/billing/invoices/${paid.id}/document`, () => page.getByRole('button', { name: 'Record invoice document', exact: true }).click());
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const download = await downloadPromise; await download.saveAs(path.join(out, 'native-invoice.pdf'));
  const bytes = fs.readFileSync(path.join(out, 'native-invoice.pdf'));
  check('Actual ordinary invoice downloads PDF bytes', bytes.subarray(0, 5).toString() === '%PDF-' && bytes.length > 1000);
  await capture('flow-invoice-document');
  await page.keyboard.press('Escape');
  const csvPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export accounting CSV', exact: true }).click();
  const csv = await csvPromise; await csv.saveAs(path.join(out, 'native-accounting.csv'));
  check('Ordinary accounting export includes actual financial records', fs.readFileSync(path.join(out, 'native-accounting.csv'), 'utf8').includes('credit_note'));
  const before = (await api('/v1/admin/console/releases')).length;
  await route('/releases', 'Releases and announcements'); await select('Tool', tasksName);
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Recovered native release');
  await page.getByRole('textbox', { name: 'Publication text', exact: true }).fill('Original command retained after committed response loss.');
  let lost = false;
  await page.route('**/v1/admin/console/releases', async intercepted => {
    if (!lost && intercepted.request().method() === 'POST') { lost = true; await intercepted.fetch(); await intercepted.abort('failed'); } else await intercepted.continue();
  });
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('region', { name: 'Actions awaiting recovery', exact: true }).waitFor();
  check('Lost response committed exactly one owner publication', (await api('/v1/admin/console/releases')).length === before + 1);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Recover action', exact: true }).click();
  await page.getByRole('region', { name: 'Actions awaiting recovery', exact: true }).waitFor({ state: 'hidden' });
  check('Reload recovery reuses command without second publication', (await api('/v1/admin/console/releases')).length === before + 1);
  await capture('flow-command-recovery');
  check('No runtime errors in ordinary native callbacks', report.errors.length === 0, report.errors);
  report.completed = true;
} catch (error) { report.failure = error.message; await capture('native-flow-failure').catch(() => {}); throw error; }
finally { fs.writeFileSync(path.join(out, 'native-flows.json'), JSON.stringify(report, null, 2) + '\n'); await browser.close(); }
console.log(JSON.stringify({ checks: report.checks.length, captures: report.captures.length, completed: report.completed }));
