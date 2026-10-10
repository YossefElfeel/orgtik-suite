import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../..');
const require=createRequire(path.join(root,'apps/docs/package.json')),{chromium}=require('playwright');
const messages=JSON.parse(fs.readFileSync(path.join(root,'apps/sales/messages/en.json'))),m=key=>key.split('.').reduce((o,k)=>o[k],messages);
const previous=(process.argv.includes('--resume')||process.argv.includes('--payout'))?JSON.parse(fs.readFileSync(path.join(out,'retained-report.json'))):null;
const report={scope:'Retained actual CRM constructor, customer negotiation, signed approval and payout',checks:previous?.checks.filter(r=>r.pass)||[],captures:previous?.captures.filter(r=>!r.includes('failure'))||[],records:previous?.records,errors:[]};
const check=(name,pass,details)=>{report.checks.push({name,pass:!!pass,details});if(!pass)throw Error(name+' '+JSON.stringify(details));};
async function api(app,url,session,method='GET',body){const r=await fetch(`http://localhost:${app==='sales'?7803:7800}${url}`,{method,headers:{...(session?{authorization:'Bearer '+session.tokens.accessToken,'x-workspace':session.workspaceContext.workspace.id}:{}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const raw=await r.json();if(r.status>=300)throw Error(JSON.stringify(raw));return raw.data;}
const browser=await chromium.launch({headless:true});let page;
const login=email=>api('sos','/api/auth/login',null,'POST',{email,password:'Local@2026',mode:'workspace',workspaceId:'ws_orgtik',target:'sales'});
async function open(session,route){const ctx=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'Africa/Cairo'});page=await ctx.newPage();page.setDefaultTimeout(120000);page.on('pageerror',e=>report.errors.push(e.message));const code=await api('sos','/api/auth/handoff',session,'POST',{audience:'tool:sales'});await page.goto(`http://localhost:3813/en/auth?code=${code.code}&redirect=${encodeURIComponent(route)}`,{waitUntil:'domcontentloaded'});await page.waitForURL(u=>u.pathname==='/en'+route);}
const shot=async name=>{await page.screenshot({path:path.join(out,name+'.png')});report.captures.push(name+'.png');fs.writeFileSync(path.join(out,'retained-progress.json'),JSON.stringify(report,null,2)+'\n');};
async function select(label,option,d){await d.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:option}).click();}
try{
 const omar=await login('omar.farouk@orgtik.test'),nour=await login('nour.khaled@nilefoods.test'),mona=await login('mona.adel@orgtik.test'),sherif=await login('sherif.magdy@orgtik.test');
 if(!process.argv.includes('--payout')) {
 let offerId=report.records?.offerId;
 if(!offerId){
  await open(omar,'/offers');await page.getByRole('button',{name:m('Offers.newOffer'),exact:true}).click();const d=page.getByRole('dialog',{name:m('Deal.titleNewOffer'),exact:true});
  await d.getByRole('searchbox').fill('Nile');await d.getByRole('radio',{name:/Nour Khaled/}).click({force:true});await d.getByRole('button',{name:m('Deal.next'),exact:true}).click();
  await d.getByRole('region',{name:m('Deal.standardSection'),exact:true}).waitFor();check('Retired catalog chooser is labelled compatibility data',await d.getByText(/compatibility catalog/i).count()>0);
  await select(m('Deal.addPlan'),/Corporate Web Presence/,d);await select(m('Deal.durationLabel'),/^12\s/,d);await d.getByText(m('Deal.payInstallments'),{exact:true}).click();await select(m('Deal.termLabel'),/^12 monthly payments/,d);
  await d.getByRole('button',{name:m('Deal.next'),exact:true}).click();await d.getByRole('button',{name:m('Deal.next'),exact:true}).click();await d.getByRole('button',{name:m('Deal.sendOffer'),exact:true}).click();await page.waitForURL(u=>/\/offers\/[\w-]+$/.test(u.pathname));
  offerId=new URL(page.url()).pathname.split('/').at(-1);report.records={offerId};const o=await api('sales',`/api/offers/${offerId}`,omar);check('S2 actual constructor keeps 12-month installments',o.summary.lines[0].durationMonths===12&&o.summary.lines[0].paymentMethod==='installments'&&Number(o.summary.lines[0].installmentMonths)===12);await shot('retained-created-installment-offer');
 }
 const offer=await api('sales',`/api/offers/${offerId}`,omar),counter=Math.round(Number(offer.quotedTotal)*.9);
 if(!['countered','accepted'].includes(offer.status)){
  await open(nour,`/offers/${offerId}`);await page.getByRole('button',{name:m('Offers.counter'),exact:true}).first().click();const d=page.getByRole('dialog',{name:/Counter the offer/});await d.getByRole('textbox').first().fill(String(counter));await d.getByRole('button',{name:/Send counter of/}).click();await d.waitFor({state:'hidden'});
 }else await open(nour,`/offers/${offerId}`);
 check('S3 actual customer counter persists negotiated total',Number((await api('sales',`/api/offers/${offerId}`,omar)).counterTotal)===counter);await shot('retained-customer-counter');
 await open(omar,`/offers/${offerId}`);if(offer.status!=='accepted'){await page.getByRole('button',{name:m('Offers.accept'),exact:true}).first().click();await page.getByRole('alertdialog').getByRole('button',{name:/^Accept at/}).click();await page.getByRole('link',{name:m('Offers.openProject'),exact:true}).first().waitFor();}
 const accepted=await api('sales',`/api/offers/${offerId}`,omar),project=await api('sales',`/api/projects/${accepted.projectId}`,omar);report.records.projectId=project.id;check('S3 acceptance creates actual project at agreed total',accepted.status==='accepted'&&Number(project.latestContract.grandTotal)===counter);
 await page.getByRole('link',{name:m('Offers.openProject'),exact:true}).first().click();await page.waitForURL(u=>u.pathname.endsWith(accepted.projectId));await page.getByRole('heading',{name:m('Projects.contractTitle'),exact:true}).waitFor();await shot('retained-negotiated-project');
 const pending=(await api('sales','/api/projects?limit=100',sherif)).items.find(r=>r.latestContract?.isSigntuerd&&r.latestContract.status==='pending');
 await open(sherif,`/projects/${pending.id}`);await page.getByRole('button',{name:m('Projects.approve'),exact:true}).first().click();const d=page.getByRole('dialog',{name:m('Projects.commissionTitle'),exact:true});
 await d.getByRole('radio',{name:new RegExp('^'+m('Projects.commissionPercentage'))}).check();await d.getByRole('textbox',{name:m('Projects.commissionPercentLabel'),exact:true}).fill('8');await d.getByRole('button',{name:m('Projects.continue'),exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:m('Projects.approveConfirm'),exact:true}).click();await page.getByRole('alertdialog').waitFor({state:'hidden'});
 const approved=(await api('sales',`/api/projects/${pending.id}`,sherif)).latestContract;check('S4 recorded signed approval keeps price and sets 8% commission',approved.status==='approved'&&approved.commissionMode==='percentage'&&Number(approved.commissionPercentage)===8&&approved.grandTotal===pending.latestContract.grandTotal&&approved.signedPdfPath.url===pending.latestContract.signedPdfPath.url);await shot('retained-approved-signed-contract');
 }
 const cm=(await api('sales','/api/commissions?limit=100',mona)).items.find(r=>r.status==='unpaid'||r.payoutStatus==='unpaid'),part=Math.max(1,Math.floor(Number(cm.amount)/3));await open(mona,'/commissions');await page.getByRole('button',{name:new RegExp('Pay commission.*'+cm.reference)}).click();const payout=page.getByRole('dialog',{name:/Pay commission/});
 await payout.getByRole('textbox',{name:m('Team.payout.amount'),exact:true}).fill(String(part));await payout.getByRole('textbox',{name:m('Team.payout.reference'),exact:true}).fill('CRM-P4-REAL-PAYOUT');await payout.getByRole('button',{name:m('Team.payout.review'),exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:/^Pay/}).click();await page.getByRole('alertdialog').waitFor({state:'hidden'});
 const paid=(await api('sales','/api/commissions?limit=100',mona)).items.find(r=>r.id===cm.id);check('S5 actual partial payout changes paid and remaining amounts',/partial/.test(paid.status||paid.payoutStatus)&&Number(paid.paidAmount)===part);await shot('retained-partial-commission-payout');
 await open(sherif,'/commissions');await page.getByRole('heading',{name:m('Team.commissions.title'),exact:true}).waitFor();check('S5 manager has no payout action',await page.getByRole('button',{name:/^Pay/}).count()===0);check('Retained business has zero application errors',report.errors.length===0,report.errors);report.completed=true;
}catch(e){report.failure=e.message;if(page)await shot('retained-failure').catch(()=>{});throw e;}finally{report.checks=[...new Map(report.checks.map(r=>[r.name,r])).values()];report.captures=[...new Set(report.captures)];fs.writeFileSync(path.join(out,'retained-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}console.log(JSON.stringify({checks:report.checks.length,captures:report.captures.length,completed:report.completed}));
