import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(out, '../../..'), require = createRequire(path.join(root, 'apps/docs/package.json')), { chromium } = require('playwright');
const report = { scope: 'Native ordinary single-subscription quote/confirm with current server-priced amount', checks: [], errors: [] };
const check = (name, pass, details) => { report.checks.push({ name, pass: Boolean(pass), details }); if (!pass) throw Error(name + ' ' + JSON.stringify(details)); };
let staff;
async function api(endpoint, method = 'GET', body, app = 'admin', session = staff) { const response = await fetch(`http://localhost:${app === 'admin' ? 8608 : 8600}${endpoint}`, { method, headers: { ...(session ? { authorization: `Bearer ${session.tokens.accessToken}` } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000) }); const raw = await response.json(); if (!response.ok) throw Error(endpoint + ' ' + JSON.stringify(raw)); return raw.data; }
const browser = await chromium.launch({ headless: true }), context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await context.newPage(); page.setDefaultTimeout(120000); page.on('pageerror', error => report.errors.push(error.message));
const select = async (label, option) => { await page.getByRole('combobox', { name: label, exact: true }).click(); await page.getByRole('option', { name: option, exact: true }).click(); };
try {
  await fetch('http://localhost:4608/en/auth');
  const person = await api('/api/auth/login', 'POST', { email: 'mona.adel@orgtik.test', password: 'Local@2026' }, 'sos', null); staff = await api('/api/auth/workspace', 'POST', { mode: 'staff', target: 'admin' }, 'sos', person);
  const choices = await api('/v1/admin/console/workspaces/ws_orgtik/lines'), selected = choices.lines.find(line => line.state === 'active' && !line.source?.policy && choices.plans.some(plan => plan.id === line.planId && plan.perUser));
  check('Actual eligible per-user subscription available', Boolean(selected));
  const others = JSON.stringify(choices.lines.filter(line => line.tool !== selected.tool));
  const handoff = await api('/api/auth/handoff', 'POST', { audience: 'staff:admin' }, 'sos');
  await page.goto(`http://localhost:4608/en/auth?code=${encodeURIComponent(handoff.code)}&redirect=/workspaces/ws_orgtik`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Change one subscription', exact: true }).waitFor();
  await select('Tool', `${selected.toolName.en} · ${selected.planName.en}`);
  await select('Billing cycle', selected.cycle === 'monthly' ? 'Yearly' : 'Monthly');
  await page.getByRole('textbox', { name: 'Audit reason', exact: true }).fill('Actual native one-line quote review');
  const previewPending = page.waitForResponse(response => response.url().endsWith(`/v1/admin/console/workspaces/ws_orgtik/lines/${selected.id}/preview`) && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Review server quote', exact: true }).click(); const previewResponse = await previewPending, preview = (await previewResponse.json()).data;
  check('Selected native tool and plan have human-readable names',Boolean(selected.toolName.en && selected.planName.en && selected.planName.en !== selected.planId));
  check('Ordinary preview returns native server quote', previewResponse.ok() && typeof preview.quoteId === 'string');
  check('Quote targets exactly the selected source line', preview.lines.length === 1 && preview.lines[0].replaces === selected.id);
  await page.getByRole('button', { name: 'Confirm mock payment', exact: true }).waitFor();
  const method = choices.paymentMethods.find(row => row.kind === 'card' && row.last4 !== '0002'); await select('Saved payment method', `${method.kind} ${method.last4 || ''}`);
  const confirmPending = page.waitForResponse(response => response.url().endsWith(`/v1/admin/console/workspaces/ws_orgtik/lines/${selected.id}/confirm`) && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Confirm mock payment', exact: true }).click(); const confirmResponse = await confirmPending, result = (await confirmResponse.json()).data;
  check('Ordinary confirm uses the actual native held quote', confirmResponse.ok() && result.lines.length === 1);
  const after = await api('/v1/admin/console/workspaces/ws_orgtik/lines');
  check('Unrelated subscriptions retain exact original records', JSON.stringify(after.lines.filter(line => line.tool !== selected.tool)) === others);
  check('Selected subscription uses the native confirmed cycle', after.lines.find(line => line.tool === selected.tool).cycle !== selected.cycle);
  check('Current recorded invoice amount matches held quote', result.invoice.total === preview.total && result.invoice.currency === preview.currency);
  await page.getByRole('button', { name: 'Confirm mock payment', exact: true }).waitFor({ state: 'hidden' });
  check('No ordinary line-edit runtime errors', !report.errors.length, report.errors); await page.screenshot({ path: path.join(out, 'native-line-confirmed-en-light-1440.png') }); report.completed = true;
} catch (error) { report.failure = error.message; await page.screenshot({ path: path.join(out, 'line-changes-failure.png') }).catch(() => {}); throw error; }
finally { fs.writeFileSync(path.join(out, 'line-changes.json'), JSON.stringify(report, null, 2) + '\n'); await browser.close(); }
console.log(JSON.stringify({ checks: report.checks.length, completed: report.completed }));
