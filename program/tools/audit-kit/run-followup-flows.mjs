// Serial execution: each flow owns mock.lock() and restores its exact pre-flow files in finally.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const all=['wm-s0','wm-s1','wm-s1b','wm-s1c','wm-s1d','wm-s2','wm-s3','wm-seo','wm-preview','wm-lifecycle','wm-overview','site-paths','site-heads','site-forms','site-connection'];
const asked=process.argv.indexOf('--only');const names=asked>=0?process.argv[asked+1].split(','):all;
const result=[];
for(const name of names){
 if(!all.includes(name))throw new Error('Unknown flow '+name);
 console.log(`\nRunning ${name}`);
 const started=Date.now();const run=spawnSync(process.execPath,[path.join(import.meta.dirname,'flows',name+'.mjs')],{encoding:'utf8',maxBuffer:16<<20});
 console.log(run.stdout);if(run.stderr)console.log(run.stderr);
 const summaries=[...run.stdout.matchAll(/^(?:PASS|FAIL) (\d+)\/(\d+)\s/gm)];
 const end=/^(\d+)\/(\d+) passed/m.exec(run.stdout)??/^(\d+) of (\d+) steps passed/m.exec(run.stdout);
 const connection=name==='site-connection'?{passed:(run.stdout.match(/^ok /gm)??[]).length,total:(run.stdout.match(/^(?:ok |NO )/gm)??[]).length}:null;
 const counts=summaries.length?{passed:summaries.reduce((n,m)=>n+Number(m[1]),0),total:summaries.reduce((n,m)=>n+Number(m[2]),0)}:end?{passed:Number(end[1]),total:Number(end[2])}:connection;
 result.push({name,exitCode:run.status,durationSeconds:Math.round((Date.now()-started)/1000),...counts});
 fs.mkdirSync(path.resolve(import.meta.dirname,'../../audits/wm/followup'),{recursive:true});
 const log=(run.stdout+(run.stderr?'\n'+run.stderr:'')).replace(/[ \t]+$/gm,'').trimEnd()+'\n';
 fs.writeFileSync(path.resolve(import.meta.dirname,'../../audits/wm/followup/'+name+'.log'),log);
 fs.writeFileSync(path.resolve(import.meta.dirname,'../../audits/wm/followup/flow-runs-'+names[0]+'.json'),JSON.stringify(result,null,2)+'\n');
}
if(result.some(r=>r.exitCode!==0))process.exitCode=1;
