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
page.setDefaultTimeout(45000); page.on('pageerror', error => report.errors.push(error.message));
const capture = async (target, name) => { await target.screenshot({ path: path.join(out, name + '.png'), timeout: 15000 }); report.captures.push(name + '.png'); };
try {
  const mona = await login('mona.adel@orgtik.test'), staff = await api('sos', '/api/auth/workspace', mona, 'POST', { mode: 'staff', target: 'admin' });
  await enter(page, staff, 'admin', '/workspaces/ws_nile');
  await page.getByRole('heading', { name: 'Nile Foods', level: 1, exact: true }).waitFor();
  await page.getByRole('button', { name: 'View as owner', exact: true }).click();
  const dialog = page.getByRole('alertdialog'); await dialog.getByRole('textbox').fill('Actual read-only owner view proof');
  const popupPending = page.waitForEvent('popup'); await dialog.getByRole('button', { name: 'Open read-only view', exact: true }).click(); const popup = await popupPending; popup.setDefaultTimeout(10000); popup.on('pageerror', error => {report.errors.push(error.message);console.log('POPUP ERROR',error.message)}); popup.on('console', m => {if(m.type()==='error')console.log('POPUP CONSOLE',m.text())});
  await popup.waitForLoadState('domcontentloaded'); await popup.waitForURL(url => !url.pathname.startsWith('/auth'));
  check('Ordinary View-as opens actual Account rather than a presentation route', popup.url().startsWith('http://localhost:4600/') && !popup.url().includes('/presentation'));
  await popup.getByText('This preview is read-only', { exact: true }).waitFor(); await capture(popup, 'native-owner-view-as');
  check('Source Console remains its original staff view', page.url().includes('/en/workspaces/ws_nile'));
  const exit = popup.waitForResponse(response => response.url().includes('/auth/exit-impersonation') && response.request().method() === 'POST', {timeout:45000}); exit.catch(()=>{});
  await popup.getByRole('button', { name: 'Account', exact: true }).click(); await popup.getByRole('menuitem', { name: 'Stop viewing', exact: true }).click();
  const exitResponse = await exit; const nativeExit=await exitResponse.json(); check('Native View-as exit succeeds', exitResponse.ok());  await popup.getByRole('button',{name:'Account',exact:true}).waitFor();
  await popup.getByText('This preview is read-only', { exact: true }).waitFor({ state: 'hidden' });
  await capture(popup, 'native-owner-view-as-exited'); await popup.close();
  check('No runtime errors in native billing and handoffs', !report.errors.length, report.errors); report.completed = true;
} catch (error) { report.failure = error.message; await capture(page, 'view-as-failure').catch(() => {}); for (const [index, target] of context.pages().entries()) { fs.writeFileSync(path.join(out, `view-as-page-${index}.txt`), target.url()+'\n'+await target.locator('body').innerText({timeout:5000}).catch(() => ''));  await capture(target, `view-as-diagnostic-${index}`).catch(() => {}); } throw error; }
finally { fs.writeFileSync(path.join(out, 'view-as.json'), JSON.stringify(report, null, 2)); await browser.close(); }
