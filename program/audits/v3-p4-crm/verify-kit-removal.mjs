import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('apps/sales'),reportPath='program/audits/v3-p4-crm/kit-cleanup.json',report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
const selected=new Set(report.files.map(file=>path.resolve(root,file))),survivors=[];
function walk(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){if(['node_modules','.next','.next-demo'].includes(entry.name))continue;const file=path.join(folder,entry.name);if(entry.isDirectory())walk(file);else if(/\.(ts|tsx)$/.test(file)&&!selected.has(file))survivors.push(file);}}
walk(root);
const outside=[];
for(const file of survivors)for(const match of fs.readFileSync(file,'utf8').matchAll(/["'](@\/[^"']+|\.{1,2}\/[^"']+)["']/g)){const base=match[1].startsWith('@/')?path.join(root,match[1].slice(2)):path.resolve(path.dirname(file),match[1]);for(const target of [base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')])if(selected.has(target))outside.push({consumer:path.relative(root,file),target:path.relative(root,target)});}
report.outsideConsumers=outside;report.survivingFiles=survivors.length;report.guardChecks=[];
for(const module of ['coupons','invoices','packages','plan-management','subscriptions','tickets']){const file=path.join(root,'app/[locale]/(dashboard)',module,'page.tsx');const guarded=/retiredSalesRoute/.test(fs.readFileSync(file,'utf8'));report.guardChecks.push({module,guarded});if(!guarded)throw Error('Unguarded retired module '+module);}
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
if(outside.length)throw Error(JSON.stringify(outside));
console.log(`${selected.size} exact reviewed kit/retired frontend files, ${survivors.length} preserved sources, zero static/dynamic import consumers, six guarded retired modules`);
