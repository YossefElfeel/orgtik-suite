// Local, offline report QA. Use an installed Playwright module; no new dependency install.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const args=process.argv.slice(2), value=flag=>args[args.indexOf(flag)+1];
if(!args.includes('--playwright')||!args.includes('--axe')) throw Error('Supply --playwright <index.mjs> and --axe <axe.min.js>');
const { chromium }=await import(pathToFileURL(path.resolve(value('--playwright'))).href);
const out=path.dirname(fileURLToPath(import.meta.url)), report=path.resolve(out,'../../v3-report.html');
const browser=await chromium.launch({headless:true});
const runs=[],errors=[],checks=[];
const assert=(name,pass,details)=>{checks.push({name,pass:Boolean(pass),details});if(!pass){fs.writeFileSync(path.join(out,'report-review.json'),JSON.stringify({checks,errors},null,2)+'\n');throw Error(name+' '+JSON.stringify(details))}};
try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  await page.goto(pathToFileURL(report).href);
  await page.evaluate(()=>document.fonts.ready);
  for(const width of [390,768,1024,1440])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height:900});
    const current=await page.locator('html').getAttribute('data-theme');
    if(current!==theme)await page.locator('#theme').click();
    for(const view of ['before','after']){
      await page.locator(view==='before'?'#before-button':'#after-button').click();
      if(view==='before')await page.locator('#before-image').evaluate(image=>image.decode());
      const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,rtl:document.documentElement.dir,loadedFonts:document.fonts.status}));
      assert(`${width}/${theme}/${view}: no document overflow and RTL`,size.scroll<=size.width&&size.rtl==='rtl',size);
      if(view==='after'&&[390,1440].includes(width)){
        await page.addScriptTag({path:path.resolve(value('--axe'))});
        const axe=await page.evaluate(async()=>{const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return result.violations.map(item=>({id:item.id,impact:item.impact,nodes:item.nodes.length,failures:item.nodes.map(node=>({target:node.target,summary:node.failureSummary}))}))});
        const severe=axe.filter(item=>['critical','serious'].includes(item.impact));
        assert(`${width}/${theme}: no critical/serious axe violations`,!severe.length,axe);
        const name=`report-ar-${theme}-${width}.png`;
        await page.evaluate(()=>window.scrollTo(0,0));
        await page.screenshot({path:path.join(out,name),fullPage:true});
        await page.screenshot({path:path.join(out,`report-top-${theme}-${width}.png`)});
        if(width===1440)await page.locator('#after-view').screenshot({path:path.join(out,`report-concept-${theme}.png`)});
        runs.push({width,theme,view,screenshot:name,axe});
      }else runs.push({width,theme,view});
    }
  }
  for(const persona of ['owner','member'])for(const state of ['available','unsubscribed','seat','readonly']){
    await page.locator('#persona').selectOption(persona);
    await page.locator(`[data-state="${state}"]`).click();
    const action=await page.locator('#state-action').innerText();
    assert(`${persona}/${state}: connection explanation updates`,action.length>15&&await page.locator(`[data-state="${state}"]`).getAttribute('aria-pressed')==='true',action);
  }
  assert('No report script or resource errors',errors.length===0,errors);
  fs.writeFileSync(path.join(out,'report-review.json'),JSON.stringify({checked_at:'2026-10-09',scope:'Offline report only; conceptual after-view is not an implemented DS v2 screen.',runs,checks,errors},null,2)+'\n');
  console.log(JSON.stringify({checks:checks.length,runs:runs.length,captures:runs.filter(run=>run.screenshot).length,all_passed:true},null,2));
}finally{await browser.close()}
