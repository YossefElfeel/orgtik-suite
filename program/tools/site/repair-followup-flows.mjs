import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'../../..');
const dir=path.join(root,'orgtik-program/tools/audit-kit/flows');
const {parse}=createRequire(path.join(root,'local-dev/package.json'))('@babel/parser');
for(const file of fs.readdirSync(dir).filter(f=>/^(wm-|site-).+\.mjs$/.test(f))) {
 const full=path.join(dir,file);let src=fs.readFileSync(full,'utf8');
 if(src.includes('auditState('))continue;
 src=src.replace(/execFileSync\("git", \["-C", SITE_REPO, "checkout", "--",[^\n]*\);/g,'audit.restoreFiles();');
 src=src.replace(/process\.exit\(([^;]*?)\);/g,'process.exitCode = $1;');
 if(file==='site-forms.mjs')src=src.replace(/const unlock = await mock\.lock\([^\n]*\);/,'const unlock = () => {};');
 const ast=parse(src,{sourceType:'module'});const last=ast.program.body.filter(n=>n.type==='ImportDeclaration').at(-1).end;
 src=src.slice(0,last)+'\nconst audit = await auditState("'+file+'");\ntry {\n'+src.slice(last)+'\n} finally { await audit.cleanup(); }\n';
 src='import {auditState} from "../lib/audit-state.mjs";\n'+src;
 fs.writeFileSync(full,src);
}
const fixtureFile=path.join(root,'orgtik-program/tools/audit-kit/lib/case-fixtures.json');
const old=JSON.parse(fs.readFileSync(path.join(root,'orgtik-sync-backup-20261005/original-seed/website.json'),'utf8'));
fs.writeFileSync(fixtureFile,JSON.stringify(old.caseStudies.filter(c=>c.id!=='cs_01').map(({id,slug,department,locales,image,gallery})=>({id,slug,department,locales,image,gallery})),null,2)+'\n');
const s1=path.join(dir,'wm-s1.mjs');let source=fs.readFileSync(s1,'utf8');
if(!source.includes('caseFixtures')) {
 source='import {caseFixtures} from "../lib/content-fixtures.mjs";\n'+source.replace('await mock.reset();','await mock.reset();\nconst fixtureIds = await caseFixtures();');
 source=source.replace(/"(cs_0[2-5])"/g,'fixtureIds["$1"]').replace(/"\/admin\/entries\/caseStudy\/(cs_0[2-5])"/g,'`/admin/entries/caseStudy/${fixtureIds["$1"]}`');
 fs.writeFileSync(s1,source);
}
const s1d=path.join(dir,'wm-s1d.mjs');source=fs.readFileSync(s1d,'utf8');
if(!source.includes('roadmapFixture')){
 source='import {roadmapFixture} from "../lib/content-fixtures.mjs";\n'+source.replace('await mock.reset();','await mock.reset();\nconst roadmapId = await roadmapFixture();');
 source=source.replace('"/en/content/roadmap/rm_04"','`/en/content/roadmap/${roadmapId}`').replace('"/admin/entries/roadmapItem/rm_04"','`/admin/entries/roadmapItem/${roadmapId}`');
 source=source.replace('versions.length === 2 && versions[0].versionLabel === "1.0" && versions[1].versionLabel === "0.1"','versions.length === 3 && versions[0].versionLabel === "1.0" && versions[1].versionLabel === "0.2" && versions[2].versionLabel === "0.1"').replace('e.legalVersions.length === 1','e.legalVersions.length === 2');
 fs.writeFileSync(s1d,source);
}
