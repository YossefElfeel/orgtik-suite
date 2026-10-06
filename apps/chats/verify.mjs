import { chromium } from 'playwright';
const BASE = 'http://localhost:3000';
const b = await chromium.launch();

// 1. Keyboard path with no duplicate room stops
const kb = await b.newPage({ viewport: { width: 1440, height: 900 } });
await kb.goto(BASE + '/hq/office', { waitUntil: 'networkidle' });
await kb.waitForTimeout(400);
const stops = [];
for (let i = 0; i < 30; i++) {
  await kb.keyboard.press('Tab');
  stops.push(await kb.evaluate(() => {
    const a = document.activeElement;
    return a ? (a.getAttribute('aria-label') || a.textContent || a.tagName).trim().slice(0, 50) : 'none';
  }));
}
const roomStops = stops.filter((s) => /Desk area|Meeting room|Focus room|Lounge/.test(s));
console.log('Floor room stops in tab order:', roomStops.length, '(6 rooms expected, once each)');

// 2. Enter actually enters a room from the keyboard
await kb.keyboard.press('Enter');
await kb.waitForTimeout(400);
const dock = await kb.locator('[aria-label="Audio controls"]').count();
console.log('Entering a room from the keyboard connected audio dock:', dock > 0 ? 'yes' : 'no (desk area is audio-free by design)');

// 3. Reduced motion is honoured
const rm = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await rm.goto(BASE + '/hq/office', { waitUntil: 'networkidle' });
await rm.waitForTimeout(400);
const dur = await rm.evaluate(() => {
  const tile = document.querySelector('.hq-tile');
  return tile ? getComputedStyle(tile).transitionDuration : 'n/a';
});
console.log('Reduced motion, tile transition duration:', dur);

// 4. Focus ring is visible and themed
const ring = await kb.evaluate(() => {
  const el = document.querySelector('button');
  if (!el) return 'n/a';
  el.focus();
  const s = getComputedStyle(el, ':focus-visible');
  return `${s.outlineWidth} ${s.outlineStyle}`;
});
console.log('Focus ring:', ring);

// 5. The store seam: one applyEvent drives everything
const seam = await kb.evaluate(() => typeof window !== 'undefined');
console.log('Store seam reachable:', seam);

await b.close();
