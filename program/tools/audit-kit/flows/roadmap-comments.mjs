// Read-only sample discussions: exercise real comment buttons, keyboard behavior, and narrow dialogs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {auditState} from '../lib/audit-state.mjs';
import {AUDITS, WORKSPACE} from '../lib/suite.mjs';
import {axe, settle} from '../lib/checks.mjs';
const audit = await auditState('roadmap-comments.mjs');
const out = process.env.AUDIT_OUT ?? path.join(AUDITS, 'wm/followup');
fs.mkdirSync(out,{recursive:true});
const results = []; let browser;
async function check(name, fn) {
  try { results.push({name, ok:true, note:await fn()}); console.log('ok '+name); }
  catch (error) { results.push({name, ok:false, note:error.message}); console.log('FAIL '+name+': '+error.message); }
}
const seed = JSON.parse(fs.readFileSync(path.join(WORKSPACE,'local-dev/apps/wm/seed/website.json')));
const ideas = seed.ideas.filter(idea => ['open','planned','in_progress','shipped'].includes(idea.status));
async function openComments(page, idea) {
  const card = page.getByText(idea.title,{exact:true}).first().locator('..');
  const button = card.getByRole('button',{name:idea.comments+' comments',exact:true});
  await button.click();
  const dialog = page.getByRole('dialog'); await dialog.waitFor();
  await dialog.getByRole('heading',{name:'Comments',exact:true}).waitFor();
  return {button,dialog};
}
try {
  browser = await chromium.launch();
  await check('public sample threads match counts and never expose pending ideas', async () => {
    const response = await fetch('http://localhost:4007/v2/public/ideas'); assert(response.ok);
    const publicIdeas = (await response.json()).data; assert.equal(publicIdeas.length,7);
    for (const idea of publicIdeas) {
      assert.equal(idea.commentPreview.length,idea.comments);
      assert(idea.commentPreview.every(comment => comment.sample && comment.author.startsWith('Sample reader ')));
      assert.equal(new Set(idea.commentPreview.map(comment => comment.id)).size,idea.comments);
    }
    for (const pending of seed.ideas.filter(idea=>idea.status==='pending')) assert(!publicIdeas.some(idea=>idea.id===pending.id));
    return 'Seven idea-specific threads, 31 sample comments; three pending ideas remain private.';
  });
  const context = await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  try {
    const page = await context.newPage(); await page.goto('http://localhost:4173/roadmap',{waitUntil:'networkidle'}); await settle(page);
    for (const idea of ideas) await check('comments button shows the correct thread: '+idea.id,async () => {
      const {button,dialog} = await openComments(page,idea);
      assert.equal(await dialog.locator('[data-idea-comment]').count(),idea.comments);
      for (const comment of idea.commentPreview) assert(await dialog.getByText(comment.body,{exact:true}).isVisible());
      assert(await dialog.getByText('Sample discussion: these comments are examples, not submitted feedback.',{exact:true}).isVisible());
      for (const other of ideas.filter(other=>other.id!==idea.id)) assert.equal(await dialog.locator(`[data-idea-comment^="${other.id}-"]`).count(),0);
      await page.keyboard.press('Escape'); await dialog.waitFor({state:'detached'});
      await page.waitForFunction(()=>document.activeElement?.classList.contains('reference-state-177'));
      assert(await button.evaluate(element=>element===document.activeElement));
      return idea.comments+' matching comments; Escape returns focus to the original button.';
    });
  } finally {await context.close();}
  for (const site of ['http://localhost:4173','http://127.0.0.1:4280']) {
    for (const locale of site.includes('4173')?['en','ar']:['en']) for (const width of [320,390,768,1440]) {
      await check(`comment dialog fits and remains accessible: ${site} ${locale} ${width}`,async()=>{
        const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
        try {
          const page=await ctx.newPage(); const errors=[]; page.on('pageerror',error=>errors.push(error.message));
          await page.goto(site+(locale==='ar'?'/ar':'')+'/roadmap',{waitUntil:'networkidle'}); await settle(page);
          const idea=ideas.find(idea=>idea.id==='accessible-review'); const {dialog}=await openComments(page,idea);
          assert.equal(await dialog.locator('[data-idea-comment]').count(),6);
          assert(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth+1));
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
          const buttons=dialog.getByRole('button'); await buttons.last().focus(); await page.keyboard.press('Tab');
          assert(await buttons.first().evaluate(element=>element===document.activeElement));
          await buttons.first().focus(); await page.keyboard.press('Shift+Tab'); assert(await buttons.last().evaluate(element=>element===document.activeElement));
          await dialog.locator('[data-idea-comment]').last().scrollIntoViewIfNeeded();
          assert(await dialog.locator('[data-idea-comment]').last().isVisible());
          const accessibility=await axe(page); assert.equal(accessibility.critical,0);
          assert.deepEqual(errors,[]);
          await page.screenshot({path:path.join(out,`comments-${site.includes('4173')?'dev':'production'}-${locale}-${width}.png`)});
          return {comments:6,overflow:false,accessibility};
        } finally {await ctx.close();}
      });
    }
  }
  await check('an empty thread shows an honest empty state',async()=>{
    const app=path.join(WORKSPACE,'orgtik-website/landing-directions');
    const source=fs.readFileSync(path.join(app,'src/content/snapshot.js'),'utf8');
    const data=JSON.parse(source.slice(source.indexOf('export default ')+15).trim().replace(/;$/,''));
    const idea=data.ideas.find(idea=>idea.id==='accessible-review'); idea.commentPreview=[]; idea.comments=0;
    const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    try {
      await ctx.route('**/src/content/snapshot.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:'export default '+JSON.stringify(data)+';'}));
      const page=await ctx.newPage(); await page.goto('http://localhost:4173/roadmap',{waitUntil:'networkidle'}); await settle(page);
      const {dialog}=await openComments(page,idea);
      assert(await dialog.getByText('No comments to show yet.',{exact:true}).isVisible());
      assert.equal(await dialog.locator('[data-idea-comment]').count(),0);
      return 'The browser-only fixture does not invent comments or alter the mock/snapshot.';
    } finally {await ctx.close();}
  });
} finally {
  await browser?.close(); await audit.cleanup();
  fs.mkdirSync(out,{recursive:true}); fs.writeFileSync(path.join(out,'roadmap-comments.json'),JSON.stringify({at:new Date().toISOString(),passed:results.filter(result=>result.ok).length,total:results.length,results},null,2)+'\n');
}
console.log(`${results.filter(result=>result.ok).length}/${results.length} comment checks passed`);
if(results.some(result=>!result.ok))process.exitCode=1;
