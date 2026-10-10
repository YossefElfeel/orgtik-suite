import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(out, '../../..'), require = createRequire(path.join(root, 'apps/docs/package.json')), { chromium } = require('playwright');
const report = { scope: 'Native ordinary single-subscription quote/confirm with current server-priced amount', checks: [], errors: [] };
const check = (name, pass, details) => { report.checks.push({ name, pass: Boolean(pass), details }); if (!pass) throw Error(name + ' ' + JSON.stringify(details)); };
let staff;
async function api(endpoint, method = 'GET', body, app = 'admin', session = staff) { const response = await fetch(`http://localhost:${app === 'admin' ? 8608 : 8600}${endpoint}`, { method, headers: { ...(session ? { authorization: `Bearer ${session.tokens.accessToken}` } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000) }); const raw = await response.json(); if (!response.ok) throw Error(endpoint + ' ' + JSON.stringify(raw)); return raw.data; }
const browser = await chromium.launch({ headless: true }), context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await context.newPage(); page.setDefaultTimeout(45000); page.on('pageerror', error => report.errors.push(error.message));
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
  await page.getByRole('combobox',{name:'Tool',exact:true}).click();
  console.log('OPTIONS',await page.getByRole('option').allTextContents());
  await page.getByRole('option',{name:`${selected.toolName.en} · ${selected.planName.en}`,exact:true}).waitFor();
  check('Native line selector shows human-readable tool and plan names',true);
  await page.keyboard.press('Escape');await page.screenshot({path:path.join(out,'native-line-friendly-labels.png')});report.completed=true;
} catch (error) { report.failure = error.message; await page.screenshot({ path: path.join(out, 'line-changes-failure.png') }).catch(() => {}); throw error; }
finally { fs.writeFileSync(path.join(out, 'line-labels.json'), JSON.stringify(report, null, 2) + '\n'); await browser.close(); }
console.log(JSON.stringify({ checks: report.checks.length, completed: report.completed }));
