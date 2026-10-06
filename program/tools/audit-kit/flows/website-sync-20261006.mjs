// Local upstream sync: sample publication, draft preview, restored routes, and cleanup.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {auditState} from '../lib/audit-state.mjs';
import {fixtureCall as call} from '../lib/content-fixtures.mjs';
import {tokenFor} from '../lib/session.mjs';
import {AUDITS,WORKSPACE} from '../lib/suite.mjs';
import {settle,axe} from '../lib/checks.mjs';
import {mock} from '../lib/mock.mjs';
const cmsOnly=process.argv.includes('--cms-only');
const audit=await auditState('website-sync-20261006');let results=[];let browser;
const out=path.join(AUDITS,'wm/sync-20261006');fs.mkdirSync(out,{recursive:true});
if(cmsOnly)results=JSON.parse(fs.readFileSync(path.join(out,'checks.json'))).results.filter(x=>x.name.startsWith('http'));
const seed=JSON.parse(fs.readFileSync(path.join(WORKSPACE,'local-dev/apps/wm/seed/website.json')));
const admin='mona.adel@orgtik.test',editor='hoda.ashraf@orgtik.test';
async function check(name,fn){try{results.push({name,ok:true,note:await fn()});console.log('ok '+name);}catch(e){results.push({name,ok:false,note:e.message});console.log('FAIL '+name+': '+e.message);}}
async function login(page,email,lang='en'){await page.goto(`http://localhost:3007/${lang}/auth?token=${await tokenFor(email)}`);await page.getByRole('heading',{level:1}).first().waitFor();}
try{
 browser=await chromium.launch();
 await check('five CMS projects retain full stories, sample status and unapproved figures',async()=>{
  const cases=await call(admin,'GET','/admin/entries/caseStudy');assert.equal(cases.length,5);
  for(const item of cases){const e=await call(admin,'GET',`/admin/entries/caseStudy/${item.id}`);assert.equal(e.content.sampleNarrativePublished,true);assert.equal(e.content.narrativePublished,false);assert.equal(e.content.provenance.figures,'sample');assert(e.content.locales.en.challenge.length>50);}
  return 'Five complete department stories, explicitly samples.';
 });
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 try{
  const page=await context.newPage();await login(page,admin);
  await check('CMS sample switch saves a draft and all preview widths render CMS edits',async()=>{
   await page.goto('http://localhost:3007/en/content/work/cs_01',{waitUntil:'networkidle'});
   const toggle=page.getByRole('switch',{name:'Public sample case-study story',exact:true});assert(await toggle.isChecked());assert(await toggle.isEnabled());
   let e=await call(admin,'GET','/admin/entries/caseStudy/cs_01');e=await call(admin,'PATCH','/admin/entries/caseStudy/cs_01',{locale:'en',fields:{challenge:'CMS synced case study draft challenge.'}},e.version);
   await page.goto('http://localhost:3007/en/preview?path=%2Fwork%2Forgtik-identity-system',{waitUntil:'networkidle'});
   for(const key of ['phone','tablet','desktop'])await page.frameLocator(`iframe[title=${key}]`).getByText('CMS synced case study draft challenge.',{exact:true}).waitFor({timeout:30000});
   const live=(await(await fetch('http://localhost:4007/v2/public/entries/caseStudy')).json()).data.find(x=>x.id==='cs_01');assert.notEqual(live.locales.en.challenge,'CMS synced case study draft challenge.');return 'Draft edits visible in three CMS preview frames; live content unchanged.';
  });
  await check('turning off a sample story hides only its narrative in draft preview',async()=>{
   await page.goto('http://localhost:3007/en/content/work/cs_01',{waitUntil:'networkidle'});await page.getByRole('switch',{name:'Public sample case-study story',exact:true}).click();
   const saved=page.waitForResponse(r=>r.url().endsWith('/admin/entries/caseStudy/cs_01')&&r.request().method()==='PATCH');
   await page.getByRole('button',{name:'Save draft',exact:true}).first().click();assert.equal((await saved).status(),200);
   const e=await call(admin,'GET','/admin/entries/caseStudy/cs_01');assert.equal(e.content.sampleNarrativePublished,false);
   await page.goto('http://localhost:3007/en/preview?path=%2Fwork%2Forgtik-identity-system',{waitUntil:'networkidle'});
   for(const key of ['phone','tablet','desktop']){const frame=page.frameLocator(`iframe[title=${key}]`);await frame.getByRole('heading',{level:1,name:'OrgTik identity system'}).waitFor();assert.equal(await frame.locator('.cs-results').count(),0);}
   return 'Project remains visible; narrative disabled in preview.';
  });
  await check('editors cannot change sample-story publication permission',async()=>{
   const p=await context.newPage();try{await login(p,editor);await p.goto('http://localhost:3007/en/content/work/cs_02',{waitUntil:'networkidle'});assert(await p.getByRole('switch',{name:'Public sample case-study story',exact:true}).isDisabled());}finally{await p.close();}
   return 'Content approval permission required.';
  });
  await check('approved narrative preview drops sample labels and keeps approved figures',async()=>{
   let e=await call(admin,'GET','/admin/entries/caseStudy/cs_02');e=await call(admin,'POST','/admin/entries/caseStudy/cs_02/approve-figures',{},e.version);
   e=await call(admin,'PATCH','/admin/entries/caseStudy/cs_02',{neutral:{narrativePublished:true}},e.version);assert.equal(e.content.sampleNarrativePublished,false);
   await page.goto('http://localhost:3007/en/preview?path=%2Fwork%2Fconnected-platform-concept',{waitUntil:'networkidle'});
   const frame=page.frameLocator('iframe[title=desktop]');await frame.locator('.cs-results').waitFor();assert.equal(await frame.locator('.cs-sample').count(),0);await frame.getByText('Technical audit',{exact:true}).waitFor();return 'Approved story renders without sample disclosures.';
  });
  for(const lang of ['en','ar'])for(const theme of ['light','dark'])await check(`CMS editor accessible: ${lang} ${theme}`,async()=>{
   await context.addCookies([{name:'ot-theme',value:theme,url:'http://localhost:3007'}]);await page.goto(`http://localhost:3007/${lang}/content/work/cs_03`,{waitUntil:'networkidle'});await settle(page);assert.equal(await page.locator('html').getAttribute('data-theme'),theme);assert.equal((await axe(page)).critical,0);return 'Theme confirmed; zero critical accessibility findings.';
  });
 }finally{await context.close();}
 // Restore the published seed before public-site checks.
 await mock.reset();
 const routes=['/work',...seed.caseStudies.map(e=>'/work/'+e.slug.en)];
 for(const host of cmsOnly?[]:['http://localhost:4173','http://127.0.0.1:4280'])for(const width of [320,390,768,1440])for(const route of routes)await check(`${host} ${route} ${width}`,async()=>{
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});try{const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));const response=await p.goto(host+route,{waitUntil:'networkidle'});assert.equal(response.status(),200);await settle(p);
   assert.equal(await p.locator('h1').count(),1);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.equal(errors.length,0);assert.equal((await axe(p)).critical,0);
   if(route!='/work'){assert(await p.locator('.cs-results').isVisible());assert.equal(await p.locator('.cs-sample').count(),1);assert(await p.getByText('Sample figure',{exact:true}).isVisible());}
   if(host.includes('4173')&&width===390)await p.screenshot({path:path.join(out,route.split('/').pop()+'-390.png'),fullPage:true});return '200, complete story, sample labels, no overflow/runtime errors/critical accessibility findings.';
  }finally{await ctx.close();}
 });
 await check('restored URLs, legacy aliases, 404, Sign-up SEO and sitemap',async()=>{
  const base='http://127.0.0.1:4280';for(const item of seed.caseStudies){const slug=item.slug.en;const r=await fetch(base+'/projects/'+slug,{redirect:'manual'});assert([301,308].includes(r.status));assert.equal(r.headers.get('location'),'/work/'+slug);}
  assert.equal((await fetch(base+'/work/not-a-project')).status,404);const sitemap=await(await fetch(base+'/sitemap.xml')).text();for(const e of seed.caseStudies)assert(sitemap.includes('/work/'+e.slug.en));assert(!sitemap.includes('/sign-up'));
  const signup=await(await fetch(base+'/sign-up')).text();assert(signup.includes('noindex'));return 'Five canonical project routes and legacy redirects; real 404; Sign-up excluded.';
 });
}finally{
 await browser?.close();await audit.cleanup();fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({results,passed:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length},null,2)+'\n');
}
console.log(`PASS ${results.filter(x=>x.ok).length} FAIL ${results.filter(x=>!x.ok).length}`);if(results.some(x=>!x.ok))process.exitCode=1;
