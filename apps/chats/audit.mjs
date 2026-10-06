import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const PAGES = ['/hq/office', '/hq/chat/c-design', '/hq/meetings', '/hq/insights', '/hq/settings', '/guest/mt-1', '/tasks/t-4471'];

const browser = await chromium.launch();
const findings = [];

for (const path of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const out = { unnamed: [], imgNoAlt: 0, smallTargets: [], h1: 0 };
    document.querySelectorAll('h1').forEach(() => out.h1++);
    document.querySelectorAll('button, a[href], [role="button"]').forEach((el) => {
      const name = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim();
      if (!name) out.unnamed.push(el.tagName + '.' + (el.className || '').toString().slice(0, 40));
      /* A stretched link makes its whole positioned ancestor clickable via an
         inset ::after, so the element's own box understates the real target.
         Measure what a finger actually hits, not what the <a> box reports. */
      let r = el.getBoundingClientRect();
      const after = getComputedStyle(el, '::after');
      const stretched =
        after.position === 'absolute' &&
        ['0px', 'auto'].indexOf(after.top) === -1 === false &&
        after.top === '0px' && after.bottom === '0px' &&
        after.left === '0px' && after.right === '0px';
      if (stretched) {
        let host = el.parentElement;
        while (host && getComputedStyle(host).position === 'static') host = host.parentElement;
        if (host) r = host.getBoundingClientRect();
      }
      if (r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24)) {
        out.smallTargets.push(`${el.tagName} ${Math.round(r.width)}x${Math.round(r.height)} "${name.slice(0,20)}"`);
      }
    });
    document.querySelectorAll('img').forEach((i) => { if (!i.hasAttribute('alt')) out.imgNoAlt++; });
    return out;
  });

  findings.push({
    path,
    h1: r.h1,
    unnamedControls: r.unnamed.length,
    imgNoAlt: r.imgNoAlt,
    tinyTargets: r.smallTargets.length,
    sample: r.unnamed[0] || r.smallTargets[0] || '',
  });
  await page.close();
}

// Keyboard: can the floor be reached and operated without a mouse?
const kb = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await kb.goto(BASE + '/hq/office', { waitUntil: 'networkidle' });
await kb.waitForTimeout(400);
const tabbed = [];
for (let i = 0; i < 22; i++) {
  await kb.keyboard.press('Tab');
  tabbed.push(await kb.evaluate(() => {
    const a = document.activeElement;
    return a ? (a.getAttribute('aria-label') || a.textContent || a.tagName).trim().slice(0, 46) : 'none';
  }));
}
console.log('\nKEYBOARD PATH ON THE FLOOR:');
tabbed.forEach((t, i) => console.log(`  ${String(i + 1).padStart(2)}. ${t}`));

console.log('\nPER-PAGE AUDIT:');
console.table(findings);
await browser.close();
