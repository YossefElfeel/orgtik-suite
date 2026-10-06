// Follow-up regressions use only isolated local mocks, and restore the exact pre-run files.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {auditState} from '../lib/audit-state.mjs';
import {mock} from '../lib/mock.mjs';
import {fixtureCall as call} from '../lib/content-fixtures.mjs';
import {tokenFor} from '../lib/session.mjs';
import {AUDITS, WORKSPACE, webUrl, apiUrl} from '../lib/suite.mjs';
import {axe, settle} from '../lib/checks.mjs';
const audit=await auditState('wm-followup.mjs');
const APP=path.join(WORKSPACE,'orgtik-website/landing-directions');
const WM=webUrl('wm'), SITE='http://localhost:4173', API=apiUrl('wm')+'/v2';
const OUT=process.env.AUDIT_OUT ?? path.join(AUDITS,'wm/followup');fs.mkdirSync(OUT,{recursive:true});
const editor='hoda.ashraf@orgtik.test', approver='karim.hassan@orgtik.test', admin='mona.adel@orgtik.test';
const onlyAt=process.argv.indexOf('--only'), only=onlyAt>=0?process.argv[onlyAt+1]:null;
const prior=only&&fs.existsSync(path.join(OUT,'regressions.json'))?JSON.parse(fs.readFileSync(path.join(OUT,'regressions.json'),'utf8')):null;
const results=prior?prior.results.map(r=>({...r,checkedAt:r.checkedAt??prior.at})):[];let browser;
async function check(name,fn){if(only&&!(only==='narrative'?name.includes(only):name.startsWith(only)))return;let result;try{const note=await fn();result={name,ok:true,note};console.log('ok '+name);}catch(e){result={name,ok:false,note:e.message};console.log('FAIL '+name+': '+e.message.split('\n')[0]);}result.checkedAt=new Date().toISOString();const old=results.findIndex(r=>r.name===name);if(old>=0)results[old]=result;else results.push(result);}
const pull=()=>execFileSync(process.execPath,['scripts/content-pull.mjs'],{cwd:APP,encoding:'utf8'});
async function as(email,locale='en',theme='light',width=1440){
 const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
 await ctx.addCookies([{name:'ot-theme',value:theme,url:WM}]);
 const page=await ctx.newPage();await page.goto(`${WM}/${locale}/auth?token=${await tokenFor(email)}`);
 await page.getByRole('heading',{level:1}).first().waitFor();return {ctx,page};
}
async function raw(email,method,p,body,version){const r=await fetch(API+p,{method,headers:{authorization:`Bearer ${await tokenFor(email)}`,'content-type':'application/json',...(version!=null?{'if-match':String(version)}:{})},body:JSON.stringify(body)});return {status:r.status,...await r.json()};}
try{
 await mock.realClock();await mock.reset();browser=await chromium.launch();
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const page=await ctx.newPage();
 await page.goto(SITE+'/roadmap',{waitUntil:'networkidle'});
 await check('six milestone and seven moderated idea examples; three pending examples private',async()=>{
  const seed=JSON.parse(fs.readFileSync(path.join(WORKSPACE,'local-dev/apps/wm/seed/website.json')));
  const rm=seed.entries.filter(e=>e.type==='roadmapItem');assert.equal(rm.length,6);
  const ideas=(await(await fetch(API+'/public/ideas')).json()).data;assert.equal(ideas.length,7);
  assert.equal(seed.ideas.filter(i=>i.status==='pending').length,3);
  const text=await page.locator('body').innerText();assert.match(text,/updates, votes, and comment counts are examples/);
  for(const idea of seed.ideas.filter(i=>i.status==='pending'))assert(!text.includes(idea.title));
  return {milestones:rm.length,publicIdeas:ideas.length,pending:3};
 });
 await check('timeline period, theme, year, search and empty-state reset',async()=>{
  for(const period of ['Past','Now','Next']){await page.getByRole('button',{name:new RegExp('^'+period+'\\s+2$')}).click();assert.equal(await page.locator('[aria-pressed="true"]').filter({hasText:period}).count(),1);}
  await page.getByRole('button',{name:/^All\s+6$/}).click();
  const select=page.locator('select').first();const opts=await select.locator('option').allTextContents();assert(opts.length>1);
  await select.selectOption({label:opts[1].trim()});await select.selectOption('All themes');
  for(const year of ['2025','2026','2027']){const b=page.getByRole('button',{name:new RegExp('^'+year+'\\s')});await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');}
  await page.getByPlaceholder('Search milestones').fill('no-such-milestone-qa');
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();assert.equal(await page.getByPlaceholder('Search milestones').inputValue(),'');
  await page.getByPlaceholder('Search suggestions').fill('no-such-idea-qa');assert.equal(await page.getByRole('button',{name:/^Vote for /}).count(),0);
  await page.getByPlaceholder('Search suggestions').fill('');return 'All timeline controls and both empty states work.';
 });
 await check('details dialog traps focus, closes with Escape and returns focus',async()=>{
  const opener=page.getByRole('button',{name:/comments$/}).first();await opener.click();const dialog=page.getByRole('dialog');await dialog.waitFor();
  const focusables=dialog.locator('button, a[href], input, select, textarea, [tabindex="0"]');await focusables.last().focus();await page.keyboard.press('Tab');
  assert(await focusables.first().evaluate(el=>el===document.activeElement));await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert(await opener.evaluate(el=>el===document.activeElement));return 'Dialog focus wraps and returns to the triggering card.';
 });
 await check('votes toggle locally and reset on reload without network writes',async()=>{
  let writes=0;const listener=r=>{if(r.method()==='POST')writes++;};page.on('request',listener);
  const vote=page.getByRole('button',{name:/^Vote for /}).first();const name=await vote.getAttribute('aria-label');const n=Number((await vote.innerText()).trim());await vote.click();
  const toggled=page.getByRole('button',{name:name.replace('Vote for ','Remove vote from ')});assert.equal(Number((await toggled.innerText()).trim()),n+1);
  await toggled.click();assert.equal(Number((await page.getByRole('button',{name,exact:true}).innerText()).trim()),n);
  await page.getByRole('button',{name,exact:true}).click();await page.reload({waitUntil:'networkidle'});assert.equal(Number((await page.getByRole('button',{name,exact:true}).innerText()).trim()),n);
  page.off('request',listener);assert.equal(writes,0);return 'Toggle, untoggle, reload reset; zero POSTs.';
 });
 await check('idea form validates topic and email without sending',async()=>{
  const form=page.locator('form');await form.locator('[name=name]').fill('Follow-up');await form.locator('[name=email]').fill('followup@example.test');await form.locator('[name=message]').fill('A roadmap regression suggestion.');
  await form.locator('[type=submit]').click();await page.getByText('Choose what we should discuss.').waitFor();
  await form.locator('button[type=button]').first().click();await form.locator('[name=email]').fill('invalid');await form.locator('[type=submit]').click();assert.equal(await form.locator('[name=email]').evaluate(el=>el.validity.valid),false);return 'Topic and native email validation enforced.';
 });
 await check('submission failure preserves fields; retry creates a private pending idea',async()=>{
  await fetch(API+'/__mock/forms-live',{method:'POST'});pull();await page.goto(SITE+'/roadmap',{waitUntil:'networkidle'});
  const form=page.locator('form');await form.locator('button[type=button]').first().click();await form.locator('[name=name]').fill('Follow-up');await form.locator('[name=email]').fill('followup@example.test');await form.locator('[name=message]').fill('Follow-up failure retry regression.');
  let tries=0;await page.route('**/v2/public/ideas',route=>++tries===1?route.fulfill({status:503,contentType:'application/json',body:'{"error":{"code":"unavailable"}}'}):route.continue());
  await form.locator('[type=submit]').click();await page.getByText("Your message couldn't be sent. Check your connection and try again.").waitFor();assert.equal(await form.locator('[name=message]').inputValue(),'Follow-up failure retry regression.');
  const sent=page.waitForResponse(r=>r.url().endsWith('/public/ideas')&&r.status()===201);await form.locator('[type=submit]').click();await sent;
  const ideas=await call(admin,'GET','/admin/ideas?status=pending&search=Follow-up');assert.equal(ideas.length,1);
  const pub=(await(await fetch(API+'/public/ideas')).json()).data;assert(!pub.some(i=>i.id===ideas[0].id));await page.unroute('**/v2/public/ideas');return '503 handled; second attempt succeeded and remained pending/private.';
 });
 await check('moderation keeps pending, declined, merged and hidden ideas outside public lists',async()=>{
  const pending=await call(admin,'GET','/admin/ideas?status=pending');const publicBefore=(await(await fetch(API+'/public/ideas')).json()).data;
  for(const [index,action] of ['decline','merge','hide'].entries()){const idea=pending[index];await call(admin,'POST',`/admin/ideas/${idea.id}/moderate`,{action,reason:'Local moderation regression',into:publicBefore[0].id},idea.version);}
  const publicAfter=(await(await fetch(API+'/public/ideas')).json()).data;assert.equal(publicAfter.length,publicBefore.length);assert(!publicAfter.some(i=>pending.some(p=>p.id===i.id)));return 'All four private moderation states remain excluded.';
 });
 await check('Sign-up metadata, restored projects and legacy aliases, sitemap, robots and 404s',async()=>{
  const signup=await call(admin,'GET','/admin/entries/page/pg_signUp');assert.deepEqual(signup.content.layout,[]);assert.equal(signup.content.seo.en.robots,'noindex');assert.equal(signup.content.seo.en.inSitemap,false);
  const origin='http://127.0.0.1:4280';const html=await(await fetch(origin+'/sign-up')).text();assert.match(html,/name="robots"[^>]*noindex/);
  for(const slug of ['connected-platform-concept','managed-digital-presence','campaign-growth-system','support-continuity-system']){assert.equal((await fetch(`${origin}/work/${slug}`)).status,200);const r=await fetch(`${origin}/projects/${slug}`,{redirect:'manual'});assert([301,308].includes(r.status));assert.equal(r.headers.get('location'),'/work/'+slug);}
  const sitemap=await(await fetch(origin+'/sitemap.xml')).text();assert(!sitemap.includes('/sign-up'));const unknown=await fetch(origin+'/work/no-such-project');assert.equal(unknown.status,404);assert.match(await unknown.text(),/noindex/);
  assert.equal((await fetch(origin+'/ar/sign-up')).status,404);assert.match(await(await fetch(origin+'/robots.txt')).text(),/Disallow: \//);return 'Shared Sign-in body, metadata-only Sign-up, permanent redirects, English-only build and noindex 404s verified.';
 });
 await mock.reset();audit.restoreFiles();
 const h=await as(editor);
 for(const [department,label] of Object.entries({design:'Design',development:'Development',hosting:'Hosting','digital-marketing':'Digital marketing','it-support':'IT support'}))await check('empty filtered list creates blank '+department+' case',async()=>{
  await h.page.goto(WM+'/en/content/work',{waitUntil:'networkidle'});await h.page.getByRole('searchbox').fill('nonexistent-followup-case');await h.page.getByText('No case studies match').waitFor();
  await h.page.getByRole('button',{name:'New case study'}).click();const d=h.page.getByRole('dialog');await d.getByLabel('Name',{exact:true}).fill('Blank '+department);
  await d.getByRole('combobox',{name:'Department',exact:true}).click();await h.page.getByRole('option',{name:label,exact:true}).click();await d.getByRole('button',{name:'Create',exact:true}).click();await h.page.waitForURL(/\/content\/work\/cs_\d+/);
  const e=await call(editor,'GET','/admin/entries/caseStudy/'+h.page.url().split('/').pop());assert.equal(e.department,department);assert.equal(e.content.narrativePublished,false);assert.equal(e.content.locales.en.approach.intro,'');assert.equal(e.live,null);return e.id;
 });
 await check('blank article and roadmap creation survives an empty filtered list',async()=>{
  for(const [route,label] of [['insights','article'],['roadmap','roadmap item']]){await h.page.goto(`${WM}/en/content/${route}`,{waitUntil:'networkidle'});await h.page.getByRole('searchbox').fill('nonexistent-followup');
   await h.page.getByRole('button',{name:'New '+label,exact:true}).click();const d=h.page.getByRole('dialog');await d.getByLabel('Name',{exact:true}).fill('Blank followup '+label);await d.getByRole('button',{name:'Create',exact:true}).click();await h.page.waitForURL(new RegExp('/content/'+route+'/'));}
  return 'Both blank types can be created with no available templates.';
 });
 await check('explicit template copying retains department and starts with a disabled sample narrative',async()=>{
  await h.page.goto(WM+'/en/content/work',{waitUntil:'networkidle'});await h.page.getByRole('searchbox').fill('');await h.page.getByRole('button',{name:'New case study'}).click();const d=h.page.getByRole('dialog');
  await d.getByLabel('Name',{exact:true}).fill('Copied UI case');await d.getByRole('combobox',{name:'Start from',exact:true}).click();await h.page.getByRole('option',{name:'OrgTik identity system',exact:true}).click();assert.equal(await d.getByRole('combobox',{name:'Department',exact:true}).count(),0);
  await d.getByRole('button',{name:'Create',exact:true}).click();await h.page.waitForURL(/\/content\/work\/cs_\d+/);const e=await call(editor,'GET','/admin/entries/caseStudy/'+h.page.url().split('/').pop());assert.equal(e.department,'design');assert.equal(e.content.narrativePublished,false);assert.equal(e.content.provenance.figures,'sample');return e.id;
 });
 let e=await call(editor,'POST','/admin/entries/caseStudy',{name:'Narrative regression',slug:'narrative-regression',from:'cs_01'});
 e=await call(editor,'PATCH','/admin/entries/caseStudy/'+e.id,{locale:'en',fields:{...e.content.locales.en,name:'Narrative regression',challenge:'Confirmed narrative regression challenge.'}},e.version);
 const id=e.id;
 await check('editor narrative control is disabled with a permission explanation',async()=>{
  await h.page.goto(WM+'/en/content/work/'+id,{waitUntil:'networkidle'});assert(await h.page.getByRole('switch',{name:'Public case-study narrative'}).isDisabled());assert(await h.page.getByText('Only a content approver may enable or disable the narrative.').isVisible());return 'Editor cannot change narrative publication.';
 });
 const k=await as(approver);
 await check('approver must confirm figures before enabling the narrative',async()=>{
  await k.page.goto(WM+'/en/content/work/'+id,{waitUntil:'networkidle'});assert(await k.page.getByRole('switch',{name:'Public case-study narrative'}).isDisabled());
  e=await call(approver,'POST',`/admin/entries/caseStudy/${id}/approve-figures`,{},e.version);await k.page.reload({waitUntil:'networkidle'});
  const control=k.page.getByRole('switch',{name:'Public case-study narrative'});assert(!await control.isDisabled());await control.click();await k.page.getByRole('button',{name:'Save draft',exact:true}).first().click();await k.page.getByText('Draft saved').first().waitFor();
  e=await call(approver,'GET','/admin/entries/caseStudy/'+id);assert.equal(e.content.narrativePublished,true);return 'Approved figures unlock the approver switch; enabled draft saved.';
 });
 await check('eligible narrative renders in all Website Manager preview frames',async()=>{
  await k.page.goto(`${WM}/en/preview?path=%2Fwork%2Fnarrative-regression`,{waitUntil:'networkidle'});
  for(const key of ['phone','tablet','desktop'])await k.page.frameLocator(`iframe[title=${key}]`).getByText('Confirmed narrative regression challenge.',{exact:true}).waitFor({timeout:30000});return 'Approved enabled narrative appears in three draft preview widths.';
 });
 await check('figure edits revoke draft approval while leaving the published narrative intact',async()=>{
  e=await call(approver,'POST',`/admin/entries/caseStudy/${id}/transitions`,{action:'submit'},e.version);e=await call(admin,'POST',`/admin/entries/caseStudy/${id}/transitions`,{action:'approve'},e.version);e=await call(admin,'POST',`/admin/entries/caseStudy/${id}/transitions`,{action:'publish'},e.version);
  assert.equal(e.live.narrativePublished,true);const live=JSON.stringify(e.live);e=await call(editor,'PATCH',`/admin/entries/caseStudy/${id}`,{locale:'en',fields:{highlight:{value:'Changed figure',label:'Regression'}}},e.version);
  assert.equal(e.content.narrativePublished,false);assert.equal(e.content.provenance.figures,'sample');assert.equal(JSON.stringify(e.live),live);return 'Draft disabled; previous approved published content remains identical.';
 });
 await check('CMS payment messages and shared header resolve after preview overrides',async()=>{
  const templates=(await import(pathToFileURL(path.join(APP,'src/content/strings-templates.js')))).default;
  const patches={};for(const [key,value] of [['purchase-payment:1','CMS card method'],['purchase-payment:2','CMS card description']]){const [id,section,slot]=templates[key].k.split('|');patches[id]??={};patches[id][section]??={};patches[id][section][slot]=value;}
  const cardErr=Object.values(templates).find(t=>t.seed==='Enter one of the example test card numbers.');assert(cardErr);const [sid,ssec,sslot]=cardErr.k.split('|');patches[sid]??={};patches[sid][ssec]??={};patches[sid][ssec][sslot]='CMS card validation';
  for(const [id,fields] of Object.entries(patches)){const entry=await call(editor,'GET','/admin/entries/strings/'+id);await call(editor,'PATCH','/admin/entries/strings/'+id,{locale:'en',fields},entry.version);}
  const header=await call(editor,'GET','/admin/entries/global/gl_header');await call(editor,'PATCH','/admin/entries/global/gl_header',{locale:'en',fields:{header:{...header.content.locales.en.header,a:'CMS home navigation'}}},header.version);
  const {groupFromIds}=await import(pathToFileURL(path.join(APP,'src/reference/purchase-catalog.js')));const group=groupFromIds('software',['hr'],3);
  await k.ctx.addInitScript(group=>{if(location.origin==='http://localhost:4173')localStorage.setItem('orgtik.cart.v2',JSON.stringify({version:2,groups:[group],messages:[]}));},group);
  await k.page.goto(`${WM}/en/preview?path=%2Fcheckout`,{waitUntil:'networkidle'});const frame=k.page.frameLocator('iframe[title=desktop]');await frame.getByRole('radio',{name:/CMS card method/}).waitFor({timeout:30000});await frame.getByRole('radio',{name:/CMS card method/}).check();
  await frame.getByText('CMS card description',{exact:true}).waitFor();await frame.getByText('CMS home navigation',{exact:true}).first().waitFor();
  const note=await frame.locator('#test-payment-notice').innerText();assert(note.includes('4242 4242 4242 4242'));assert(note.includes('5555 5555 5555 4444'));assert(note.includes('12/30'));assert(note.includes('123'));
  await frame.locator('[name=cardNumber]').focus();await frame.locator('[name=expiry]').focus();await frame.getByText('CMS card validation',{exact:true}).waitFor();return 'Draft payment labels, validation and header shown; all four fixed values correct.';
 });
 await check('fixed placeholders are visible in the editor and cannot be removed',async()=>{
  await h.page.goto(WM+'/en/content/global/gl_commerce',{waitUntil:'networkidle'});const entry=await call(editor,'GET','/admin/entries/global/gl_commerce');const section=entry.content.layout.find(s=>s.key==='paymentDetails-intro');
  await h.page.getByRole('tab',{name:section.label,exact:true}).click();await h.page.getByText('Fixed values supplied by the website’s code; keep every numbered placeholder.').waitFor();assert(await h.page.locator('code').filter({hasText:'4242 4242 4242 4242'}).count());
  const p=entry.content.locales.en['paymentDetails-intro'].p.replace('{0}','9999');const r=await raw(editor,'PATCH','/admin/entries/global/gl_commerce',{locale:'en',fields:{'paymentDetails-intro':{p}}},entry.version);assert.equal(r.status,422);assert.equal(r.error.fieldErrors['locales.en.paymentDetails-intro.p'],'marks_changed');return 'All placeholders preserved by the API; fixed values displayed read-only.';
 });
 await h.ctx.close();await k.ctx.close();await ctx.close();
 await mock.reset();audit.restoreFiles();
 for(const locale of ['en','ar'])for(const theme of ['light','dark'])for(const width of [390,1440])await check(`WM ${locale} ${theme} ${width}: no critical accessibility issues`,async()=>{
  const a=await as(approver,locale,theme,width);try{await a.page.goto(`${WM}/${locale}/content/work/cs_01`,{waitUntil:'networkidle'});await settle(a.page);const result=await axe(a.page);assert.equal(result.critical,0);const actual=await a.page.locator('html').getAttribute('data-theme');assert.equal(actual,theme);await a.page.screenshot({path:path.join(OUT,`wm-${locale}-${theme}-${width}.png`),fullPage:true});return result;}finally{await a.ctx.close();}
 });
 const {groupFromIds}=await import(pathToFileURL(path.join(APP,'src/reference/purchase-catalog.js')));const group=groupFromIds('software',['hr'],3);
 for(const locale of ['en','ar'])for(const width of [320,390,768,1440])for(const route of ['/roadmap','/checkout','/sign-in','/sign-up','/work/orgtik-identity-system','/'])await check(`site ${locale} ${route} ${width}: fits and zero critical accessibility issues`,async()=>{
  const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});try{await c.addInitScript(g=>localStorage.setItem('orgtik.cart.v2',JSON.stringify({version:2,groups:[g],messages:[]})),group);const p=await c.newPage();await p.goto(SITE+(locale==='ar'?'/ar':'')+route,{waitUntil:'networkidle'});await settle(p);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);const result=await axe(p);assert.equal(result.critical,0);await p.screenshot({path:path.join(OUT,`site-${locale}-${route.replaceAll('/','-')}-${width}.png`),fullPage:true});return result;}finally{await c.close();}
 });
 for(const width of [320,390,768,1440])await check('RTL account panel clamp and stable focus return '+width,async()=>{
  const c=await browser.newContext({viewport:{width,height:900}});try{const p=await c.newPage();await p.goto(SITE+'/ar/sign-up',{waitUntil:'networkidle'});const form=p.locator('#account-panel form');await form.locator('[name=name]').fill('RTL user');await form.locator('[name=email]').fill('rtl@example.test');await form.locator('[name=password]').fill('Synthetic123');await form.locator('[name=confirmPassword]').fill('Synthetic123');await form.locator('[type=submit]').click();
   const trigger=p.locator('.site-account__trigger').filter({visible:true}).first();await trigger.waitFor();await trigger.click();const panel=p.locator('.site-account__panel');await panel.waitFor();
   const a=await trigger.boundingBox(),b=await panel.boundingBox();const expected=Math.max(16,Math.min(a.x,width-b.width-16));assert(Math.abs(b.x-expected)<2);assert(b.x>=15&&b.x+b.width<=width-15);
   await p.keyboard.press('Escape');assert(await trigger.evaluate(el=>el===document.activeElement));await trigger.click();await panel.getByRole('button',{name:'Sign out',exact:true}).click();
   await p.waitForFunction(()=>document.activeElement?.matches('[data-account-signin], [data-menu-toggle]'),null,{timeout:5000});return {left:b.x,expected,width:b.width};}finally{await c.close();}
 });
}finally{
 await browser?.close();await audit.cleanup();fs.writeFileSync(path.join(OUT,'regressions.json'),JSON.stringify({at:new Date().toISOString(),passed:results.filter(r=>r.ok).length,total:results.length,results},null,2)+'\n');
}
console.log(`${results.filter(r=>r.ok).length}/${results.length} follow-up regressions passed`);if(results.some(r=>!r.ok))process.exitCode=1;
