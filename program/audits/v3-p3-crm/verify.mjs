import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../..'),require=createRequire(path.join(root,'apps/docs/package.json')),{chromium}=require('playwright');
const permissionOnly=process.argv.includes('--permission-only');
const report=permissionOnly?JSON.parse(fs.readFileSync(path.join(out,'report.json'),'utf8')):{date:'2026-10-10',scope:'Ordinary CRM service catalog and delivery, isolated memory demo on offset300',checks:[],captures:[],errors:[]};
const check=(name,pass,details)=>{report.checks.push({name,pass:!!pass,details});if(!pass)throw Error(name+' '+JSON.stringify(details));};
async function api(app,endpoint,session,method='GET',body){const ports={sos:7800,sales:7803,admin:7808},response=await fetch(`http://localhost:${ports[app]}${endpoint}`,{method,headers:{...(session?{authorization:'Bearer '+session.tokens.accessToken,'x-workspace':session.workspaceContext?.workspace.id||''}:{}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const raw=await response.json();return{status:response.status,data:raw.data??raw};}
const good=response=>{if(response.status>=300)throw Error(JSON.stringify(response));return response.data};
const browser=await chromium.launch({headless:true});
try{
 await fetch('http://localhost:3803/en/auth');
 const staff=good(await api('sos','/api/auth/login',null,'POST',{email:'mona.adel@orgtik.test',password:'Local@2026',mode:'workspace',workspaceId:'ws_orgtik',target:'sales'}));
 for(const locale of (permissionOnly?[]:['en','ar']))for(const theme of ['light','dark'])for(const width of [1440,768,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:1000},timezoneId:'Africa/Cairo'}),page=await context.newPage();page.setDefaultTimeout(45000);
  page.on('pageerror',error=>report.errors.push({locale,theme,width,message:error.message}));
  page.on('console',message=>{if(message.type()==='error'&&/Maximum update depth|hydration|Minified React/i.test(message.text())&&report.errors.length<20)report.errors.push({locale,theme,width,message:message.text()});});
  await context.addCookies([{name:'ot-theme',value:theme,url:'http://localhost:3803'},{name:'NEXT_LOCALE',value:locale,url:'http://localhost:3803'}]);
  const text=JSON.parse(fs.readFileSync(path.join(root,'apps/sales/messages',locale+'.json')));
  const handoff=good(await api('sos','/api/auth/handoff',staff,'POST',{audience:'tool:sales'}));
  await page.goto(`http://localhost:3803/${locale}/auth?code=${encodeURIComponent(handoff.code)}&redirect=/service-catalog`,{waitUntil:'domcontentloaded',timeout:120000});
  await page.getByRole('heading',{name:text.ServiceCatalog.title,exact:true}).waitFor({timeout:120000});
  await page.getByRole('table',{name:text.ServiceCatalog.title,exact:true}).locator('tbody tr').first().waitFor();
  if(locale==='en'&&theme==='light'&&width===1440){
   const before=good(await api('sales','/api/suite/services/catalog',staff)),offer=before.offers[0];
   await page.getByRole('button',{name:`Edit service offer · ${offer.name.en}`,exact:true}).click();
   await page.getByRole('dialog').getByRole('spinbutton',{name:'Monthly price · CHF',exact:true}).fill(String(offer.monthlyCHF+25));
   await page.getByRole('button',{name:'Save draft',exact:true}).click();
   await page.getByRole('status').filter({hasText:'Draft saved. Publish'}).waitFor();
   const draft=good(await api('sales','/api/suite/services/catalog',staff));
   check('J19 UI save persists draft while published price remains',draft.offers[0].draft.monthlyCHF===offer.monthlyCHF+25&&draft.offers[0].monthlyCHF===offer.monthlyCHF);
   await page.getByRole('button',{name:'Publish catalog',exact:true}).click();
   await page.getByRole('alertdialog').getByRole('button',{name:'Publish catalog',exact:true}).click();
   await page.getByRole('status').filter({hasText:'Catalog published at price version'}).waitFor();
   const published=good(await api('sales','/api/suite/services/catalog',staff));
   check('J19 UI publish clears draft and advances shared price version',!published.offers[0].draft&&published.offers[0].monthlyCHF===offer.monthlyCHF+25&&published.priceVersion>before.priceVersion);
   await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:`Edit service offer · ${offer.name.en}`,exact:true}).waitFor();
   check('J19 ordinary reload retains published value',(await page.getByRole('table',{name:text.ServiceCatalog.title}).innerText()).includes(String(offer.monthlyCHF+25)));
   await page.getByRole('searchbox',{name:text.ServiceCatalog.search,exact:true}).fill('no-service-match-qa');await page.getByText(text.ServiceCatalog.noMatch,{exact:true}).waitFor();
   check('Catalog no-match state offers clearing search',await page.getByRole('button',{name:text.ServiceCatalog.clearSearch,exact:true}).count()===1);
   await page.getByRole('button',{name:text.ServiceCatalog.clearSearch,exact:true}).click();
  }
  for(const route of ['service-catalog','service-catalog/pricing','service-requests']){
   if(route!=='service-catalog'){await page.goto(`http://localhost:3803/${locale}/${route}`,{waitUntil:'domcontentloaded'});if(route==='service-requests')await page.getByRole('button',{name:'New website for Nile Foods',exact:true}).waitFor();else {const current=good(await api('sales','/api/suite/services/catalog',staff));await page.getByRole('table',{name:text.ServiceCatalog.pricingTitle,exact:true}).getByText(current.offers[0].name[locale],{exact:true}).waitFor();}}
   await page.evaluate(()=>document.fonts.ready);check(`${route}/${locale}/${theme}/${width} ordinary route`,!page.url().includes('/presentation'));
   check(`${route}/${locale}/${theme}/${width} no document overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   check(`${route}/${locale}/${theme}/${width} direction/theme`,await page.evaluate(({locale,theme})=>document.documentElement.dir===(locale==='ar'?'rtl':'ltr')&&document.documentElement.dataset.theme===theme,{locale,theme}));
   await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const violations=await page.evaluate(async()=>{const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}});return result.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));});
   check(`${route}/${locale}/${theme}/${width} no serious/critical axe`,!violations.length,violations);
   const name=`${route.replaceAll('/','-')}-${locale}-${theme}-${width}.png`;await page.screenshot({path:path.join(out,name)});report.captures.push(name);
  }
  if(locale==='en'&&theme==='light'&&width===1440){
   await page.getByRole('button',{name:'New website for Nile Foods',exact:true}).click();await page.getByRole('dialog').waitFor();
   await page.getByRole('button',{name:'Start review',exact:true}).click();await page.getByRole('button',{name:'Send quote',exact:true}).waitFor();
   check('Service review persists after actual callback',good(await api('sales','/api/suite/services/requests',staff)).find(r=>r.title==='New website for Nile Foods').state==='under_review');
   await page.getByRole('button',{name:'Send quote',exact:true}).click();await page.getByRole('dialog').last().getByRole('textbox',{name:'Quote line description',exact:true}).fill('Bilingual service delivery');await page.getByRole('spinbutton',{name:'Amount · EGP',exact:true}).fill('12000');await page.getByRole('button',{name:'Review quote',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Send quote',exact:true}).click();
   await page.getByRole('dialog').getByText('Quoted',{exact:true}).waitFor();
   const quoted=good(await api('sales','/api/suite/services/requests',staff)).find(r=>r.title==='New website for Nile Foods');check('Service quote amount/currency/validity persisted',quoted.quote.total===12000&&quoted.quote.currency==='EGP'&&quoted.state==='quoted');
   await page.getByRole('button',{name:'Send message',exact:true}).click();await page.getByRole('dialog').last().getByRole('textbox',{name:'Message',exact:true}).fill('Service QA: your quote is ready for review.');await page.getByRole('dialog').last().getByRole('button',{name:'Send message',exact:true}).click();await page.getByText('Service QA: your quote is ready for review.',{exact:true}).waitFor();
   check('Delivery conversation persists actual message',good(await api('sales','/api/suite/services/requests',staff)).find(r=>r.id===quoted.id).messages.some(m=>m.text.startsWith('Service QA:')));
   await page.screenshot({path:path.join(out,'request-reviewed-quote-message.png')});report.captures.push('request-reviewed-quote-message.png');
  }
  await context.close();
 }
 const owner=good(await api('sos','/api/auth/register',null,'POST',{email:`catalog-owner-${Date.now()}@v3-crm.test`,name:'V3 customer CRM admin',password:'StrongFixture!'}));
 good(await api('sos','/api/suite/tools/crm/trial',owner,'POST',{planId:'crm_pro'}));
 const customer=good(await api('sos','/api/auth/workspace',owner,'POST',{workspaceId:owner.workspaceContext.workspace.id,target:'sales'}));
 check('Denied fixture is a subscribed customer CRM admin',customer.workspaceContext.workspace.kind==='customer'&&customer.workspaceContext.tools.crm.roles.includes('admin'));
 check('Customer CRM catalog remains denied',(await api('sales','/api/suite/services/catalog',customer)).status===403);
 check('No application runtime errors',report.errors.length===0,report.errors);report.completed=true;delete report.failure;
}catch(failure){report.failure=failure.message;const active=browser.contexts().at(-1)?.pages().at(-1);if(active)await active.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw failure;}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({checks:report.checks.length,captures:report.captures.length,completed:report.completed}));
