import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const SHOTS = [
  ['d-office',   1440, 900,  '/hq/office'],
  ['d-chat',     1440, 900,  '/hq/chat/c-design'],
  ['d-catchup',  1440, 900,  '/hq/chat/catch-up'],
  ['d-task',     1440, 900,  '/tasks/t-4471'],
  ['d-meetings', 1440, 900,  '/hq/meetings'],
  ['d-meeting',  1440, 900,  '/hq/meetings/mt-1'],
  ['d-call',     1440, 900,  '/hq/meetings/mt-1/call'],
  ['d-insights', 1440, 900,  '/hq/insights'],
  ['d-trans',    1440, 900,  '/hq/insights/transparency'],
  ['d-settings', 1440, 900,  '/hq/settings'],
  ['d-setup',    1440, 900,  '/hq/setup'],
  ['d-guest',    1440, 900,  '/guest/mt-1'],
  ['d-search',   1440, 900,  '/hq/chat/search?q=invoice'],
  ['m-office',   390,  844,  '/hq/office'],
  ['m-chat',     390,  844,  '/hq/chat/c-design'],
  ['m-me',       390,  844,  '/hq/me'],
  ['m-guest',    390,  844,  '/guest/mt-1'],
];

const browser = await chromium.launch();
const report = [];

for (const [name, w, h, path] of SHOTS) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    permissions: [],
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message.slice(0, 120)));
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const overflow = await page.evaluate(() => {
    const d = document.documentElement;
    return { scroll: d.scrollWidth, client: d.clientWidth };
  });
  await page.screenshot({ path: `.shots/${name}.png` });
  report.push({ name, path, overflow: overflow.scroll > overflow.client + 1 ? `OVERFLOW ${overflow.scroll}>${overflow.client}` : 'ok', errors: errors.length });
  if (errors.length) report[report.length - 1].firstError = errors[0];
  await ctx.close();
}

await browser.close();
console.table(report);
