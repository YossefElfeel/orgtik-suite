import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createVisualPage,settleVisualStory} from './visual-environment.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../storybook-static');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf'};
const server=http.createServer((req,res)=>fs.readFile(path.join(root,decodeURIComponent(req.url.split('?')[0])),(error,data)=>error?res.writeHead(404).end():res.writeHead(200,{'content-type':types[path.extname(req.url.split('?')[0])]||'application/octet-stream'}).end(data))).listen(0,'127.0.0.1');
const port=await new Promise(resolve=>server.on('listening',()=>resolve(server.address().port))),browser=await chromium.launch(),checks=[];
const assert=(name,pass,details)=>{checks.push({name,pass:Boolean(pass),details});if(!pass)throw Error(name+' '+JSON.stringify(details))};
async function open(story){const{context,page}=await createVisualPage(browser),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${story}&viewMode=story&globals=theme:light;locale:en`,{waitUntil:'networkidle'});await settleVisualStory(page,'theme:light;locale:en');page.setDefaultTimeout(15000);return{context,page,errors}}
try{
 {
  const{context,page}=await open('v2-lists-and-input--list-controls');
  await page.getByRole('searchbox',{name:'Search tasks'}).fill('launch');await page.waitForFunction(()=>document.querySelectorAll('table[aria-label="Work list"] tbody tr').length===1);assert('Search filters real story rows',await page.getByRole('table',{name:'Work list'}).locator('tbody tr').count()===1);await page.getByRole('searchbox').fill('');await page.waitForFunction(()=>document.querySelectorAll('table[aria-label="Work list"] tbody tr').length===3);
  await page.getByRole('button',{name:'Compact density'}).click();assert('Compact density reaches the table',await page.locator('[data-density="compact"] table').count()===1);
  await page.getByRole('button',{name:'Columns',exact:true}).click();await page.getByRole('checkbox',{name:'Owner',exact:true}).uncheck();assert('Column chooser hides the selected column',await page.getByRole('columnheader',{name:'Owner',exact:true}).count()===0);await page.keyboard.press('Escape');
  const resize=page.getByRole('separator',{name:'Resize column Task',exact:true});const before=Number(await resize.getAttribute('aria-valuenow'));await resize.focus();await page.keyboard.press('ArrowRight');assert('Keyboard column resizing changes width by ten',Number(await resize.getAttribute('aria-valuenow'))===before+10);
  await page.getByRole('button',{name:'Edit Review launch brief',exact:true}).click();await page.getByRole('textbox',{name:'Edit Review launch brief'}).fill('Launch review accepted');await page.keyboard.press('Enter');assert('Inline edit commits the actual row',await page.getByRole('button',{name:'Edit Launch review accepted',exact:true}).isVisible());
  await page.getByRole('button',{name:'Inspect',exact:true}).first().click();assert('Inspector opens the selected record',await page.getByRole('dialog').isVisible());await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'All work',exact:true}).click();await page.getByRole('textbox',{name:'View name'}).fill('Review queue');await page.getByRole('button',{name:'Save current view'}).click();assert('Saved view is listed after its callback',await page.getByRole('button',{name:'Review queue',exact:true}).isVisible());await context.close();
 }
 {
  const{context,page}=await open('v2-communication--editor');
  const editor=page.getByRole('textbox',{name:'Message',exact:true});await editor.click();await page.keyboard.press('Control+A');await page.keyboard.type('Formatted review');await page.keyboard.press('Control+A');await page.getByRole('button',{name:'Bold',exact:true}).click();assert('Real editor creates a bold mark',await editor.locator('strong').innerText()==='Formatted review');
  await page.getByRole('button',{name:'Bullet list',exact:true}).click();assert('Real editor creates list structure',await editor.locator('ul li').count()===1);await context.close();
 }
 {
  const{context,page}=await open('v2-communication--search-and-notifications');
  await page.keyboard.press('Control+k');assert('One command-K handler opens the palette',await page.getByRole('dialog').isVisible());await page.getByRole('combobox',{name:'Search your workspace'}).fill('brief');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert('Keyboard search selects a result',await page.getByRole('status').innerText().then(text=>text.includes('brief')));await page.getByRole('button',{name:'Notifications (1)',exact:true}).click();await page.getByRole('button',{name:'Mark all as read'}).click();assert('Mark all removes unread count',await page.getByRole('button',{name:'Notifications',exact:true}).count()===1);await context.close();
 }
 {
  const{context,page}=await open('v2-suite--shell');await page.getByRole('button',{name:'Collapse navigation',exact:true}).click();assert('Sidebar collapse changes its actual width',await page.locator('.ot-suite-sidebar').evaluate(element=>element.getBoundingClientRect().width)===64);await page.getByRole('button',{name:'Expand navigation',exact:true}).click();assert('Sidebar expansion restores the token width',await page.locator('.ot-suite-sidebar').evaluate(element=>element.getBoundingClientRect().width)===224);await context.close();
 }
 {
  const{context,page}=await open('v2-prototype-and-ecosystem-patterns--ecosystem-cards');await page.getByRole('button',{name:'Request access',exact:true}).click();assert('Access request shows success only after the promise',await page.getByRole('status').innerText().then(text=>text.includes('Request saved')));await context.close();
 }
 {
  const{context,page,errors}=await open('v2-communication--loader-only');
  await page.getByRole('button',{name:'Notifications',exact:true}).click();await page.getByRole('button',{name:'Review launch brief',exact:false}).waitFor();assert('Loader-only notifications render actual fetched rows',await page.getByRole('button',{name:'Review launch brief',exact:false}).count()===1);await page.keyboard.press('Escape');
  await page.keyboard.press('Control+k');await page.getByRole('combobox',{name:'Search your workspace'}).fill('brief');await page.getByRole('option').first().waitFor();await page.getByRole('option').first().click();assert('Loader-only command palette selects fetched result',await page.getByRole('status').innerText().then(text=>text==='Review launch brief'));assert('Loader-only defaults do not loop or emit runtime errors',errors.length===0,errors);await context.close();
 }
 console.log(JSON.stringify({checks:checks.length,all_passed:true},null,2));
}finally{fs.mkdirSync(path.join(here,'results'),{recursive:true});fs.writeFileSync(path.join(here,'results/v2-interactions.json'),JSON.stringify({checks},null,2)+'\n');await browser.close();server.close()}
