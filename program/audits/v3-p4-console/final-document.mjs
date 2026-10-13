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
  const person = await api('/api/auth/login', 'POST', { email: 'mona.adel@orgtik.test', password: 'Local@2026' }, 'sos', null);
  staff = await api('/api/auth/workspace', 'POST', { mode: 'staff', target: 'admin' }, 'sos', person.tokens.accessToken);
  const invoice = await api('/v1/admin/invoices', 'POST', { workspaceId: 'ws_nile', lines: [{ label: 'Tasks \u00b7 Starter \u2014 native document', amount: 50 }] });
  await api(`/v1/admin/console/billing/invoices/${invoice.id}/action`, 'POST', { action: 'issue' });
  const document = await api(`/v1/admin/console/billing/invoices/${invoice.id}/document`, 'POST', {});
  fs.writeFileSync(path.join(out, 'native-final-invoice.pdf'), Buffer.from(document.content.base64, 'base64'));
  check('New actual document retains native money and issued number', document.invoice.total === 57 && document.invoice.currency === 'EGP' && document.number === document.invoice.number);
  check('Document contains no regulatory submission', document.regulatorySubmission === 'not_submitted');
  report.completed = true;
} finally { fs.writeFileSync(path.join(out, 'final-document.json'), JSON.stringify(report, null, 2)); await browser.close(); }
