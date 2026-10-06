// Rebuild only changed bindings, preserving the incumbent CMS and accessibility code.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {followupSource,WEBSITE_REF} from '../../../local-dev/apps/wm/seed/source-overrides.mjs';
const root=path.resolve(import.meta.dirname,'../../..');
const app=path.join(root,'orgtik-website/landing-directions');
const {parse}=createRequire(path.join(root,'local-dev/package.json'))('@babel/parser');
const copy=(await import(pathToFileURL(path.join(app,'src/content/copy-templates.js')))).default;
const strings=(await import(pathToFileURL(path.join(app,'src/content/strings-templates.js')))).default;
const original=async file=>(await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(execFileSync('git',['-C',path.join(root,'orgtik-website'),'show',`backup/cms-before-sync-20261006:landing-directions/src/content/${file}-templates.js`],{encoding:'utf8',maxBuffer:16<<20})))).default;
const originalCopy=await original('copy'),originalStrings=await original('strings');
for(const file of ['Work.jsx','CaseStudy.jsx']) {
 const full=path.join(app,'src/reference',file);let source=execFileSync('git',['-C',path.join(root,'orgtik-website'),'show',`${file==='CaseStudy.jsx'?WEBSITE_REF:'backup/cms-before-sync-20261006'}:landing-directions/src/reference/${file}`],{encoding:'utf8'});const edits=[];
 const walk=n=>{if(!n||typeof n!=='object')return;if(Array.isArray(n))return n.forEach(walk);
  if(n.type==='CallExpression'&&['run','attr','msg'].includes(n.callee.name)){
   const key=n.arguments[0]?.value;let text;
   if(n.callee.name==='run')text=JSON.stringify(originalCopy[key].runs[n.arguments[1].value].o);
   if(n.callee.name==='attr')text=JSON.stringify(originalCopy[key].o);
   if(n.callee.name==='msg'){
    const t=originalStrings[key],args=n.arguments[1]?.elements??[];
    text=t.shape.map(x=>typeof x==='string'?JSON.stringify(x):`(${source.slice(args[x].start,args[x].end)})`).join(' + ');
   }
   edits.push({start:n.start,end:n.end,text});return;
  }
  for(const [k,v]of Object.entries(n))if(k!=='loc'&&v&&typeof v==='object')walk(v);
 };walk(parse(source,{sourceType:'module',plugins:['jsx']}).program);
 for(const e of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.text+source.slice(e.end);
 if(file==='Work.jsx'){
  const replacements={
   'Our work,':'Every project,',
   'Explore OrgTik work across brand, design, and digital experiences.':'From OrgTik-owned work to concept previews. Each story shows its status up front, so nothing is presented as more than it is.',
   '(02)':'(05)','(03)':'(06)',
   'OrgTik brand applications across print, digital screens, and signage.':'These frames show OrgTik brand applications until approved project captures are supplied. Drop your own images onto any frame.',
   'Explore more work from OrgTik.':'Two more stories from the studio, each with its status clearly shown.'
  };
  for(const [before,after]of Object.entries(replacements))source=source.replace(JSON.stringify(before),JSON.stringify(after));
  // Only the hero's second line changes; the gallery keeps its existing heading.
  const hero=source.indexOf('"Every project,"');const line=source.indexOf('"up close."',hero);
  if(hero>=0 && line>=0)source=source.slice(0,line)+source.slice(line).replace('"up close."','"clearly labelled."');
 } else {
  source=followupSource(file,source);
 }
 fs.writeFileSync(full,source);
}
for(const key of Object.keys(copy))if(key.startsWith('pg_work|')||key.startsWith('gl_components|caseStudy-'))delete copy[key];
for(const key of Object.keys(strings))if(key.startsWith('Work:')||key.startsWith('CaseStudy:'))delete strings[key];
fs.writeFileSync(path.join(app,'src/content/copy-templates.js'),'export default '+JSON.stringify(copy,null,1)+';\n');
fs.writeFileSync(path.join(app,'src/content/strings-templates.js'),'export default '+JSON.stringify(strings,null,1)+';\n');
const translations={
 en:['Public sample case-study story','Shows the story and results with visible sample labels after review and publication. Figures remain unapproved.'],
 ar:['قصة دراسة حالة تجريبية عامة','تظهر القصة والنتائج مع تسميات تجريبية واضحة بعد المراجعة والنشر. تظل الأرقام غير معتمدة.'],
 de:['Öffentliche Beispiel-Fallstudie','Zeigt Geschichte und Ergebnisse nach Prüfung und Veröffentlichung mit sichtbaren Beispielhinweisen. Die Zahlen bleiben unbestätigt.'],
 fr:['Récit public de cas d’exemple','Affiche le récit et les résultats avec des mentions d’exemple après validation et publication. Les chiffres restent non approuvés.'],
 it:['Caso di studio pubblico di esempio','Mostra il racconto e i risultati con etichette di esempio dopo revisione e pubblicazione. I dati restano non approvati.']
};
for(const [lang,[title,help]]of Object.entries(translations)){
 const file=path.join(root,'orgtik-website-manager/messages',lang+'.json');const data=JSON.parse(fs.readFileSync(file));
 const section=Object.values(data).find(x=>x.narrativeTitle);section.sampleNarrativeTitle=title;section.sampleNarrativeHelp=help;
 fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
}
