import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const web=process.env.MARKETING_QA_WEB||'http://localhost:4415';
const root=process.cwd(),out=path.join(root,'program/audits/v3-p4-marketing'),require=createRequire(path.join(root,'apps/docs/package.json')),{chromium}=require('playwright');
const report={scope:'Current ordinary Marketing routes, owned offset 900 memory fixture',checks:[],captures:[],errors:[]};
const check=(name,pass,details)=>{report.checks.push({name,pass:!!pass,details});if(!pass)throw Error(name+' '+JSON.stringify(details));};
const session=(await fetch('http://localhost:8400/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'mona.adel@orgtik.test',password:'Local@2026',mode:'workspace',workspaceId:'ws_orgtik',target:'marketing'})}).then(r=>r.json())).data;
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1440,height:1050},timezoneId:'Africa/Cairo'}),page=await context.newPage();page.setDefaultTimeout(180000);
page.on('pageerror',error=>report.errors.push(error.message));page.on('console',msg=>{if(msg.type()==='error'&&/hydration|Maximum update depth|Minified React|MISSING_MESSAGE|Encountered two children|uncontrolled.*controlled/i.test(msg.text()))report.errors.push(msg.text());});
try{
 const code=(await fetch('http://localhost:8400/api/auth/handoff',{method:'POST',headers:{authorization:'Bearer '+session.tokens.accessToken,'content-type':'application/json'},body:JSON.stringify({audience:'tool:marketing'})}).then(r=>r.json())).data.code;
 await page.goto(`${web}/en/auth?code=${code}&redirect=/dashboard`,{waitUntil:'domcontentloaded'});
 await page.waitForURL(/\/en\/dashboard$/);await page.locator('main h1').first().waitFor();
 for(const route of ['dashboard','settings/brand','settings/senders','email-designer','social-inbox','queue','journeys','writing','our-audience/contacts','admin']){
  await page.goto(`${web}/en/${route}`,{waitUntil:'domcontentloaded'});await page.locator('main h1').first().waitFor();await page.waitForFunction(()=>!document.querySelector('main [aria-busy="true"]'));await page.evaluate(()=>document.fonts.ready);
  check(route+' has one main heading',await page.locator('main h1').count()===1);
  const overflow=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));check(route+' contains page width',overflow.scroll<=overflow.client+1,overflow);
  await page.screenshot({path:path.join(out,`smoke-${route.replaceAll('/','-')}-en-light-1440.png`),fullPage:true});report.captures.push(route);
  console.log('Checked',route);
 }
 check('No application runtime/catalog/hydration errors',report.errors.length===0,report.errors);report.completed=true;
}catch(error){report.failure=error.message;await page.screenshot({path:path.join(out,'smoke-failure.png'),fullPage:true}).catch(()=>{});throw error;}
finally{fs.writeFileSync(path.join(out,'smoke-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
