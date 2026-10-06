// Owner-authorized local CMS delivery. Fixtures stay private and are reset in cleanup.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {auditState} from '../lib/audit-state.mjs';
import {fixtureCall as call} from '../lib/content-fixtures.mjs';
import {tokenFor} from '../lib/session.mjs';
import {AUDITS} from '../lib/suite.mjs';
import {settle,axe} from '../lib/checks.mjs';
const audit=await auditState('roadmap-delivery.mjs');
const out=process.env.AUDIT_OUT ?? path.join(AUDITS,'wm/followup');fs.mkdirSync(out,{recursive:true});const results=[];let browser;
const admin='mona.adel@orgtik.test';const stamp='CMS delivery '+Date.now();let saved;
async function check(name,fn){try{results.push({name,ok:true,note:await fn()});console.log('ok '+name);}catch(error){results.push({name,ok:false,note:error.message});console.log('FAIL '+name+': '+error.message);}}
async function mode(value){const settings=await call(admin,'GET','/admin/settings/site');await call(admin,'PATCH','/admin/settings/site',{formsMode:value},settings.version);}
async function form(page,message){await page.goto('http://localhost:4173/roadmap',{waitUntil:'networkidle'});await settle(page);const form=page.locator('form');await form.locator('button[type=button]').first().click();await form.locator('[name=name]').fill('Delivery check');await form.locator('[name=email]').fill('delivery@example.test');await form.locator('[name=message]').fill(message);return form;}
try{
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 try{
  const page=await context.newPage();
  await check('CMS forms are enabled through the existing dashboard setting',async()=>{
   const settings=await call(admin,'GET','/admin/settings/site');assert.equal(settings.formsMode,'live');
   const site=(await(await fetch('http://localhost:4007/v2/public/site')).json()).data;assert.equal(site.forms.mode,'live');assert.equal(site.forms.privacyVersion,'0.2');return 'Local live delivery; dated privacy version 0.2.';
  });
  await check('submission saves one pending idea and blocks duplicate clicks while sending',async()=>{
   const target=await form(page,stamp+'. A connected CMS suggestion.');let requests=0;
   await page.route('**/v2/public/ideas',async route=>{requests++;await new Promise(resolve=>setTimeout(resolve,2000));await route.continue();});
   const response=page.waitForResponse(response=>response.url().endsWith('/public/ideas')&&response.status()===201);
   const submit=target.locator('[type=submit]');await submit.click();assert(await submit.isDisabled());assert.equal(await submit.getAttribute('aria-busy'),'true');
   await target.evaluate(element=>element.requestSubmit());const result=await(await response).json();saved=result.data.id;
   await page.getByText('Your idea has been sent to our team for review. It will appear on the roadmap only after approval.',{exact:true}).waitFor();assert.equal(requests,1);await page.unroute('**/v2/public/ideas');
   const ideas=await call(admin,'GET','/admin/ideas?status=pending&search='+encodeURIComponent(stamp));assert.equal(ideas.length,1);assert.equal(ideas[0].id,saved);assert.equal(ideas[0].status,'pending');assert.equal(ideas[0].submitter.email,'delivery@example.test');assert.equal(ideas[0].submitter.privacyVersion,'0.2');return {id:saved,status:'pending',requests};
  });
  await check('the submitted idea is visible in the CMS Ideas dashboard',async()=>{
   const wm=await context.newPage();await wm.goto('http://localhost:3007/en/auth?token='+await tokenFor(admin));await wm.getByRole('heading',{level:1}).first().waitFor();await wm.goto('http://localhost:3007/en/marketing/ideas');await wm.getByRole('searchbox',{name:'Search ideas'}).fill(stamp);
   const entry=wm.getByRole('button',{name:stamp+'.',exact:true});await entry.waitFor();await entry.click();await wm.getByText(stamp+'. A connected CMS suggestion.',{exact:true}).last().waitFor();await wm.close();return 'Pending row and the full submitted suggestion rendered in Website Manager.';
  });
  await check('the submitted idea is absent from public lists',async()=>{
   const ideas=(await(await fetch('http://localhost:4007/v2/public/ideas')).json()).data;assert(!ideas.some(idea=>idea.id===saved));return 'No automatic publication or public submitter details.';
  });
  await check('pausing forms in CMS rejects delivery without false success',async()=>{
   await mode('preview');try{const target=await form(page,stamp+' paused.');const response=page.waitForResponse(response=>response.url().endsWith('/public/ideas'));await target.locator('[type=submit]').click();assert.equal((await response).status(),409);await page.getByText("Your message couldn't be sent. Check your connection and try again.").waitFor();assert.equal(await target.locator('[name=message]').inputValue(),stamp+' paused.');assert(await target.locator('[type=submit]').isEnabled());}finally{await mode('live');}return 'CMS pause remains authoritative even when the pulled snapshot was live.';
  });
  await check('delivery failure keeps fields and retry saves a pending idea',async()=>{
   const message=stamp+' retry.';const target=await form(page,message);let attempts=0;await page.route('**/v2/public/ideas',route=>++attempts===1?route.fulfill({status:503,contentType:'application/json',body:'{}'}):route.continue());
   await target.locator('[type=submit]').click();await page.getByText("Your message couldn't be sent. Check your connection and try again.").waitFor();assert.equal(await target.locator('[name=message]').inputValue(),message);assert.equal(await target.locator('[name=email]').inputValue(),'delivery@example.test');assert(await target.locator('[type=submit]').isEnabled());
   const response=page.waitForResponse(response=>response.url().endsWith('/public/ideas')&&response.status()===201);await target.locator('[type=submit]').click();const result=(await(await response).json()).data;assert.equal(result.status,'pending');assert.notEqual(result.id,saved);await page.unroute('**/v2/public/ideas');return '503 handled, inputs preserved, one successful retry with its own ID.';
  });
  await check('concurrent submissions keep distinct IDs and none are overwritten',async()=>{
   const responses=await Promise.all(Array.from({length:8},(_,index)=>fetch('http://localhost:4007/v2/public/ideas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Concurrency check',email:'concurrent@example.test',message:stamp+' concurrent '+index,topic:'A product idea',privacyVersion:'0.2'})})));
   assert(responses.every(response=>response.status===201));const ids=await Promise.all(responses.map(async response=>(await response.json()).data.id));assert.equal(new Set(ids).size,8);const stored=await call(admin,'GET','/admin/ideas?search='+encodeURIComponent(stamp+' concurrent'));assert.equal(stored.length,8);return 'Eight accepted ideas, eight distinct stored IDs.';
  });
 }finally{await context.close();}
 for(const site of ['http://localhost:4173','http://127.0.0.1:4280'])for(const width of [320,390,768,1440])await check(`form note removed and layout fits: ${site} ${width}`,async()=>{
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});try{const page=await context.newPage();await page.goto(site+'/roadmap',{waitUntil:'networkidle'});await settle(page);const target=page.locator('form');await target.scrollIntoViewIfNeeded();assert.equal(await target.getByText('Frontend preview · nothing is sent.',{exact:true}).count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert(await target.getByRole('button',{name:'Submit idea',exact:true}).isVisible());const accessibility=await axe(page);assert.equal(accessibility.critical,0);await page.screenshot({path:path.join(out,`delivery-${site.includes('4173')?'dev':'production'}-${width}.png`)});return {overflow:false,accessibility};}finally{await context.close();}
 });
}finally{await browser?.close();await audit.cleanup();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'roadmap-delivery.json'),JSON.stringify({at:new Date().toISOString(),passed:results.filter(result=>result.ok).length,total:results.length,results},null,2)+'\n');}
console.log(`${results.filter(result=>result.ok).length}/${results.length} CMS delivery checks passed`);if(results.some(result=>!result.ok))process.exitCode=1;
