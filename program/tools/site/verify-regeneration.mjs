// Pin provenance, compare semantic seed content, and check every generated binding.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {WEBSITE_REF,ROADMAP_REF} from '../../../local-dev/apps/wm/seed/source-overrides.mjs';
const root=path.resolve(import.meta.dirname,'../../..');
const seedFile=path.join(root,'local-dev/apps/wm/seed/website.json');
const read=()=>JSON.parse(fs.readFileSync(seedFile));
const normalize=x=>{const y=structuredClone(x);delete y.source.builtAt;return y;};
const before=read();
execFileSync(process.execPath,['apps/wm/seed/build.mjs'],{cwd:path.join(root,'local-dev'),stdio:'inherit'});
const after=read();assert.deepEqual(normalize(after),normalize(before));
assert.equal(after.source.commit,WEBSITE_REF.slice(0,7));assert.equal(after.source.overrides.roadmap.commit,ROADMAP_REF);
const app=path.join(root,'orgtik-website/landing-directions');
const all=[...after.entries,...after.caseStudies];const entries=new Map(all.map(e=>[e.id,e]));
const counts={};
for(const kind of ['copy','strings']){
 const templates=(await import(pathToFileURL(path.join(app,`src/content/${kind}-templates.js`)))).default;
 for(const [id,t] of Object.entries(templates)){
  const [entry,block,slot]=(kind==='copy'?id:t.k).split('|');const value=entries.get(entry)?.locales.en[block]?.[slot];
  assert.equal(value,t.seed,`Stale ${kind} binding: ${id}`);
 }
 counts[kind]=Object.keys(templates).length;
}
const result={at:new Date().toISOString(),seedEquivalentExcludingBuiltAt:true,source:after.source,bindings:counts};
const out=path.resolve(import.meta.dirname,'../../audits/wm/sync-20261006/regeneration.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log('Seed regeneration matches excluding source.builtAt; all copy and string bindings match the seed.');
