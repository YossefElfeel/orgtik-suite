import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../..');
const require=createRequire(path.join(root,'apps/docs/package.json'));
const {chromium}=require('playwright');
const report=process.argv.includes('--only-sos')?JSON.parse(fs.readFileSync(path.join(out,'report.json'),'utf8')):{date:'2026-10-09',scope:'Ordinary Tasks list, HR leave Sheet and Account Home in an isolated memory-backed sandbox; DS v2 specimens.',checks:[],captures:[],errors:[]};
const check=(name,pass,details)=>{report.checks.push({name,pass:Boolean(pass),details});if(!pass)throw Error(name+' '+JSON.stringify(details))};
async function api(url,session,body){const response=await fetch('http://localhost:7500'+url,{method:body?'POST':'GET',headers:{...(body?{'content-type':'application/json'}:{}),...(session?{Authorization:'Bearer '+session.tokens.accessToken}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok)throw Error(url+' status '+response.status);return(await response.json()).data}
const browser=await chromium.launch({headless:true});
try{
 for(const tool of (process.argv.includes('--only-sos')?['sos']:['tasks','hr','sos'])){
  const session=await api('/api/auth/login',null,{email:tool==='hr'?'mona.adel@orgtik.test':'nour.khaled@nilefoods.test',password:'Local@2026',mode:'workspace',workspaceId:tool==='hr'?'ws_orgtik':'ws_nile',target:tool==='sos'?'suite':tool});
  const port={tasks:3501,hr:3504,sos:3500}[tool];
  for(const locale of ['en','ar'])for(const theme of ['light','dark'])for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:width===390?844:1000}}),page=await context.newPage();page.setDefaultTimeout(45000);
   await context.addCookies([{name:'ot-theme',value:theme,url:'http://localhost:'+port},{name:'NEXT_LOCALE',value:locale,url:'http://localhost:'+port}]);
   page.on('pageerror',error=>report.errors.push({tool,locale,theme,message:error.message}));
   const handoff=await api('/api/auth/handoff',session,{audience:tool==='sos'?'suite':'tool:'+tool});
   const redirect=tool==='tasks'?'/my-tasks/lists':tool==='hr'?'/attendance':'/';
   const url=tool==='sos'?`http://localhost:${port}/auth/handoff?code=${encodeURIComponent(handoff.code)}&redirect=/`:`http://localhost:${port}/${locale}/auth?code=${encodeURIComponent(handoff.code)}&redirect=${redirect}`;
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
   if(tool==='tasks'){
    await page.getByRole('searchbox',{name:locale==='en'?'Search tasks':'ابحث في المهام',exact:true}).waitFor({timeout:120000});
    if(locale==='en'&&theme==='light'&&width===1440){
     const first=page.locator('tbody a').first();await first.waitFor();const title=await first.innerText();
     await page.getByRole('searchbox').fill(title);check('Ordinary task search filters actual query data',await page.locator('tbody a').count()>0&&await page.locator('tbody a').count()<66);
     await page.getByRole('button',{name:'Compact density',exact:true}).click();check('Compact density applies to actual table rows',await page.locator('[data-density="compact"] table').count()>0);
     await page.getByRole('searchbox').fill('');
    }
   }else if(tool==='hr'){
    const trigger=page.getByRole('button',{name:locale==='en'?'Request time off':'طلب إجازة',exact:true});
    await trigger.waitFor({timeout:120000});await trigger.click();await page.getByRole('dialog').waitFor();
    check(`HR ${locale}/${theme}/${width}: leave form in docked sheet`,await page.getByRole('dialog').getAttribute('class').then(classes=>classes.includes('end-0')));
   }else {
    try { await page.getByRole('heading',{name:session.workspaceContext.workspace.name,exact:true}).waitFor({timeout:120000}); }
    catch(error){await page.screenshot({path:path.join(out,'sos-failure.png')});console.error(JSON.stringify({url:page.url(),workspace:session.workspaceContext.workspace.name,headings:await page.locator('h1,h2').allTextContents(),body:(await page.locator('body').innerText()).slice(0,1500)}));throw error}
   }
   await page.evaluate(()=>document.fonts.ready);
   check(`${tool}/${locale}/${theme}/${width}: ordinary route`,!page.url().includes('presentation'));
   check(`${tool}/${locale}/${theme}/${width}: no document overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   check(`${tool}/${locale}/${theme}/${width}: direction/theme`,await page.evaluate(({locale,theme})=>document.documentElement.dir===(locale==='ar'?'rtl':'ltr')&&document.documentElement.dataset.theme===theme,{locale,theme}));
   await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   const axe=await page.evaluate(async()=>{const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}});return result.violations.filter(item=>['critical','serious'].includes(item.impact)).map(item=>({id:item.id,impact:item.impact,nodes:item.nodes.map(node=>node.target)}))});
   check(`${tool}/${locale}/${theme}/${width}: no critical/serious axe`,!axe.length,axe);
   const name=`${tool}-${locale}-${theme}-${width}.png`;await page.screenshot({path:path.join(out,name)});report.captures.push(name);await context.close();
  }
 }
 check('No application runtime errors',!report.errors.length,report.errors);report.completed=true;
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close()}
console.log(JSON.stringify({checks:report.checks.length,captures:report.captures.length,completed:report.completed},null,2));
