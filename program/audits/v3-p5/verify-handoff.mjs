import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../apps/docs/package.json', import.meta.url));
const { chromium } = require('playwright');
const root = process.cwd(), directory = 'program/audits/v3-p5', report = { checks: [], captures: [], errors: [] };
function check(name, pass, detail) { report.checks.push({ name, pass: !!pass, ...(detail ? { detail } : {}) }); assert.ok(pass, name); }
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (!pathname.startsWith('/program/') && !pathname.startsWith('/packages/ui/fonts/')) { response.writeHead(404).end(); return; }
  const filename = path.resolve(root, '.' + pathname);
  if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) { response.writeHead(404).end(); return; }
  const types = { '.html': 'text/html;charset=utf-8', '.json': 'application/json;charset=utf-8', '.png': 'image/png', '.woff2': 'font/woff2', '.md': 'text/plain;charset=utf-8', '.csv': 'text/csv;charset=utf-8' };
  response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(filename).pipe(response);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch();
try {
  const origin = 'http://127.0.0.1:' + server.address().port;
  for (const width of [1440, 390]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 } });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) report.errors.push(response.url() + ' ' + response.status()); });
    await page.goto(origin + '/' + directory + '/handoff.html');
    await page.getByText('407 أرقام وعناوين أصلية محفوظة، وكل نتيجة ليها دليل وحدود.', { exact: true }).waitFor();
    if (theme === 'dark') await page.getByRole('button', { name: 'الوضع الغامق', exact: true }).click();
    await page.evaluate(() => document.fonts.ready);
    check(`${width}/${theme}: nine source cycle rows`, await page.locator('#cycleRows tr').count() === 9);
    check(`${width}/${theme}: initial criteria50`, await page.locator('#findings tr').count() === 50);
    check(`${width}/${theme}: actual table cells padded`, await page.locator('#cycleRows td').first().evaluate(element => parseFloat(getComputedStyle(element).paddingInlineStart) >= 12));
    check(`${width}/${theme}: actual section padding`, await page.locator('#cycles').evaluate(element => parseFloat(getComputedStyle(element).paddingBlockStart) >= 28));
    check(`${width}/${theme}: no document overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } })).violations.filter(row => ['serious', 'critical'].includes(row.impact)).map(row => ({ id: row.id, targets: row.nodes.map(node => node.target) })));
    check(`${width}/${theme}: serious/critical axe`, violations.length === 0, violations);
    const filename = `handoff-ar-${theme}-${width}.png`;
    await page.screenshot({ path: directory + '/' + filename }); report.captures.push(filename);
    await page.getByRole('searchbox', { name: 'ابحث في الملاحظات', exact: true }).fill('SR-021');
    check(`${width}/${theme}: exact finding search`, await page.locator('#findings tr').count() === 1 && (await page.locator('#findings').innerText()).includes('SR-021'));
    await page.getByRole('searchbox', { name: 'ابحث في الملاحظات', exact: true }).fill('');
    await page.getByRole('combobox', { name: 'فلتر نتيجة المراجعة', exact: true }).selectOption('deferred_tier_c');
    check(`${width}/${theme}: exact TierC filter17`, await page.locator('#findings tr').count() === 17);
    await page.getByRole('button', { name: 'قبل دورة Chats', exact: true }).click();
    await page.locator('#compareImage').evaluate(image => image.decode());
    check(`${width}/${theme}: real before image`, (await page.locator('#compareImage').getAttribute('src')).includes('baseline-chat'));
    await context.close();
  }
  check('No resource or runtime errors', report.errors.length === 0, report.errors);
  report.completed = true;
} finally {
  fs.writeFileSync(directory + '/handoff-qa.json', JSON.stringify(report, null, 2) + '\n');
  await browser.close(); await new Promise(resolve => server.close(resolve));
}
console.log({ checks: report.checks.length, captures: report.captures.length });
