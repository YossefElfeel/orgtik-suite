import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(out, '../../..'), require = createRequire(path.join(root, 'apps/docs/package.json')), { chromium } = require('playwright');
const locales = ['en', 'ar'], themes = ['light', 'dark'], widths = [390, 768, 1024, 1440];
const routes = [['/billing', 'billingOperations'], ['/releases', 'releases'], ['/ecosystem', 'connectors'], ['/staff/security', 'twoFactor'], ['/staff/invitations', 'invitations'], ['/tickets/targets', 'ticketTargets'], ['/tax/checks', 'taxChecks'], ['/catalog/software', 'softwareCatalog'], ['/setup', 'setup']];
const report = { scope: 'Ordinary Console EN/AR, light/dark, mobile/tablet/desktop; actual staff preference projection', checks: [], captures: [], errors: [] };
const check = (name, pass, details) => { report.checks.push({ name, pass: Boolean(pass), details }); if (!pass) throw Error(name + ' ' + JSON.stringify(details)); };
async function api(port, endpoint, token, method = 'GET', body) {
  const response = await fetch(`http://localhost:${port}${endpoint}`, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const raw = await response.json(); if (!response.ok) throw Error(JSON.stringify(raw)); return raw.data;
}
const browser = await chromium.launch({ headless: true }), context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Africa/Cairo' }), page = await context.newPage();
page.setDefaultTimeout(120000); page.on('pageerror', error => report.errors.push(error.message));
try {
  const person = await api(8600, '/api/auth/login', null, 'POST', { email: 'mona.adel@orgtik.test', password: 'Local@2026' });
  const staff = await api(8600, '/api/auth/workspace', person.tokens.accessToken, 'POST', { mode: 'staff', target: 'admin' });
  const code = await api(8600, '/api/auth/handoff', staff.tokens.accessToken, 'POST', { audience: 'staff:admin' });
  await page.goto(`http://localhost:4608/en/auth?code=${encodeURIComponent(code.code)}&redirect=/billing`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.getByRole('heading', { name: 'Billing operations', exact: true }).waitFor();
  for (const locale of locales) for (const theme of themes) {
    await api(8608, '/v1/admin/console/preferences', staff.tokens.accessToken, 'PATCH', { theme });
    const t = JSON.parse(fs.readFileSync(path.join(root, `apps/admin/messages/${locale}/console.json`), 'utf8')).ConsoleV3;
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      for (const [route, key] of routes) {
        const name = `matrix-${route.slice(1).replaceAll('/', '-')}-${locale}-${theme}-${width}`;
        await page.goto(`http://localhost:4608/${locale}${route}`, { waitUntil: 'domcontentloaded' });
        await page.getByRole('heading', { name: t[key], exact: true }).first().waitFor();
        await page.getByText(t.loading, { exact: true }).waitFor({ state: 'hidden' });
        await page.waitForFunction(expected => document.documentElement.dataset.theme === expected, theme);
        check(name + ': native appearance and direction', await page.evaluate(({ theme, locale }) => document.documentElement.dataset.theme === theme && document.documentElement.dir === (locale === 'ar' ? 'rtl' : 'ltr'), { theme, locale }));
        check(name + ': no document overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        check(name + ': translated copy', !/MISSING_MESSAGE|ConsoleV3\./.test(await page.locator('body').innerText()));
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        const issues = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } })).violations.filter(issue => ['critical', 'serious'].includes(issue.impact)).map(issue => ({ id: issue.id, targets: issue.nodes.map(node => node.target) })));
        check(name + ': no serious or critical accessibility issues', !issues.length, issues);
        await page.screenshot({ path: path.join(out, name + '.png') }); report.captures.push(name + '.png');
        fs.writeFileSync(path.join(out, 'matrix.json'), JSON.stringify(report, null, 2) + '\n');
        console.log(name);
      }
    }
  }
  check('No runtime errors in full native matrix', report.errors.length === 0, report.errors); report.completed = true;
} catch (error) { report.failure = error.message; await page.screenshot({ path: path.join(out, 'matrix-failure.png') }).catch(() => {}); throw error; }
finally { fs.writeFileSync(path.join(out, 'matrix.json'), JSON.stringify(report, null, 2) + '\n'); await browser.close(); }
console.log(JSON.stringify({ checks: report.checks.length, captures: report.captures.length, completed: report.completed }));
