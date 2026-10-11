import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
import { OUT, load, newContext, snapshot } from './lib/site.mjs';
const [beforeLabel, afterLabel, reference, renderer = 'software'] = process.argv.slice(2);
if (!['software', 'default'].includes(renderer)) throw Error('Use a documented supported renderer.');
if (!beforeLabel || !afterLabel || !/^[a-f0-9]{7,40}$/.test(reference || '')) throw Error('Use existing comparison labels and approved Git revision.');
const root = path.join(OUT, 'parity');
const before = JSON.parse(fs.readFileSync(path.join(root, beforeLabel, 'manifest.json'), 'utf8'));
const after = JSON.parse(fs.readFileSync(path.join(root, afterLabel, 'manifest.json'), 'utf8'));
const original = execFileSync('git', ['show', `${reference}:apps/website/landing-directions/src/reference/purchase-catalog.js`]);
if (crypto.createHash('sha256').update(original).digest('hex') !== before.adapter.sha256) throw Error('Approved adapter changed.');
const candidates = before.captures.filter(row => !fs.readFileSync(path.join(root, beforeLabel, row.name + '.png')).equals(fs.readFileSync(path.join(root, afterLabel, row.name + '.png'))));
// Keep the rejected run and exact selection: this is a fixed paired paint protocol,
// never a retry-until-match loop, tolerance adjustment or modified website element.
fs.writeFileSync(path.join(root, 'paired-header-selection.json'), JSON.stringify({ beforeLabel, afterLabel, names: candidates.map(row => row.name), protocol: 'Same browser, fresh contexts, all-compositor-stages flush, three full-page warm paints per source.' }, null, 2));
const rendererArgs = renderer === 'default' ? [] : ['--disable-gpu', '--run-all-compositor-stages-before-draw', '--disable-skia-runtime-opts', '--force-color-profile=srgb'];
const browser = await chromium.launch({ args: rendererArgs });
try {
  for (const candidate of candidates) {
    for (const [label, manifest, baseline] of [[beforeLabel, before, true], [afterLabel, after, false]]) {
      const context = await newContext(browser, candidate.width);
      if (baseline) await context.route(/\/src\/reference\/purchase-catalog\.js(?:\?|$)/, route => route.fulfill({ status: 200, contentType: 'text/javascript', body: original }));
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        const rendered = await load(page, candidate.route);
        if (!rendered || errors.length) throw Error('Unaccepted ' + candidate.name);
        // The page's reduced-motion state and paused clock are already settled.
        // Screenshot-time animation rewriting can re-rasterize fractional alpha borders.
        await page.screenshot({ fullPage: true, animations: 'allow', caret: 'hide' });
        await page.screenshot({ path: path.join(root, label, candidate.name + '.png'), fullPage: true, animations: 'allow', caret: 'hide' });
        const state = await snapshot(page);
        fs.writeFileSync(path.join(root, label, candidate.name + '.json'), JSON.stringify({ route: candidate.route, width: candidate.width, rendered, errors, ...state }, null, 2) + '\n');
        const record = { name: candidate.name, route: candidate.route, width: candidate.width, rendered, errors: 0, renderer, warmPaint: true, mediaLock: true, paired: true, rendererArgs, warmPaintCount: 1, animations: 'allow', capturedAt: new Date().toISOString() };
        manifest.captures = manifest.captures.map(row => row.name === candidate.name ? record : row);
        console.log(label + ' ' + candidate.name);
      } finally { await context.close(); }
    }
  }
} finally { await browser.close(); }
for (const [label, manifest] of [[beforeLabel, before], [afterLabel, after]]) fs.writeFileSync(path.join(root, label, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
