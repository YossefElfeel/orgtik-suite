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
 const mona=await login('mona.adel@orgtik.test'), staff=await api('sos','/api/auth/workspace',mona,'POST',{mode:'staff',target:'admin'});
 const tools=await api('admin','/v1/admin/tools',staff);check('Actual Console publication remains Live',tools.find(r=>r.key==='chat').status==='live');
 const buyer=await login('nour.khaled@nilefoods.test'), owner=await api('sos','/api/auth/workspace',buyer,'POST',{workspaceId:'ws_nile',target:'suite'});
 const accountContext=await browser.newContext({viewport:{width:390,height:1000}}), accountPage=await accountContext.newPage();accountPage.setDefaultTimeout(120000);accountPage.on('pageerror',error=>report.errors.push(error.message));await enter(accountPage,owner,'sos','/tools');
 await accountPage.getByRole('heading',{name:'Tools and plans',exact:true}).waitFor(); await capture(accountPage,'j20-account-live');
 const ownerTools=await api('sos','/v1/app/tools',owner);fs.writeFileSync(path.join(out,'j20-account-tools.json'),JSON.stringify(ownerTools,null,2));
 const publicResponse=await fetch('http://localhost:8600/v1/public/catalog'), publicData=(await publicResponse.json()).data;const offer=publicData.items.find(row=>row.tool==='chat'||row.id==='chats'||row.id==='chat');
 check('Current public software catalog reflects native Live state',offer?.status==='live',offer);
 const site=await context.newPage();await site.goto('http://localhost:4610/software/chats',{waitUntil:'networkidle'});await capture(site,'j20-website-live');
 fs.writeFileSync(path.join(out,'j20-site-text.txt'),await site.locator('body').innerText());check('Website current adapter loads actual published catalog',await site.evaluate(async()=>{const m=await import('/src/reference/purchase-catalog.js');await m.loadPublicCatalog({force:true});return m.CATALOG.some(r=>r.tool==='chat'||r.id==='chats'||r.id==='chat')}));
 report.completed=true;
} catch(error){report.failure=error.message;await capture(page,'j20-failure').catch(()=>{});for(const [i,c] of browser.contexts().entries())for(const [j,p]of c.pages().entries()){fs.writeFileSync(path.join(out,`j20-diagnostic-${i}-${j}.txt`),p.url()+'\n'+await p.locator('body').innerText({timeout:5000}).catch(()=>''));await capture(p,`j20-diagnostic-${i}-${j}`).catch(()=>{})}throw error;}
finally{fs.writeFileSync(path.join(out,'j20.json'),JSON.stringify(report,null,2));await browser.close();}
