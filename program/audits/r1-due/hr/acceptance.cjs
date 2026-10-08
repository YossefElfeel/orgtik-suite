const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/yosse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const API = 'http://127.0.0.1:5500', HR_API = 'http://localhost:5504', WEB = 'http://localhost:3110';
const report = { realm: 'r1-due-local', seedStaffMutation: false, clockMutation: false, dataReset: false, checks: [], captures: [], source: {}, projectedScenarios: ['staffRecovery'] };
for (const p of ['mock/lib/workspace-hr.js', 'apps/hr/components/sheets/EmployeeOffboardingSheet/index.tsx', 'apps/hr/types/offboarding.ts', 'apps/hr/messages/en.json', 'apps/hr/messages/ar.json']) report.source[p] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const check = (name, value) => { assert.ok(value, name); report.checks.push({ name, pass: true }); };
const safe = e => String(e.message || e).split('\nCall log:')[0].replace(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g, '[redacted-token]').replace(/code=[^&\s]+/g, 'code=[redacted]');
const words = locale => JSON.parse(fs.readFileSync('apps/hr/messages/' + locale + '.json', 'utf8')).Offboarding;
async function call(origin, route, method = 'GET', body, session) {
  const r = await fetch(origin + route, { method, headers: { ...(body === undefined ? {} : { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() }), ...(session ? { authorization: 'Bearer ' + session.tokens.accessToken, 'x-workspace': session.workspaceContext.workspace.id } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const d = await r.json(); if (!r.ok) throw Error(route + ' returned ' + r.status + '/' + (d.code || d.error?.code || '')); return d.data;
}
async function open(page, actor, employeeName, locale) {
  const handoff = await call(API, '/api/auth/handoff', 'POST', { audience: 'tool:hr' }, actor);
  await page.goto(WEB + '/' + locale + '/auth?code=' + encodeURIComponent(handoff.code) + '&redirect=' + encodeURIComponent('/employees?q=' + employeeName));
  const trigger = page.getByRole('button', { name: words(locale).open, exact: true }).first(); await trigger.waitFor({ timeout: 60000 }); await trigger.click();
  await page.getByRole('dialog').getByText(words(locale).timezone.replace('{timeZone}', 'Africa/Cairo'), { exact: true }).waitFor();
}
async function capture(page, name) {
  await page.screenshot({ path: path.join(__dirname, name + '.png') }); report.captures.push(name + '.png');
  check(name + ': no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  const rect = await page.getByRole('dialog').evaluate(e => { const r = e.getBoundingClientRect(); return [r.left, r.right, innerWidth]; }); check(name + ': sheet fits viewport', rect[0] >= -1 && rect[1] <= rect[2] + 1);
  check(name + ': no missing translation markers', !/MISSING_MESSAGE|Offboarding\.staffProtection/.test(await page.getByRole('dialog').innerText()));
}
let browser, activePage;
(async () => {
  const state = (await (await fetch(API + '/__mock/status')).json()).data;
  check('isolated due sandbox verified', state.journal.sandbox === report.realm && state.clock.mode === 'frozen'); report.initialClock = { mode: state.clock.mode, now: state.clock.now };
  const staff = await call(API, '/api/auth/login', 'POST', { email: 'rana.saad@orgtik.test', password: 'Local@2026' });
  const staffHr = await call(API, '/api/auth/workspace', 'POST', { workspaceId: 'ws_orgtik', target: 'hr' }, staff);
  const live = await call(HR_API, '/api/employees/1/offboarding-options', 'GET', undefined, staffHr);
  check('actual OrgTik last-SA protection is read-only verified', live.staffProtection?.isLastActiveSuperAdmin && !live.staffProtection.canSchedule && !live.canOffboard && live.staffRecovery === null);
  const nonce = crypto.randomUUID(), password = 'MockDue!' + crypto.randomUUID();
  const customer = await call(API, '/api/auth/register', 'POST', { email: 'due-customer-' + nonce + '@local.fixture.test', password, name: 'Due Customer Owner', company: 'Due Customer Fixture' });
  await call(API, '/v1/app/tools/hr/trial', 'POST', { planId: 'hr_pro' }, customer);
  const customerHr = await call(API, '/api/auth/workspace', 'POST', { workspaceId: customer.workspaceContext.workspace.id, target: 'hr' }, customer);
  const employee = await call(HR_API, '/api/employees', 'POST', { firstName: 'Customer', lastName: 'Due Fixture', email: 'due-worker-' + nonce + '@local.fixture.test' }, customerHr);
  const delivery = await call(API, '/v1/app/invitations/' + employee.invitation.id + '/delivery', 'GET', undefined, customer);
  await call(API, '/v1/public/invitations/' + delivery.invitePath.split('/').at(-1) + '/accept', 'POST', { name: 'Customer Due Fixture', password });
  const customerOptions = await call(HR_API, '/api/employees/' + employee.id + '/offboarding-options', 'GET', undefined, customerHr);
  check('fresh customer has no staff capabilities or recovery leakage', customerOptions.staffProtection === null && customerOptions.staffRecovery === null && customerOptions.canOffboard);
  browser = await chromium.launch({ headless: true });
  for (const variant of [{ locale: 'en', width: 1440, theme: 'light' }, { locale: 'en', width: 390, theme: 'light' }, { locale: 'ar', width: 1440, theme: 'dark' }, { locale: 'ar', width: 390, theme: 'dark' }]) {
    const context = await browser.newContext({ viewport: { width: variant.width, height: variant.width === 390 ? 844 : 1000 } });
    await context.addCookies([{ name: 'NEXT_LOCALE', value: variant.locale, url: WEB }, { name: 'ot-theme', value: variant.theme, url: WEB }]);
    const page = await context.newPage(); activePage = page; const t = words(variant.locale);
    await open(page, staff, 'Mona', variant.locale);
    check('ORG ' + variant.locale + '/' + variant.width + ': specific no-replacement guidance', await page.getByRole('dialog').getByText(t.staffProtection.noReplacement, { exact: true }).isVisible());
    check('ORG ' + variant.locale + '/' + variant.width + ': new departure disabled', await page.getByRole('button', { name: t.confirmNow, exact: true }).isDisabled());
    check('ORG ' + variant.locale + '/' + variant.width + ': no staff-promotion control', !/Promote|Set staff role|تعيين مسؤول/.test(await page.getByRole('dialog').innerText()));
    await capture(page, 'org-protected-' + variant.locale + '-' + variant.width + '-' + variant.theme); await page.getByRole('button', { name: t.close, exact: true }).click();
    await open(page, customer, 'Customer Due', variant.locale);
    check('customer ' + variant.locale + '/' + variant.width + ': no staff-specific guidance', await page.getByText(t.staffProtection.authority, { exact: true }).count() === 0);
    check('customer ' + variant.locale + '/' + variant.width + ': ordinary offboarding available', await page.getByRole('button', { name: t.confirmNow, exact: true }).isEnabled());
    await capture(page, 'customer-nullcaps-' + variant.locale + '-' + variant.width + '-' + variant.theme); await page.getByRole('button', { name: t.close, exact: true }).click();
    const match = url => url.pathname === '/api/employees/1/offboarding-options';
    await page.route(match, async route => {
      try {
        const response = await route.fetch({ maxRetries: 1 }), body = await response.json(), dto = body.data;
        dto.canOffboard = false; dto.canTrackActions = false; dto.employee.isOwner = false;
        dto.staffProtection = { isSuperAdmin: false, isLastActiveSuperAdmin: false, activeReplacementCount: 0, canSchedule: true, reason: null };
        dto.staffRecovery = { status: 'required', offboardingId: 'controlled-ui-projection', at: report.initialClock.now };
        dto.offboarding = { id: 'controlled-ui-projection', employeeId: 1, userId: 1, memberId: null, effectiveAt: report.initialClock.now, completedAt: report.initialClock.now, status: 'completed', transfer: { ownerMemberId: null }, equipment: { status: 'pending' }, finalPay: { status: 'pending', currency: 'EGP' }, createdAt: report.initialClock.now };
        await route.fulfill({ response, json: body });
      } catch (e) { report.transportError = safe(e); await route.abort('failed').catch(() => {}); }
    });
    await open(page, staff, 'Mona', variant.locale);
    await page.evaluate(() => { const note = document.createElement('div'); note.textContent = 'Controlled DTO projection — no staff departure performed'; note.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#fff;color:#111;padding:4px 8px;font:12px sans-serif;text-align:center'; document.body.appendChild(note); });
    check('projection ' + variant.locale + '/' + variant.width + ': recovery guidance visible', await page.getByRole('dialog').getByText(t.staffProtection.recovery, { exact: true }).isVisible());
    check('projection ' + variant.locale + '/' + variant.width + ': staff remains administratively read-only', await page.getByRole('button', { name: t.markEquipment, exact: true }).isDisabled());
    await capture(page, 'controlled-recovery-' + variant.locale + '-' + variant.width + '-' + variant.theme); await context.close(); console.log('Guidance ' + variant.locale + '/' + variant.width + ' passed');
  }
  await browser.close(); browser = null;
  const after = await call(HR_API, '/api/employees/1/offboarding-options', 'GET', undefined, staffHr);
  check('actual seed staff employment never changed', after.offboarding === live.offboarding && after.staffRecovery === null && after.staffProtection.isLastActiveSuperAdmin);
  const end = (await (await fetch(API + '/__mock/status')).json()).data.clock; report.finalClock = { mode: end.mode, now: end.now }; check('business clock unchanged', JSON.stringify(report.initialClock) === JSON.stringify(report.finalClock));
  report.passed = report.checks.length; report.completed = true; fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, report: path.join(__dirname, 'report.json') }));
})().catch(async e => { report.completed = false; report.error = safe(e); if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: path.join(__dirname, 'failure.png') }).catch(() => {}); fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 2) + '\n'); if (browser) await browser.close(); console.error(report.error); process.exitCode = 1; });
