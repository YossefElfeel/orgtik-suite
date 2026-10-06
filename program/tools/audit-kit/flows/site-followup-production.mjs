// Production accessibility/width verification complements the exact screenshot comparisons.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {auditState} from '../lib/audit-state.mjs';
import {AUDITS,WORKSPACE} from '../lib/suite.mjs';
import {settle,axe} from '../lib/checks.mjs';
const audit=await auditState('site-followup-production.mjs');const results=[];let browser;
try{
 const app=path.join(WORKSPACE,'orgtik-website/landing-directions');const {groupFromIds}=await import(pathToFileURL(path.join(app,'src/reference/purchase-catalog.js')));const group=groupFromIds('software',['hr'],3);
 browser=await chromium.launch();
 for(const width of [320,390,768,1440])for(const route of ['/','/roadmap','/checkout','/sign-in','/sign-up','/work/orgtik-identity-system']){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});try{
   await ctx.addInitScript(g=>localStorage.setItem('orgtik.cart.v2',JSON.stringify({version:2,groups:[g],messages:[]})),group);
   const page=await ctx.newPage();await page.goto('http://127.0.0.1:4280'+route,{waitUntil:'networkidle'});await settle(page);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);const accessibility=await axe(page);assert.equal(accessibility.critical,0);
   results.push({route,width,ok:true,overflow,accessibility});console.log(`ok ${route} ${width}`);
  }catch(e){results.push({route,width,ok:false,note:e.message});console.log(`FAIL ${route} ${width}: ${e.message.split('\n')[0]}`);}finally{await ctx.close();}
 }
}finally{await browser?.close();await audit.cleanup();fs.writeFileSync(path.join(AUDITS,'wm/followup/production-responsive.json'),JSON.stringify({at:new Date().toISOString(),passed:results.filter(r=>r.ok).length,total:results.length,results},null,2)+'\n');}
console.log(`${results.filter(r=>r.ok).length}/${results.length} production responsive/accessibility checks passed`);if(results.some(r=>!r.ok))process.exitCode=1;
