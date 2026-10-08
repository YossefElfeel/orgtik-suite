const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../../../apps/chats/node_modules/playwright');
const root=path.resolve(__dirname,'../../..'),out=path.join(root,'program/audits/chats-presentation');fs.mkdirSync(out,{recursive:true});
const checks=[];const check=(name,condition)=>{assert.ok(condition,name);checks.push(name)};
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
 await page.goto('http://localhost:3669/presentation'); await page.getByRole('heading',{name:'Nile Studio',exact:true}).waitFor();
 await page.getByRole('button',{name:'Save',exact:true}).first().click();
 await page.getByRole('button',{name:'Saved messages',exact:true}).click();check('Saved item visible',await page.getByRole('button',{name:'Unsave',exact:true}).count()===1);
 await page.getByRole('button',{name:'launch-review',exact:true}).click();
 await page.getByRole('button',{name:'Remind me',exact:true}).first().click();check('Reminder feedback',await page.getByRole('button',{name:'Reminder set',exact:true}).count()===1);
 await page.getByRole('button',{name:'Create task',exact:true}).first().click();check('Task created once',await page.getByRole('button',{name:'TASK-101',exact:true}).isDisabled());
 await page.getByRole('textbox',{name:'Message #launch-review'}).fill('Stakeholder handoff approved.');
 await page.getByRole('button',{name:'Bold message',exact:true}).click();
 await page.getByRole('button',{name:'Attach file',exact:true}).click();await page.getByRole('button',{name:'launch-checklist.pdf',exact:true}).click();
 await page.getByRole('button',{name:'Send',exact:true}).click();check('Sent message visible',await page.getByText('Stakeholder handoff approved.',{exact:true}).count()===1);
 await page.reload();await page.getByText('Stakeholder handoff approved.',{exact:true}).waitFor();check('Tab reload preserves messages',true);
 await page.getByRole('textbox',{name:'Message #launch-review'}).fill('Tomorrow review.');await page.getByRole('button',{name:'Schedule tomorrow',exact:true}).click();
 await page.getByRole('button',{name:'Scheduled messages',exact:true}).click();check('Scheduled queue',await page.getByText('Tomorrow review.',{exact:true}).count()===1);
 await page.getByRole('button',{name:'Send now',exact:true}).click();await page.getByRole('button',{name:'launch-review',exact:true}).click();check('Send scheduled item now',await page.getByText('Tomorrow review.',{exact:true}).count()===1);
 await page.getByRole('button',{name:'New channel',exact:true}).click();await page.getByRole('textbox',{name:'Channel name',exact:true}).fill('stakeholder-review');await page.getByRole('button',{name:'Create channel',exact:true}).click();check('Create channel',await page.getByRole('heading',{name:'#stakeholder-review',exact:true}).count()===1);
 await page.getByRole('button',{name:/^design-team/}).click();check('Read state cleared',await page.getByRole('button',{name:'design-team',exact:true}).getByText('1',{exact:true}).count()===0);
 await page.evaluate(()=>sessionStorage.setItem('orgtik:demo-scene:chats',JSON.stringify({persona:'mona',workspace:'spree',state:'normal',scenario:'none'})));await page.reload();await page.getByRole('heading',{name:'Spree Atelier',exact:true}).waitFor();check('Workspace data isolated',await page.getByText('Stakeholder handoff approved.',{exact:true}).count()===0);check('Persona applied',await page.getByText('Presenting as Mona Adel',{exact:true}).count()===1);
 await page.getByRole('button',{name:'Reset conversation',exact:true}).click();check('Reset scoped to Spree',await page.evaluate(()=>JSON.parse(sessionStorage.getItem('orgtik:presentation:chats:nile')).messages.some(m=>m.body==='Stakeholder handoff approved.')));
 const captures=[]; const axe=[];
 for(const locale of ['en','ar'])for(const theme of ['light','dark'])for(const width of [1440,390]){
  const c=await browser.newContext({viewport:{width,height:1000}});await c.addCookies([{name:'NEXT_LOCALE',value:locale,url:'http://localhost:3669'},{name:'ot-theme',value:theme,url:'http://localhost:3669'}]);const p=await c.newPage();await p.goto('http://localhost:3669/presentation');await p.getByRole('heading',{name:'Nile Studio',exact:true}).waitFor();await p.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);await p.waitForTimeout(300);
  if(locale==='en'&&theme==='dark'&&width===1440){await p.getByRole('button',{name:'Start mock call',exact:true}).click();await p.getByRole('dialog').waitFor();await p.waitForTimeout(300);}
  await p.addScriptTag({path:path.join(root,'node_modules/.pnpm/axe-core@4.11.0/node_modules/axe-core/axe.min.js')});const violations=await p.evaluate(async()=> (await axe.run()).violations.filter(v=>v.impact==='critical').map(v=>v.id));axe.push({locale,theme,width,critical:violations});check(`${locale}/${theme}/${width}: zero axe critical`,violations.length===0);check(`${locale}/${theme}/${width}: no page overflow`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const file=`${locale}-${theme}-${width}.png`;await p.screenshot({path:path.join(out,file),fullPage:true});captures.push(file);await c.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({route:'/presentation',checks,captures,axe,scope:'Client presentation fixtures; no backend or external delivery'},null,2)+'\n');await browser.close();console.log(JSON.stringify({checks:checks.length,captures:captures.length,critical:0}));
})().catch(error=>{console.error(error);process.exit(1)});
