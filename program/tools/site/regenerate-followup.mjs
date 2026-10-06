// Regenerate changed readers and remap every existing message against the same seed.
// This reads only the pinned upstream revision and Roadmap override; it never edits main.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const root = path.resolve(import.meta.dirname,'../../..');
const repo = path.join(root,'orgtik-website');
const app = path.join(repo,'landing-directions');
const ref = path.join(app,'src/reference');
const {restoredRoadmap,followupSource,ROADMAP_REF,WEBSITE_REF} = await import(pathToFileURL(path.join(root,'local-dev/apps/wm/seed/source-overrides.mjs')));
const {parse} = createRequire(path.join(root,'local-dev/package.json'))('@babel/parser');
const read = (rev,file) => execFileSync('git',['-C',repo,'show',`${rev}:landing-directions/src/reference/${file}`],{encoding:'utf8',maxBuffer:16<<20});
let roadmap = restoredRoadmap(read(ROADMAP_REF,'Roadmap.jsx'));
const ast = parse(roadmap,{sourceType:'module',plugins:['jsx']});
const edits=[];
const walk = n => { if(!n||typeof n!=='object')return; if(Array.isArray(n))return n.forEach(walk);
  if(n.type==='ClassProperty' && ['RM','IDEAS','SOCIALS'].includes(n.key?.name)) edits.push({start:n.value.start,end:n.value.end,text:`content.${n.key.name}()`});
  for(const [k,v] of Object.entries(n))if(k!=='loc'&&v&&typeof v==='object')walk(v);
};walk(ast.program);
for(const e of edits.sort((a,b)=>b.start-a.start))roadmap=roadmap.slice(0,e.start)+e.text+roadmap.slice(e.end);
roadmap = 'import {content} from "../content";\nimport {SEND_FAILED,sendIdea} from "../content/forms";\n'+roadmap;
roadmap = roadmap.replace(/        this\.setState\(\{\n          ideaSent: true,[\s\S]*?\n        \}\);/, match => `        const done = () => ${match.trim().replace('ideaSent: true,','ideaSent: true, ideaSending: false,')};\n        this.setState({ideaSending:true,ideaErr:""});\n        sendIdea({name:n,email:em,message:m,topic:this.state.topic}).then(done).catch(() => this.setState({ideaErr:SEND_FAILED,ideaSending:false}));`);
roadmap = roadmap.replace('this.parseRoute(location.hash)', 'this.parseRoute(routeHash())').replace('location.hash = "#/";', 'setRoute("#/");').replace('import { toSiteHref }', 'import { routeHash, setRoute, toSiteHref }');
fs.writeFileSync(path.join(ref,'Roadmap.jsx'),roadmap);
const changed=['Roadmap','PaymentDetails','purchase-payment','purchase-identity','purchase-adapter'];
for(const file of ['PaymentDetails.jsx','purchase-payment.js','purchase-identity.js','purchase-adapter.js']) fs.writeFileSync(path.join(ref,file),followupSource(file,read(WEBSITE_REF,file)));
const seed=JSON.parse(fs.readFileSync(path.join(root,'local-dev/apps/wm/seed/website.json'),'utf8'));
for(const kind of ['copy','strings']) {
  const full=path.join(app,`src/content/${kind}-templates.js`);
  const templates=(await import(`${pathToFileURL(full)}?t=${Date.now()}`)).default;
  if(kind==='strings')for(const [id,t] of Object.entries(templates)) {
    if(!new Set(['purchase-adapter:1','purchase-adapter:5','PurchaseCheckout:19','CaseStudy:18']).has(id) && (!/\{\d+\}/.test(t.seed)||!/^[a-z0-9_-]+$/.test(t.seed.replace(/\{\d+\}/g,''))))continue;
    const base=id.split(':')[0], file=['.jsx','.js'].map(ext=>path.join(ref,base+ext)).find(f=>fs.existsSync(f));
    if(file){let source=fs.readFileSync(file,'utf8');const edits=[];
      const visit=n=>{if(!n||typeof n!=='object')return;if(Array.isArray(n))return n.forEach(visit);
        if(n.type==='CallExpression'&&n.callee.name==='msg'&&n.arguments[0]?.value===id){
          const args=n.arguments[1]?.elements??[];
          const text=t.shape.map(p=>typeof p==='string'?JSON.stringify(p):`(${source.slice(args[p].start,args[p].end)})`).join(' + ');
          edits.push({start:n.start,end:n.end,text});return;
        }for(const [k,v] of Object.entries(n))if(k!=='loc'&&v&&typeof v==='object')visit(v);
      };visit(parse(source,{sourceType:'module',plugins:['jsx']}).program);
      for(const e of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.text+source.slice(e.end);
      fs.writeFileSync(file,source);
    }delete templates[id];
  }
  for(const [key,t] of Object.entries(templates)) {
    if(kind==='copy' && (key.startsWith('pg_roadmap|') || key.startsWith('gl_commerce|paymentDetails-'))) {delete templates[key];continue;}
    if(kind==='strings') {
      if(changed.some(n=>key.startsWith(n+':')) || key==='AccountControl:1' || key==='PurchaseCheckout:36' || key==='SignIn:17') {delete templates[key];continue;}
      const entry=seed.entries.find(e=>e.id===t.k.split('|')[0]);
      const candidates=[entry,seed.entries.find(e=>e.id==='st_shared')].filter(Boolean);
      const matches=candidates.flatMap(e=>(e.layout??[]).flatMap(sec=>sec.slots.map(slot=>({k:`${e.id}|${sec.key}|${slot.key}`,text:e.locales.en[sec.key][slot.key]}))));
      const match=matches.find(m=>m.text===t.seed);
      if(match)t.k=match.k;
      else throw new Error(`Cannot remap ${key}: ${t.seed}`);
    }
  }
  fs.writeFileSync(full,`export default ${JSON.stringify(templates,null,1)};\n`);
}
// Technical values cannot be edited as reader copy.
const checkout=path.join(ref,'PurchaseCheckout.jsx');
fs.writeFileSync(checkout,fs.readFileSync(checkout,'utf8').replace(/msg\("PurchaseCheckout:36",\s*\[\s*method.id,?\s*\]\)/g,'`purchase-method-${method.id}-description`'));
const signIn=path.join(ref,'SignIn.jsx');
fs.writeFileSync(signIn,fs.readFileSync(signIn,'utf8').replace('msg("SignIn:17", [signup ? "signup" : "signin"])','`account-${signup ? "signup" : "signin"}-tab`'));
execFileSync(process.execPath,[path.join(import.meta.dirname,'connect-copy.mjs')],{stdio:'inherit'});
execFileSync(process.execPath,[path.join(import.meta.dirname,'connect-strings.mjs')],{stdio:'inherit'});
const payment=path.join(ref,'PaymentDetails.jsx');
const values='[TEST_CARD_NUMBERS[0].replace(/(.{4})(?=.)/g, "$1 "), TEST_CARD_NUMBERS[1].replace(/(.{4})(?=.)/g, "$1 "), TEST_CARD_EXPIRY, TEST_CARD_SECURITY_CODE]';
fs.writeFileSync(payment,fs.readFileSync(payment,'utf8').replace(/run\("gl_commerce\|paymentDetails-intro\|p", (\d+)\)/g,(_,index)=>`run("gl_commerce|paymentDetails-intro|p", ${index}, ${values})`));
// Stable focus targets shared by all header implementations.
for(const file of fs.readdirSync(ref).filter(f=>f.endsWith('.jsx'))) {
  const full=path.join(ref,file);let source=fs.readFileSync(full,'utf8');
  if (!source.includes('data-menu-toggle')) source=source.replace(/(<button\s+)(?=[\s\S]{0,180}className="site-menu-trigger")/g,'$1data-menu-toggle="" ');
  if(file==='SiteHeader.jsx') source=source.replace(/<button\b[^>]*className="commerce-menu site-menu-trigger"[^>]*>/, opening => opening.includes('data-menu-toggle') ? opening : opening.replace('<button','<button data-menu-toggle=""'));
  fs.writeFileSync(full,source);
}
execFileSync(process.execPath,[path.join(import.meta.dirname,'connect-navigation-copy.mjs')],{stdio:'inherit'});
const workFile=path.join(ref,'Work.jsx');
fs.writeFileSync(workFile,fs.readFileSync(workFile,'utf8').replace(/<span className="site-menu-trigger__label">\s*\{"Menu"\}\s*<\/span>/,'<span className="site-menu-trigger__label">{run("gl_header|header|button", 1)}</span>'));
console.log('Follow-up readers and mappings regenerated together. Pull the reset mock snapshot next.');
