import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=process.cwd(), out=path.join(root,'program/audits/v3-p4-marketing');
const require=createRequire(path.join(root,'apps/docs/package.json')),{chromium}=require('playwright');
const web='http://localhost:4415', api='http://localhost:8405';
const login=await fetch('http://localhost:8400/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'mona.adel@orgtik.test',password:'Local@2026',mode:'workspace',workspaceId:'ws_orgtik',target:'marketing'})}).then(r=>r.json());
const token=login.data.tokens.accessToken, headers={authorization:'Bearer '+token,'content-type':'application/json'};
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage();
const report={scope:'Actual accepted reply whose response is lost, then page reload and ordinary resend', requests:[]};
try {
 const code=(await fetch('http://localhost:8400/api/auth/handoff',{method:'POST',headers,body:JSON.stringify({audience:'tool:marketing'})}).then(r=>r.json())).data.code;
 await page.goto(web+'/en/auth?code='+code+'&redirect=/social-inbox');
 await page.waitForURL(/social-inbox$/);await page.getByRole('textbox',{name:'Reply',exact:true}).waitFor();
 let dropped=false;
 await page.route('**/v3/social-inbox/*/replies', async route=>{
  report.requests.push(JSON.parse(route.request().postData()));
  if(!dropped){dropped=true;const response=await route.fetch();report.acceptedStatus=response.status();await route.abort('internetdisconnected');}else await route.continue();
 });
 const body='Lost-response reload proof';
 await page.getByRole('textbox',{name:'Reply',exact:true}).fill(body);await page.getByRole('button',{name:'Record mock reply',exact:true}).click();
 await page.getByText('The server could not be reached',{exact:false}).waitFor().catch(()=>page.getByRole('button',{name:'Record mock reply',exact:true}).waitFor());
 await page.reload();await page.getByRole('textbox',{name:'Reply',exact:true}).waitFor();
 await page.getByRole('textbox',{name:'Reply',exact:true}).fill(body);await page.getByRole('button',{name:'Record mock reply',exact:true}).click();
 await page.waitForResponse(r=>r.request().method()==='POST'&&r.url().includes('/replies'));
 const threads=(await fetch(api+'/v3/social-inbox',{headers}).then(r=>r.json())).data;
 report.persistedCopies=threads.flatMap(row=>row.replies).filter(row=>row.body===body).length;
 report.distinctOperations=new Set(report.requests.map(row=>row.operationId)).size;
 await page.screenshot({path:path.join(out,'recovery-before.png'),fullPage:true});
 report.demonstratedDuplication=report.acceptedStatus===200&&report.persistedCopies===2&&report.distinctOperations===2;
 if(!report.demonstratedDuplication)throw Error('Unexpected recovery-before result');
} catch(error){report.failure=error.message;throw error;} finally{fs.writeFileSync(path.join(out,'recovery-before-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
