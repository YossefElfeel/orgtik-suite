import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../../../apps/docs/package.json',import.meta.url));
const {chromium}=require('playwright'), out=path.dirname(fileURLToPath(import.meta.url));
const report={scope:'Ordinary HR route migration smoke; current real owner records',checks:[],captures:[],errors:[]};
const check=(name,pass,details)=>{report.checks.push({name,pass:!!pass,details});if(!pass)throw Error(name+' '+JSON.stringify(details));};
async function api(url,body,session){const r=await fetch('http://localhost:7900/api'+url,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session.tokens.accessToken}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error(url+' '+r.status);return(await r.json()).data;}
const browser=await chromium.launch();
try{
  const session=await api('/auth/login',{email:'mona.adel@orgtik.test',password:'Local@2026',mode:'workspace',workspaceId:'ws_orgtik',target:'hr'});
  const response=await fetch('http://localhost:7904/api/hr/workspace',{headers:{Authorization:'Bearer '+session.tokens.accessToken,'X-Workspace':'ws_orgtik'}}),workspace=(await response.json()).data;
  const routes=['/','/employees','/employees/'+workspace.self.id,'/employees/org-chart','/department','/department/1','/attendance','/calendar','/time-off','/payroll','/payroll/1','/finance-queue','/loans','/tickets','/tickets/1001','/hiring/jobs','/hiring/overall','/hiring/overall/1','/candidates','/candidates/'+workspace.applications[0].id,'/rejected','/configuration','/projects','/my-payslips',...['team','documents','mailbox','attendance','holidays','reports','import'].map(view=>'/people/'+view),'/careers'];
  for(const [locale,theme,width,paths] of [['en','light',1440,routes],['ar','dark',390,['/employees','/employees/'+workspace.self.id,'/payroll','/payroll/1','/tickets','/tickets/1001','/calendar','/configuration','/projects']]]){
    await fetch('http://localhost:7904/api/suite/preferences',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.tokens.accessToken,'X-Workspace':'ws_orgtik'},body:JSON.stringify({theme,language:locale})});
    const context=await browser.newContext({viewport:{width,height:width===390?844:1000}}),page=await context.newPage();page.setDefaultTimeout(120000);
    page.on('pageerror',error=>report.errors.push({locale,width,message:error.message}));page.on('console',message=>{if(message.type()==='error'&&/MISSING_MESSAGE|same key|Hydration failed|hydrated but/i.test(message.text()))report.errors.push({locale,width,message:message.text()});});
    const code=await api('/auth/handoff',{audience:'tool:hr'},session);await page.goto('http://localhost:3904/'+locale+'/auth?code='+code.code+'&redirect=/people/profile',{waitUntil:'domcontentloaded',timeout:180000});await page.getByRole('heading',{name:locale==='en'?'My profile':'ملفي',exact:true}).waitFor();
    for(const route of paths){report.currentRoute=locale+route;console.log('Checking '+report.currentRoute);const response=await page.goto('http://localhost:3904/'+locale+route,{waitUntil:'domcontentloaded',timeout:180000});await page.getByRole('button',{name:locale==='en'?'Account':'الحساب',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForLoadState('networkidle',{timeout:120000});await page.waitForTimeout(300);check(locale+route+': ordinary route renders',response.status()<400&&!page.url().includes('/auth')&&!page.url().includes('/presentation'));check(locale+route+': no overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));if(['/tickets/1001','/payroll/1','/employees/'+workspace.self.id].includes(route)){const filename='hr-retained-'+route.replaceAll('/','-').slice(1)+'-'+locale+'-'+theme+'-'+width+'.png';await page.screenshot({path:path.join(out,filename)});report.captures.push(filename);}}
    await context.close();
  }
  check('No ordinary-route runtime, catalog, hydration or duplicate-key errors',!report.errors.length,report.errors);report.completed=true;
}finally{fs.writeFileSync(path.join(out,'ordinary-routes.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({checks:report.checks.length,captures:report.captures.length,completed:report.completed}));
