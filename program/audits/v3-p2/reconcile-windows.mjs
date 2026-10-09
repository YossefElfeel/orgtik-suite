// Review a downloaded, revision-specific CI artifact. Never changes default references or thresholds.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(out,'../../..');
const artifact=process.argv[2];if(!artifact)throw Error('Pass the explicitly reviewed CI artifact directory.');
const require=createRequire(path.join(repo,'apps/docs/package.json')),{chromium}=require('playwright'),{PNG}=require('pngjs'),pixelmatch=(await import(pathToFileURL(require.resolve('pixelmatch')).href)).default;
const {createVisualPage,settleVisualStory,visualPageMetadata}=await import(pathToFileURL(path.join(repo,'apps/docs/tests/visual-environment.mjs')).href);
const {captureStorySemantics,semanticHashes}=await import(pathToFileURL(path.join(repo,'apps/docs/tests/platform-reference.mjs')).href);
const profile=path.join(repo,'apps/docs/tests/platform-references/windows-2025-chromium-153'),manifestFile=path.join(profile,'manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestFile)),environment=JSON.parse(fs.readFileSync(path.join(artifact,'environment.json'))),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
for(const [key,value] of Object.entries(manifest.renderer)){const actual=environment[key]??environment.expected?.[key];if(JSON.stringify(actual)!==JSON.stringify(value))throw Error('Unreviewed renderer '+key)}
const root=path.join(repo,'apps/docs/storybook-static'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>fs.readFile(path.join(root,decodeURIComponent(req.url.split('?')[0])),(error,data)=>error?res.writeHead(404).end():res.writeHead(200,{'content-type':types[path.extname(req.url.split('?')[0])]||'application/octet-stream'}).end(data))).listen(0,'127.0.0.1');
const port=await new Promise(resolve=>server.on('listening',()=>resolve(server.address().port))),browser=await chromium.launch();
const reviews=[];
try{
 for(const name of fs.readdirSync(artifact).filter(name=>name.endsWith('.png')&&!name.endsWith('.diff.png'))){
  if(!/^v2-lists-and-input--list-controls--(?:en|ar|de|fr)-(?:light|dark)\.png$/.test(name))throw Error('Artifact includes an unreviewed changed story '+name);
  const split=name.match(/^(.*)--(en|ar|de|fr)-(light|dark)\.png$/),[,story,locale,theme]=split;
  const ci=environment.renders.find(render=>render.story===story&&render.combo===`${locale}-${theme}`);if(!ci)throw Error('Missing CI render metadata '+name);
  const {context,page}=await createVisualPage(browser),globals=`theme:${theme};locale:${locale}`;
  await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${story}&viewMode=story&globals=${globals}`,{waitUntil:'networkidle'});await settleVisualStory(page,globals);
  const semantics=await captureStorySemantics(page),metadata=await visualPageMetadata(context,page);
  if(ci.semantics&&JSON.stringify(semanticHashes(ci.semantics))!==JSON.stringify(semanticHashes(semantics)))throw Error('Text/layout differ '+name);
  if(JSON.stringify(ci.platformFonts)!==JSON.stringify(metadata.platformFonts))throw Error('Selected fonts differ '+name);
  const baselineFile=path.join(repo,'apps/docs/tests/baselines',name),baselineBytes=fs.readFileSync(baselineFile),actualBytes=fs.readFileSync(path.join(artifact,name)),baseline=PNG.sync.read(baselineBytes),actual=PNG.sync.read(actualBytes);
  if(baseline.width!==actual.width||baseline.height!==actual.height)throw Error('Dimensions differ '+name);
  const diff=new PNG({width:baseline.width,height:baseline.height}),pixels=pixelmatch(baseline.data,actual.data,diff.data,baseline.width,baseline.height,{threshold:.1,diffMask:true});
  if(pixels>10)throw Error('Change exceeds the reviewed glyph-only scope '+name);
  const codeBoxes=await page.locator('kbd').evaluateAll(elements=>elements.map(element=>{const box=element.getBoundingClientRect();return {x:box.x,y:box.y,width:box.width,height:box.height}}));
  let covered=0;
  for(let y=0;y<baseline.height;y++)for(let x=0;x<baseline.width;x++){const at=(y*baseline.width+x)*4;if(diff.data[at]===255&&diff.data[at+1]===0&&diff.data[at+2]===0&&diff.data[at+3]&&codeBoxes.some(box=>x>=box.x&&x<=box.x+box.width&&y>=box.y&&y<=box.y+box.height))covered++}
  if(covered!==pixels)throw Error(`${name}: changed pixels are not wholly within the inspected keyboard legends`);
  manifest.entries[name]={...(manifest.entries[name]||{}),originalSha256:sha(baselineBytes),overrideSha256:sha(actualBytes),semantics:semanticHashes(semantics),platformFonts:ci.platformFonts,review:{scope:'P2 keyboard legend glyph rasterization only; unchanged dimensions/text/layout/fonts.',pixels}};
  fs.writeFileSync(path.join(profile,name),actualBytes);reviews.push({name,pixels,withinKeyboardLegends:covered,dimensions:[actual.width,actual.height]});await context.close();process.stdout.write('.');
 }
 manifest.v3LibraryWindowsCIReview={sourceCommit:'2c40ac6',run:'https://github.com/YossefElfeel/orgtik-suite/actions/runs/37996377927',reviewedAt:'2026-10-10',changedPairs:reviews.length,totalPixels:reviews.reduce((total,review)=>total+review.pixels,0),scope:'Every changed pixel lies inside a visible keyboard legend; text/control state/layout anchors/selected fonts and dimensions are unchanged. Defaults, 0.1 threshold, zero-pixel requirement and no-mask policy are retained.'};
 fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.join(out,'windows-ci-review.json'),JSON.stringify({reviews,provenance:manifest.v3LibraryWindowsCIReview},null,2)+'\n');
 console.log(JSON.stringify({changedPairs:reviews.length,totalPairs:Object.keys(manifest.entries).length,totalPixels:manifest.v3LibraryWindowsCIReview.totalPixels},null,2));
}finally{await browser.close();server.close()}
