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
 await enter(page,staff,'admin','/releases'); await page.getByRole('heading',{name:'Releases and announcements',exact:true}).waitFor();
 check('Actual native publication list starts empty', (await api('admin','/v1/admin/console/releases',staff)).length===0);await page.getByText('No publications yet',{exact:true}).waitFor();await capture(page,'state-native-empty');
 let release;const held=new Promise(resolve=>release=resolve);await page.route('**/v1/admin/console/releases',async route=>{await held;await route.continue()});await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('status',{name:'Loading current Console data',exact:true}).waitFor();check('Ordinary native loading shown while actual request is pending',true);await capture(page,'state-native-loading');const loaded=page.waitForResponse(r=>r.url().endsWith('/v1/admin/console/releases'));release();await loaded;await page.getByRole('status',{name:'Loading current Console data',exact:true}).waitFor({state:'hidden'});await page.unrouteAll({behavior:'wait'});
 await page.route('**/v1/admin/console/releases',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'controlled_qa_outage',message:'Controlled isolated verification outage'}})}));await page.reload({waitUntil:'domcontentloaded'});await page.getByText('This view could not be loaded',{exact:true}).waitFor();check('Controlled request outage shows ordinary retry state',true);await capture(page,'state-native-error');await page.unrouteAll({behavior:'wait'});await page.getByRole('button',{name:'Try again',exact:true}).click();await page.getByText('No publications yet',{exact:true}).waitFor();check('Ordinary retry returns actual owner data',true);await capture(page,'state-native-recovered');
 const supportLogin=await login('rana.saad@orgtik.test'),support=await api('sos','/api/auth/workspace',supportLogin,'POST',{mode:'staff',target:'admin'});await enter(page,support,'admin','/releases');await page.getByRole('heading',{name:'Releases and announcements',exact:true}).waitFor();await page.getByRole('status',{name:'Loading current Console data',exact:true}).waitFor({state:'hidden'});check('Actual support viewer reads with no publication action',await page.getByRole('button',{name:'Publish',exact:true}).count()===0);await capture(page,'state-native-viewer');
 const serviceLogin=await login('laila.mostafa@orgtik.test'),service=await api('sos','/api/auth/workspace',serviceLogin,'POST',{mode:'staff',target:'admin'});await enter(page,service,'admin','/releases');await page.getByText("Your role can't open this",{exact:true}).waitFor();check('Actual current staff role refusal shows permission state',true);await capture(page,'state-native-no-access');
 const anonymous=await browser.newContext({viewport:{width:390,height:900}}),signedOut=await anonymous.newPage();await signedOut.goto('http://localhost:4608/en/releases');await signedOut.getByText("You're signed out",{exact:true}).waitFor();check('Signed-out ordinary entry supplies real sign-in action',true);await capture(signedOut,'state-native-signed-out');check('No runtime errors in ordinary states',!report.errors.length,report.errors);report.completed=true;
} catch(error){report.failure=error.message;await capture(page,'states-failure').catch(()=>{});throw error;}
finally{fs.writeFileSync(path.join(out,'states.json'),JSON.stringify(report,null,2));await browser.close();}
