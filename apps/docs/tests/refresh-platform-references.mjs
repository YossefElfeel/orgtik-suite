// Explicit local review utility: keep the enumerated Windows pairs aligned with a DS release.
// It cannot run in CI or accept a render that differs from the reviewed default reference.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {VISUAL_ENVIRONMENT,createVisualPage,settleVisualStory,visualPageMetadata} from './visual-environment.mjs';
import {captureStorySemantics,semanticHashes} from './platform-reference.mjs';
import {compareVisualBaseline} from './visual-baseline.mjs';
if(['true','1'].includes((process.env.CI||'').toLowerCase()))throw Error('Platform references require explicit local review, never CI acceptance.');
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../storybook-static');
const directory=path.join(here,'platform-references/windows-2025-chromium-153'),file=path.join(directory,'manifest.json');
const manifest=JSON.parse(fs.readFileSync(file,'utf8')),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{const name=path.join(root,decodeURIComponent(req.url.split('?')[0]));fs.readFile(name,(error,data)=>{if(error)return res.writeHead(404).end();res.writeHead(200,{'content-type':types[path.extname(name)]||'application/octet-stream'}).end(data)})}).listen(0,'127.0.0.1');
const port=await new Promise(resolve=>server.on('listening',()=>resolve(server.address().port)));
const browser=await chromium.launch(),renderer={platform:os.platform(),release:os.release(),browser:browser.version(),...VISUAL_ENVIRONMENT};
try{
 for(const [key,value] of Object.entries(manifest.renderer))if(JSON.stringify(renderer[key])!==JSON.stringify(value))throw Error(`Renderer differs from the reviewed profile: ${key}`);
 const entries={};
 for(const name of Object.keys(manifest.entries)){
  const match=name.match(/^(.*)--(en|ar|de|fr)-(light|dark)\.png$/);if(!match)throw Error('Unexpected reference name '+name);
  const [,story,locale,theme]=match,{context,page}=await createVisualPage(browser);
  const globals=`theme:${theme};locale:${locale}`;
  await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${story}&viewMode=story&globals=${globals}`,{waitUntil:'networkidle'});
  await settleVisualStory(page,globals);
  const metadata=await visualPageMetadata(context,page),semantics=await captureStorySemantics(page);
  const bytes=await page.screenshot({fullPage:true}),baseline=path.join(here,'baselines',name);
  const difference=compareVisualBaseline(PNG.sync.read(bytes),baseline);
  if(difference.visual!=='same')throw Error(`${name}: ${difference.visual}; inspect the default before updating a platform pair.`);
  entries[name]={...manifest.entries[name],originalSha256:sha(fs.readFileSync(baseline)),overrideSha256:sha(bytes),semantics:semanticHashes(semantics),platformFonts:metadata.platformFonts};
  fs.writeFileSync(path.join(directory,name),bytes);await context.close();process.stdout.write('.');
 }
 manifest.entries=entries;manifest.reviewedAt='2026-10-09';
 manifest.v3FoundationsRefresh={date:'2026-10-09',basis:'Owner continuation instruction; DS v2 tokens and self-hosted Plex. Every enumerated pair re-rendered on the exact declared renderer and matched its reviewed default pixel-for-pixel; CI remains a separate gate.',pairs:Object.keys(entries).length};
 fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({refreshed:Object.keys(entries).length,defaultPixelMatches:Object.keys(entries).length,renderer},null,2));
}finally{await browser.close();server.close()}
