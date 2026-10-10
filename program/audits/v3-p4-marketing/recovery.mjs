import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const root=process.cwd(),out=path.join(root,'program/audits/v3-p4-marketing'),require=createRequire(path.join(root,'apps/docs/package.json')),{chromium}=require('playwright');
const web=process.env.MARKETING_QA_WEB||'http://localhost:4405',report={scope:'Native accepted-but-lost response recovery through ordinary Marketing controls',checks:[],captures:[],requests:[],errors:[]};
function check(name,pass,details){report.checks.push({name,pass:!!pass,details});if(!pass)throw Error(name+' '+JSON.stringify(details));}
const login=await fetch('http://localhost:8400/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'mona.adel@orgtik.test',password:'Local@2026',mode:'workspace',workspaceId:'ws_orgtik',target:'marketing'})}).then(r=>r.json()),token=login.data.tokens.accessToken,headers={authorization:'Bearer '+token,'content-type':'application/json'};
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage();page.setDefaultTimeout(180000);page.on('pageerror',e=>report.errors.push(e.message));
const shot=async name=>{await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});report.captures.push(name);};
const native=async()=> (await fetch('http://localhost:8405/v3/social-inbox',{headers}).then(r=>r.json())).data;
try {
 await page.goto(web+'/en/auth',{timeout:180000});
 const code=(await fetch('http://localhost:8400/api/auth/handoff',{method:'POST',headers,body:JSON.stringify({audience:'tool:marketing'})}).then(r=>r.json())).data.code;
 await page.goto(web+'/en/auth?code='+code+'&redirect=/social-inbox',{timeout:180000});await page.waitForURL(/social-inbox$/);await page.getByRole('textbox',{name:'Reply',exact:true}).waitFor();
 let dropped=false,release;const accepted=new Promise(resolve=>release=resolve),body='Recovered original reply after reload '+process.pid;
 await page.route('**/v3/social-inbox/*/replies',async route=>{report.requests.push(JSON.parse(route.request().postData()));if(!dropped){dropped=true;const response=await route.fetch();report.acceptedStatus=response.status();await route.abort('internetdisconnected');release();}else await route.continue();});
 await page.getByRole('textbox',{name:'Reply',exact:true}).fill(body);await page.getByRole('button',{name:'Record mock reply',exact:true}).click();await accepted;
 await page.getByRole('region',{name:'Unconfirmed changes',exact:true}).waitFor();
 check('Native server accepted one event before response was lost',report.acceptedStatus===200&&(await native()).flatMap(row=>row.replies).filter(row=>row.body===body).length===1);
 await shot('recovery-uncertain');await page.reload();await page.getByRole('region',{name:'Unconfirmed changes',exact:true}).waitFor();
 const retained=await page.evaluate(()=>Object.keys(sessionStorage).filter(k=>k.startsWith('orgtik.marketing-command.v1:')).map(k=>JSON.parse(sessionStorage.getItem(k))));
 check('Reload retains original body and operation, without tokens or HTML',retained.length===1&&retained[0].body.operationId===report.requests[0].operationId&&retained[0].body.body===body&&!JSON.stringify(retained).includes('accessToken')&&!JSON.stringify(retained).includes('<html'));
 await page.getByRole('textbox',{name:'Reply',exact:true}).fill('Changed details must not create another reply');await page.getByRole('button',{name:'Record mock reply',exact:true}).click();
 await page.getByText('Check the original unconfirmed change before submitting different details.',{exact:true}).first().waitFor();
 check('Changed payload is blocked before another network mutation',report.requests.length===1);
 await shot('recovery-changed-payload-refused');
 const response=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().includes('/replies'));
 await page.getByRole('button',{name:'Check original change',exact:true}).click();check('Explicit recovery returns native prior receipt',(await response).status()===200);await page.getByRole('region',{name:'Unconfirmed changes',exact:true}).waitFor({state:'hidden'});
 check('Recovery reuses exactly the original operation/body',report.requests.length===2&&JSON.stringify(report.requests[0])===JSON.stringify(report.requests[1]));
 check('Recovery persists exactly one event', (await native()).flatMap(row=>row.replies).filter(row=>row.body===body).length===1);
 check('Confirmed receipt clears saved pending operation',await page.evaluate(()=>Object.keys(sessionStorage).filter(k=>k.startsWith('orgtik.marketing-command.v1:')).length)===0);
 await shot('recovery-confirmed');check('No runtime errors',report.errors.length===0,report.errors);report.completed=true;
}catch(error){report.failure=error.message;await shot('recovery-failure').catch(()=>{});throw error;}finally{fs.writeFileSync(path.join(out,'recovery-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
