// Representative real-browser journeys against the local mock, with disposable identities.
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'../..');
const require=createRequire(path.join(root,'apps/chats/package.json'));
const { chromium }=require('playwright');
const output=path.join(root,'.vercel/journey-results');fs.mkdirSync(output,{recursive:true});
let child,browser,origin=process.env.ORGTIK_JOURNEY_ORIGIN;
const times=[];
async function capture(page,name){await page.screenshot({path:path.join(output,name+'.png'),fullPage:false});}
async function visit(page,route,name){const start=Date.now();await page.goto(origin+route,{waitUntil:'domcontentloaded',timeout:120000});await page.locator('h1').first().waitFor({timeout:120000});times.push({name,ms:Date.now()-start});}
async function login(context,email,password){
  const page=await context.newPage();await visit(page,'/sos/auth/login','login');
  await page.getByLabel('Email',{exact:false}).fill(email);await page.getByLabel(/^Password/).fill(password);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.waitForURL(url=>!url.pathname.includes('/auth/'),{timeout:120000});return page;
}
try {
  if(!origin){
    const probe=net.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));origin=`http://127.0.0.1:${port}`;
    child=spawn(process.execPath,['tools/services/local.cjs','--preview','--preview-services=sos,tasks'],{cwd:root,env:{...process.env,ORGTIK_LOCAL_PORT:String(port),ORGTIK_LOCAL_HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe'],windowsHide:true});
    let ready=false,exited=false;const log=fs.createWriteStream(path.join(output,'launcher.log'));
    for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{log.write(chunk);if(String(chunk).includes('OrgTik local prototype ready:'))ready=true;});
    child.on('exit',()=>exited=true);
    const deadline=Date.now()+900000;while(!ready){if(exited||Date.now()>deadline)throw Error('Local launcher failed; see launcher.log');await new Promise(resolve=>setTimeout(resolve,250));}
  }
  if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))throw Error('Journeys require a local suite.');
  browser=await chromium.launch({headless:true});
  const guest=await browser.newContext();const guestPage=await guest.newPage();
  await guestPage.goto(origin+'/sos/go/task_manager?workspaceId=ws_orgtik',{waitUntil:'domcontentloaded'});
  await guestPage.waitForURL(url=>url.pathname==='/sos/auth/login',{timeout:120000});
  assert.equal(new URL(guestPage.url()).searchParams.get('redirect'),'/go/task_manager?workspaceId=ws_orgtik');await guest.close();
  const context=await browser.newContext({viewport:{width:1280,height:800},locale:'en-GB'});
  await context.addCookies([{name:'NEXT_LOCALE',value:'en',url:origin}]);
  const page=await login(context,'mona.adel@orgtik.test','Local@2026');
  await page.getByRole('heading',{name:'Your tools',exact:true}).waitFor({timeout:60000});
  const cards=page.locator('#ot-main li').filter({has:page.getByRole('link',{name:'Open tool',exact:true})});
  assert.equal(await cards.count(),6);assert.equal(await cards.locator('svg').count(),6);await capture(page,'mona-home-en');
  // The shared-domain proxy can omit legacy cookie hints. Admission must still
  // use this tab's signed session, rather than sending Mona through login again.
  await context.clearCookies({ name: /^SOMION_SOS\./ });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'Your tools',exact:true}).waitFor({timeout:60000});
  await page.getByRole('link',{name:'Open tool',exact:true}).first().click();await page.waitForURL(url=>url.pathname.startsWith('/tasks/'),{timeout:120000});
  assert.equal(new URL(page.url()).origin,origin);assert.ok(!new URL(page.url()).pathname.match(/tasks\/[^/]+\/tasks/));
  await page.getByRole('link',{name:'Home',exact:true}).first().waitFor({timeout:120000});await capture(page,'mona-tasks-en');
  const chart=page.getByRole('figure',{name:'Open tasks by project',exact:true});
  await chart.waitFor({timeout:60000});await chart.getByRole('button',{name:'Table',exact:true}).click();
  await chart.getByText('Nile Foods E-commerce Revamp',{exact:true}).waitFor({timeout:60000});
  await visit(page,'/tasks/en/teams','team form');
  const taskCatalog=JSON.parse(fs.readFileSync(path.join(root,'apps/tasks/messages/en.json'),'utf8'));
  const label=taskCatalog.TeamList.create;
  await page.getByRole('button',{name:label,exact:true}).click();
  const dialog=page.getByRole('dialog',{name:taskCatalog.TeamForm.title,exact:true});await dialog.getByLabel(taskCatalog.TeamForm.name,{exact:false}).fill('CI local team '+Date.now());
  const submitTeam=dialog.getByRole('button',{name:taskCatalog.TeamForm.create,exact:true});
  await page.route('**/api/backend/tasks/api/teams',route=>route.request().method()==='POST'?route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,message:'Fixture save failure'})}):route.continue());
  await submitTeam.click();await dialog.getByRole('button',{name:taskCatalog.TeamForm.create,exact:true}).waitFor();assert.ok(await dialog.isVisible());assert.ok((await dialog.getByLabel(taskCatalog.TeamForm.name,{exact:false}).inputValue()).startsWith('CI local team'));
  await page.unroute('**/api/backend/tasks/api/teams');await submitTeam.click();await dialog.waitFor({state:'hidden',timeout:30000});await capture(page,'team-created');
  await visit(page,'/sos','warm home');
  await context.addCookies([{name:'NEXT_LOCALE',value:'ar',url:origin},{name:'ot-theme',value:'dark',url:origin}]);await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'أدواتك',exact:true}).waitFor({timeout:60000});
  await page.setViewportSize({width:390,height:844});await capture(page,'mona-home-ar-mobile');
  assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);assert.equal(overflow,false);
  // A bookmarked central directory must prepare verified administration access,
  // rather than deny a super admin who signed in to her ordinary workspace.
  const centralContext=await browser.newContext({viewport:{width:1280,height:800}});
  await centralContext.addCookies([{name:'NEXT_LOCALE',value:'en',url:origin}]);
  const centralPage=await login(centralContext,'mona.adel@orgtik.test','Local@2026');
  await visit(centralPage,'/sos/people','central people');
  await centralPage.getByRole('heading',{name:'People',exact:true}).waitFor({timeout:60000});
  await centralPage.locator('tbody tr').filter({hasText:/@/}).first().waitFor({timeout:60000});
  const centralSession=await centralPage.evaluate(()=>JSON.parse(sessionStorage.getItem('orgtik.tab-session.v1/sos')));
  assert.equal(centralSession.workspaceContext,null);
  assert.ok(centralSession.staffAccess.permissions.admin.includes('staff:view'));
  assert.equal(await centralPage.getByRole('link',{name:'Team',exact:true}).count(),0);
  assert.equal(await centralPage.getByRole('link',{name:'Subscriptions',exact:true}).count(),0);
  await capture(centralPage,'mona-central-people');await centralContext.close();
  const register=await context.request.post(origin+'/sos/api/backend/sos/api/auth/register',{data:{email:`journey-${Date.now()}@orgtik.test`,name:'Journey owner',password:'LocalJourney2026!'}});assert.equal(register.status(),201);
  const account=(await register.json()).data;
  const trial=await context.request.post(origin+'/sos/api/backend/sos/api/suite/tools/tasks/trial',{headers:{authorization:'Bearer '+account.tokens.accessToken},data:{planId:'tasks_pro'}});assert.equal(trial.status(),200);
  const owner=await browser.newContext({viewport:{width:1280,height:800},locale:'en-GB'});await owner.addCookies([{name:'NEXT_LOCALE',value:'en',url:origin}]);
  const single=await login(owner,account.user.email,'LocalJourney2026!');await single.waitForURL(url=>url.pathname.startsWith('/tasks/'),{timeout:120000});await single.getByRole('link',{name:'Home',exact:true}).first().waitFor({timeout:60000});await capture(single,'single-tool-owner');
  if(process.argv.includes('--visuals')) {
    const routes={sos:['global','sos'],tasks:['task_manager','tasks'],files:['file_manager','files'],hr:['hr_system','hr'],sales:['sales','sales'],marketing:['digital_marketing','marketing'],chats:['hq','chats'],admin:['platform_admin','admin'],wm:['website_manager','wm']};
    for(const [language,theme,width] of [['en','light',1280],['en','dark',1280],['ar','dark',390],['ar','light',1024]]) {
      await context.addCookies([{name:'NEXT_LOCALE',value:language,url:origin},{name:'ot-theme',value:theme,url:origin}]);await page.setViewportSize({width,height:844});
      for(const [key,[scope,prefix]] of Object.entries(routes)) {
        await page.goto(origin+(key==='sos'?'/sos':'/sos/go/'+scope),{waitUntil:'domcontentloaded',timeout:120000});
        await page.waitForURL(url=>url.pathname.startsWith('/'+prefix)&&!url.pathname.includes('/auth'),{timeout:120000});await page.locator('#ot-main').waitFor({timeout:120000});
        await page.waitForFunction(() => { const main = document.querySelector('#ot-main'); return main && main.innerText.trim().length > 100 && !main.querySelector('[aria-busy="true"]'); }, undefined, { timeout: 60000 });
        await capture(page,`${key}-${language}-${theme}-${width}`);
      }
    }
  }
  await owner.close();await context.close();
  fs.writeFileSync(path.join(output,'timings.json'),JSON.stringify(times,null,2));console.log('Browser journeys passed: Mona, tool icons, handoff, team form, Arabic mobile, single-tool owner.');
} finally {
  await browser?.close();
  if(child){if(process.platform==='win32'){const {spawnSync}=await import('node:child_process');spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});}else child.kill('SIGTERM');}
}
