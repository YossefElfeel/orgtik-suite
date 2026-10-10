import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(out, '../../..'), require = createRequire(path.join(root, 'apps/docs/package.json')), { chromium } = require('playwright');
const report = { scope: 'Ordinary native billing and actual account/staff handoffs in owned offset1100 fixture', checks: [], captures: [], errors: [] };
const check = (name, pass, details) => { report.checks.push({ name, pass: Boolean(pass), details }); if (!pass) throw Error(name + ' ' + JSON.stringify(details)); };
async function api(app, endpoint, session, method = 'GET', body, operationId = crypto.randomUUID()) {
  const response = await fetch(`http://localhost:${app === 'admin' ? 8608 : 8600}${endpoint}`, { method, headers: { ...(session ? { authorization: `Bearer ${session.tokens.accessToken}` } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json', 'Idempotency-Key': operationId }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000) });
  const raw = await response.json(); if (!response.ok) throw Error(endpoint + ' ' + JSON.stringify(raw)); return raw.data;
}
async function login(email) { return api('sos', '/api/auth/login', null, 'POST', { email, password: 'Local@2026' }); }
async function enter(page, session, app, redirect) {
  const url = app === 'admin' ? 'http://localhost:4608/en/auth' : 'http://localhost:4600/auth';
  await fetch(url);
  const code = await api('sos', '/api/auth/handoff', session, 'POST', { audience: app === 'admin' ? 'staff:admin' : 'suite' });
  await page.goto(url + `?code=${encodeURIComponent(code.code)}&redirect=${encodeURIComponent(redirect)}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
}
async function select(page, label, option) { await page.getByRole('combobox', { name: label, exact: true }).click(); await page.getByRole('option', { name: option, exact: true }).click(); }
async function mutation(page, endpoint, callback) { const pending = page.waitForResponse(response => response.url().endsWith(endpoint) && ['POST', 'PATCH'].includes(response.request().method())); await callback(); const response = await pending, raw = await response.json(); check('Actual callback ' + endpoint, response.ok(), raw); console.log(endpoint + ' ' + response.status()); return raw.data; }
const browser = await chromium.launch({ headless: true }), context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true }), page = await context.newPage();
page.setDefaultTimeout(120000); page.on('pageerror', error => report.errors.push(error.message));
const capture = async (target, name) => { await target.screenshot({ path: path.join(out, name + '.png') }); report.captures.push(name + '.png'); };
try {
  const mona = await login('mona.adel@orgtik.test'), staff = await api('sos', '/api/auth/workspace', mona, 'POST', { mode: 'staff', target: 'admin' });
  const draft = await api('admin', '/v1/admin/invoices', staff, 'POST', { workspaceId: 'ws_nile', lines: [{ label: 'Actual native owner payment link', amount: 50 }] });
  const invoice = await api('admin', `/v1/admin/console/billing/invoices/${draft.id}/action`, staff, 'POST', { action: 'issue' });
  await enter(page, staff, 'admin', '/billing'); await page.getByRole('heading', { name: 'Billing operations', level: 1, exact: true }).waitFor();
  const link = await api('admin', '/v1/admin/console/billing/pay-links', staff, 'POST', { invoiceId: invoice.id });
  check('Actual invoice owns the created payment link', link.invoiceId === invoice.id && link.workspaceId === 'ws_nile');
  await capture(page, 'native-billing-recovery-controls'); 
  const buyer = await login('nour.khaled@nilefoods.test'), owner = await api('sos', '/api/auth/workspace', buyer, 'POST', { workspaceId: 'ws_nile', target: 'suite' });
  const ownerContext = await browser.newContext({ viewport: { width: 390, height: 1000 } }), ownerPage = await ownerContext.newPage(); ownerPage.setDefaultTimeout(120000); ownerPage.on('pageerror', error => report.errors.push(error.message));
  await enter(ownerPage, owner, 'sos', link.path);
  const account = JSON.parse(fs.readFileSync(path.join(root, 'apps/sos/messages/en.json'), 'utf8')).AccountV3;
  await ownerPage.getByRole('heading', { name: account.paymentLink, level: 1, exact: true }).waitFor();
  const view = await api('sos', `/v1/app/pay-links/${link.id}`, owner), method = view.paymentMethods.find(row => row.kind === 'card' && row.last4 !== '0002');
  await select(ownerPage, account.savedPaymentMethod, `${method.kind} ${method.last4 || ''}`);
  let lost = false; const original = [];
  await ownerPage.route(`**/v1/app/pay-links/${link.id}`, async route => {
    if (route.request().method() === 'POST') { original.push(route.request().postDataJSON()); if (!lost) { lost = true; await route.fetch(); await route.abort('failed'); return; } }
    await route.continue();
  });
  await ownerPage.getByRole('button', { name: account.payCurrentInvoice, exact: true }).click();
  await ownerPage.getByRole('button', { name: account.recoverOriginalPayment, exact: true }).waitFor();
  check('Lost response committed the actual owner invoice once', (await api('admin', '/v1/admin/console/billing', staff)).invoices.find(row => row.id === invoice.id).payments.length === 1);
  await api('admin', '/v1/admin/workspaces/ws_nile/actions', staff, 'POST', { action: 'suspend', reason: 'Native uncertain owner payment access-denial proof' });
  const denied = ownerPage.waitForResponse(response => response.url().endsWith(`/v1/app/pay-links/${link.id}`) && response.request().method() === 'POST');
  await ownerPage.getByRole('button', { name: account.recoverOriginalPayment, exact: true }).click();
  const deniedResponse = await denied; check('Current suspended workspace refuses original receipt first', deniedResponse.status() === 423);
  await capture(ownerPage, 'native-owner-payment-later-denial');
  const pending = await ownerPage.evaluate(() => Object.entries(sessionStorage).filter(([key]) => key.startsWith('orgtik:owner-pay:')).map(([, value]) => JSON.parse(value)));
  check('Uncertain original payment remains recoverable after later access denial', pending.some(value => value.operationId === original[0].operationId));
  await api('admin', '/v1/admin/workspaces/ws_nile/actions', staff, 'POST', { action: 'reactivate', reason: 'Restore owned local fixture after denial proof' });
  await ownerPage.reload({ waitUntil: 'domcontentloaded' });
  await ownerPage.getByRole('button', { name: account.recoverOriginalPayment, exact: true }).click();
  await ownerPage.getByRole('button', { name: account.recoverOriginalPayment, exact: true }).waitFor({ state: 'hidden' });
  check('Restored access replays exactly the original body', original.length === 3 && original.every(value => JSON.stringify(value) === JSON.stringify(original[0])));
  check('Only one charge exists after current denial and original replay', (await api('admin', '/v1/admin/console/billing', staff)).invoices.find(row => row.id === invoice.id).payments.length === 1);
  await capture(ownerPage, 'native-owner-payment-restored'); report.completed = true;
} catch (error) { report.failure = error.message; throw error; }
finally { fs.writeFileSync(path.join(out, 'owner-denial.json'), JSON.stringify(report, null, 2)); await browser.close(); }
