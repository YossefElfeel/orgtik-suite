import fs from 'node:fs';
import { createRequire } from 'node:module';
import { load, newContext } from '../../tools/qa/lib/site.mjs';
const require = createRequire(new URL('../../tools/qa/package.json', import.meta.url));
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--disable-gpu'] });
try {
  const context = await newContext(browser, 1440), page = await context.newPage();
  await load(page, '/');
  const elements = await page.evaluate(() => [...document.querySelectorAll('*')].flatMap(node => {
    const box = node.getBoundingClientRect(), style = getComputedStyle(node);
    if (!(box.left <= 774 && box.right >= 774 && box.top + scrollY <= 2340 && box.bottom + scrollY >= 2340)) return [];
    return [{ tag: node.tagName, class: node.className, source: node.currentSrc || null, bounds: { x: box.x, y: box.y, width: box.width, height: box.height }, opacity: style.opacity, transform: style.transform, filter: style.filter, background: style.background, animation: style.animation, transition: style.transition }];
  }));
  fs.writeFileSync(new URL('home-pixel-context.json', import.meta.url), JSON.stringify(elements, null, 2) + '\n');
  console.log(JSON.stringify(elements.slice(-5)));
  await context.close();
} finally { await browser.close(); }
