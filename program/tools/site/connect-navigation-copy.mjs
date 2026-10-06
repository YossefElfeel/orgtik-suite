// Bind only the exact view-model array nodes; never match across adjacent properties.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..'),repo=path.join(root,'orgtik-website');
const {parse}=createRequire(path.join(root,'local-dev/package.json'))('@babel/parser');
for(const file of ['Home.jsx','SignIn.jsx']) {
 const full=path.join(repo,'landing-directions/src/reference',file);
 let source=process.argv.includes('--recover') ? execFileSync('git',['-C',repo,'show',`d32eb8c:landing-directions/src/reference/${file}`],{encoding:'utf8',maxBuffer:16<<20}) : fs.readFileSync(full,'utf8');
 const edits=[], adapters={menuLinks:'MENU',footExplore:'FOOT_EXPLORE',footStart:'FOOT_START'};
 const walk=n=>{if(!n||typeof n!=='object')return;if(Array.isArray(n))return n.forEach(walk);
  if(n.type==='ObjectProperty' && adapters[n.key?.name])edits.push({start:n.value.start,end:n.value.end,text:`content.${adapters[n.key.name]}()`});
  for(const [k,v] of Object.entries(n))if(k!=='loc'&&v&&typeof v==='object')walk(v);
 };walk(parse(source,{sourceType:'module',plugins:['jsx']}).program);
 for(const e of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.text+source.slice(e.end);
 if (!source.includes('data-menu-toggle')) source=source.replace('className="site-menu-trigger"','data-menu-toggle="" className="site-menu-trigger"');
 fs.writeFileSync(full,source);
}
