// Read-only HTTP timings, kept separate from browser journey timings and build duration.
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
const root=path.resolve(import.meta.dirname,'../..');
const origin=process.env.ORGTIK_MEASURE_ORIGIN||'http://127.0.0.1:3057';
const parsed=new URL(origin);
if(!['localhost','127.0.0.1'].includes(parsed.hostname)||parsed.protocol!=='http:'||parsed.pathname!=='/')throw Error('Use a local suite origin.');
async function timing(route){const start=performance.now();const response=await fetch(origin+route,{signal:AbortSignal.timeout(120000)});await response.arrayBuffer();return {ms:Math.round(performance.now()-start),status:response.status};}
const rows=[];
for(const route of ['/sos/auth/login','/hr/ar','/tasks/en','/sos/api/backend/wm/v2/public/site']){
  const first=await timing(route),warm=[];for(let i=0;i<3;i++)warm.push(await timing(route));
  rows.push({route,first,warm,medianWarmMs:warm.map(row=>row.ms).sort((a,b)=>a-b)[1]});
}
let runtime;try{runtime=JSON.parse(fs.readFileSync(path.join(root,'.vercel/local-suite/running.json'),'utf8'));}catch{}
const report={measuredAt:new Date().toISOString(),origin,kind:'HTTP documents and API, not browser hydration',startupMs:runtime?.startupMs,routerRssBytes:runtime?.rssBytes,services:runtime?.services,rows};
const output=path.join(root,'.vercel/local-suite/performance-'+(runtime?.mode||'unknown')+'.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
