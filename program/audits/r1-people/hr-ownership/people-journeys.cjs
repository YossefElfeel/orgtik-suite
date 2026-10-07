const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/yosse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const SOS = process.env.SOS_WEB_URL || 'http://127.0.0.1:3116';
const HR = process.env.HR_WEB_URL || 'http://localhost:3104';
const API = process.env.SOS_API_URL || 'http://127.0.0.1:5100';
const HR_API = process.env.HR_API_URL || 'http://localhost:5104';
const REALM = process.env.MOCK_SANDBOX || 'r1-people-local';
for (const origin of [SOS, HR, API, HR_API]) assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname), 'Local sandbox only');
assert.equal(REALM, 'r1-people-local', 'This runner only creates disposable local fixture accounts.');
const out = __dirname;
const report = { realm: REALM, clockMutation: false, businessDataReset: false, checks: [], captures: [], source: {} };
const owned = ['apps/sos/components/workspace/team/OwnershipTransferDialog.tsx', 'apps/sos/redux/features/platform/ownership.ts', 'apps/hr/components/sheets/EmployeeOffboardingSheet/index.tsx', 'apps/hr/redux/features/employee/employeeApi.ts', 'mock/lib/workspace-people-journeys.js', 'mock/lib/workspace-hr.js'];
for (const file of owned) report.source[file] = crypto.createHash('sha256').update(fs.readFileSync(path.resolve(file))).digest('hex');
const copy = locale => ({ hr: JSON.parse(fs.readFileSync(`apps/hr/messages/${locale}.json`, 'utf8')).Offboarding, team: JSON.parse(fs.readFileSync(`apps/sos/messages/usr/${locale}/team.json`, 'utf8')).Team.ownership });
const check = (name, value) => { assert.ok(value, name); report.checks.push({ name, pass: true }); };
const safeError = error => String(error?.message || error).split('\nCall log:')[0].replace(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g, '[redacted-token]').replace(/(?:code=)[^&\s]+/g, 'code=[redacted]');
async function call(origin, route, method = 'GET', body, session, workspaceId, operationId) {
  const response = await fetch(origin + route, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json', 'idempotency-key': operationId || crypto.randomUUID() } : {}), ...(session?.tokens ? { authorization: `Bearer ${session.tokens.accessToken}`, ...(workspaceId || session.workspaceContext?.workspace.id ? { 'x-workspace': workspaceId || session.workspaceContext.workspace.id } : {}) } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json(); return { status: response.status, data: data.data, meta: data.meta, code: data.code || data.error?.code };
}
async function ok(...args) { const response = await call(...args); assert.ok(response.status >= 200 && response.status < 300, `${args[1]} returned ${response.status}/${response.code}`); return response.data; }
async function code(session, audience) { return (await ok(API, '/api/auth/handoff', 'POST', { audience }, session)).code; }
async function accept(owner, email, tools, session) {
  const invitation = await ok(API, '/v1/app/team/invite', 'POST', { email, role: 'member', tools }, owner);
  const delivery = await ok(API, `/v1/app/invitations/${invitation.id}/delivery`, 'GET', undefined, owner);
  const token = delivery.invitePath.split('/').at(-1);
  return ok(API, `/v1/public/invitations/${token}/accept`, 'POST', session ? {} : { password: password, name: email.includes('member') ? 'Journey Successor' : 'Journey Worker' }, session);
}
let password;
async function fixture() {
  const suffix = crypto.randomUUID(); password = `MockFlow!${suffix}`;
  const owner = await ok(API, '/api/auth/register', 'POST', { name: 'Journey Owner', company: `People UI ${suffix.slice(0, 8)}`, email: `owner-${suffix}@local.fixture.test`, password });
  check('isolated realm verified before fixture writes', owner.workspaceContext.realm === REALM);
  await ok(API, '/v1/app/tools/hr/trial', 'POST', { planId: 'hr_pro' }, owner);
  const memberEmail = `member-${suffix}@local.fixture.test`;
  const member = await accept(owner, memberEmail, []);
  const team = await call(API, '/v1/app/team', 'GET', undefined, owner);
  const memberId = team.data.find(row => row.email === memberEmail).id;
  const hr = await ok(API, '/api/auth/workspace', 'POST', { workspaceId: owner.workspaceContext.workspace.id, target: 'hr' }, owner);
  const employees = [];
  for (const label of ['Scheduled', 'Immediate']) {
    const email = `${label.toLowerCase()}-${suffix}@local.fixture.test`;
    const employee = await ok(HR_API, '/api/employees', 'POST', { firstName: label, lastName: 'Journey Worker', email }, hr, owner.workspaceContext.workspace.id);
    const delivery = await ok(API, `/v1/app/invitations/${employee.invitation.id}/delivery`, 'GET', undefined, owner);
    const joined = await ok(API, `/v1/public/invitations/${delivery.invitePath.split('/').at(-1)}/accept`, 'POST', { password, name: `${label} Journey Worker` });
    employees.push({ label, id: employee.id, email, session: joined });
  }
  const other = await ok(API, '/api/auth/register', 'POST', { name: 'Other Journey Owner', company: `Other UI ${suffix.slice(0, 8)}`, email: `other-${suffix}@local.fixture.test`, password });
  await accept(other, employees[1].email, [], employees[1].session);
  const otherWorker = await ok(API, '/api/auth/workspace', 'POST', { workspaceId: other.workspaceContext.workspace.id }, employees[1].session, owner.workspaceContext.workspace.id);
  const workerHr = await ok(API, '/api/auth/workspace', 'POST', { workspaceId: owner.workspaceContext.workspace.id, target: 'hr' }, employees[1].session, owner.workspaceContext.workspace.id);
  return { owner, hr, member, memberId, employees, other, otherWorker, workerHr };
}
async function openHR(page, session, employee, locale) {
  const handoff = await code(session, 'tool:hr');
  await page.goto(`${HR}/${locale}/auth?code=${encodeURIComponent(handoff)}&redirect=${encodeURIComponent(`/employees?q=${employee.label}`)}`);
  await page.getByRole('button', { name: copy(locale).hr.open, exact: true }).first().waitFor({ timeout: 60000 });
  await page.getByRole('button', { name: copy(locale).hr.open, exact: true }).first().click();
  await page.getByRole('dialog').getByText(copy(locale).hr.timezone.replace('{timeZone}', 'Africa/Cairo'), { exact: true }).waitFor();
}
async function openSOS(page, session, locale) {
  const handoff = await code(session, 'suite');
  await page.goto(`${SOS}/auth?code=${encodeURIComponent(handoff)}&redirect=/team`);
  await page.getByRole('button', { name: copy(locale).team.open, exact: true }).waitFor({ timeout: 60000 });
  await page.getByRole('button', { name: copy(locale).team.open, exact: true }).click();
  await page.getByRole('dialog').waitFor();
}
async function screenshot(page, name) {
  await page.locator('[data-ending-style]').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  await page.screenshot({ path: path.join(out, name + '.png') }); report.captures.push(name + '.png');
  check(`${name}: document has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  const geometry = await page.getByRole('dialog').evaluate(element => { const rect = element.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: window.innerWidth }; });
  check(`${name}: dialog stays inside viewport`, geometry.left >= -1 && geometry.right <= geometry.width + 1);
  check(`${name}: no missing translation markers`, !/MISSING_MESSAGE|Offboarding\.(?:title|open)|Team\.ownership/.test(await page.getByRole('dialog').innerText()));
}
function loseResponse(page, pathname, method, expected) {
  const requests = []; let lose = true;
  page.route(url => url.pathname === pathname, async route => {
    if (route.request().method() !== method) return route.continue();
    const request = route.request(); requests.push({ body: request.postDataJSON(), key: request.headers()['idempotency-key'] });
    try {
      // A socket retry is safe here: these three commands carry one immutable operation key.
      const response = await route.fetch({ maxRetries: 1, timeout: 15000 });
      check(`${expected}: backend committed before transport loss`, response.status() === 200);
      if (lose) { lose = false; return route.abort('failed'); }
      return route.fulfill({ response });
    } catch (error) {
      report.transportError = safeError(error);
      await route.abort('failed').catch(() => {});
    }
  });
  return requests;
}
let browser, activePage;
(async () => {
  const statusResponse = await fetch(API + '/__mock/status');
  const runtime = (await statusResponse.json()).data;
  assert.equal(runtime.journal?.sandbox, REALM, 'Verify isolated journal before any fixture writes');
  report.initialClock = { mode: runtime.clock.mode, now: runtime.clock.now };
  check('business clock is frozen', runtime.clock.mode === 'frozen');
  const f = await fixture();
  report.workspaceId = f.owner.workspaceContext.workspace.id;
  browser = await chromium.launch({ headless: true });
  const matrix = [{ locale: 'en', width: 1440, theme: 'light' }, { locale: 'en', width: 390, theme: 'light' }, { locale: 'ar', width: 1440, theme: 'dark' }, { locale: 'ar', width: 390, theme: 'dark' }];
  for (const variant of matrix) {
    const context = await browser.newContext({ viewport: { width: variant.width, height: variant.width === 390 ? 844 : 1000 } });
    await context.addCookies([SOS, HR].flatMap(url => [{ name: 'NEXT_LOCALE', value: variant.locale, url }, { name: 'ot-theme', value: variant.theme, url }]));
    const page = await context.newPage();
    activePage = page;
    await openHR(page, f.owner, f.employees[0], variant.locale);
    await page.getByRole('radio', { name: copy(variant.locale).hr.date, exact: true }).click();
    await page.getByLabel(copy(variant.locale).hr.lastDay, { exact: true }).fill('2026-10-08');
    check(`HR ${variant.locale}/${variant.width}: language direction`, await page.locator('html').getAttribute('dir') === (variant.locale === 'ar' ? 'rtl' : 'ltr'));
    check(`HR ${variant.locale}/${variant.width}: theme`, await page.locator('html').getAttribute('data-theme') === variant.theme);
    await screenshot(page, `hr-${variant.locale}-${variant.width}-${variant.theme}-schedule`);
    await page.getByRole('button', { name: copy(variant.locale).hr.close, exact: true }).click();
    await openSOS(page, f.owner, variant.locale);
    await page.getByRole('dialog').getByRole('combobox').click();
    await page.getByRole('option', { name: 'Journey Successor', exact: true }).click();
    check(`SOS ${variant.locale}/${variant.width}: direction`, await page.locator('html').getAttribute('dir') === (variant.locale === 'ar' ? 'rtl' : 'ltr'));
    check(`SOS ${variant.locale}/${variant.width}: theme`, await page.locator('html').getAttribute('data-theme') === variant.theme);
    await screenshot(page, `ownership-${variant.locale}-${variant.width}-${variant.theme}-review`);
    await context.close();
    console.log(`Baseline ${variant.locale}/${variant.width}/${variant.theme} passed`);
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addCookies([SOS, HR].flatMap(url => [{ name: 'NEXT_LOCALE', value: 'en', url }, { name: 'ot-theme', value: 'light', url }]));
  const page = await context.newPage(); const t = copy('en');
  activePage = page;
  await openHR(page, f.owner, f.employees[0], 'en');
  await page.getByRole('radio', { name: t.hr.date, exact: true }).click(); await page.getByLabel(t.hr.lastDay, { exact: true }).fill('2026-10-08');
  await page.getByRole('dialog').getByRole('combobox').click(); await page.getByRole('option', { name: 'Journey Owner', exact: true }).click();
  await page.getByRole('button', { name: t.hr.confirmSchedule, exact: true }).click(); await page.getByText(t.hr.status.scheduled, { exact: true }).waitFor();
  let options = await ok(HR_API, `/api/employees/${f.employees[0].id}/offboarding-options`, 'GET', undefined, f.hr, report.workspaceId);
  check('scheduled civil date ends at next local midnight', options.offboarding.effectiveAt === '2026-10-08T21:00:00.000Z');
  await screenshot(page, 'hr-scheduled-record');
  console.log('Scheduled offboarding persisted; cancellation next');
  await page.getByRole('button', { name: t.hr.cancelSchedule, exact: true }).click(); await page.getByText(t.hr.success.cancelled, { exact: true }).waitFor();
  options = await ok(HR_API, `/api/employees/${f.employees[0].id}/offboarding-options`, 'GET', undefined, f.hr, report.workspaceId);
  check('cancel preserves membership and records one cancellation action', options.offboarding.status === 'cancelled' && options.offboarding.actions.length === 1);
  await page.getByRole('button', { name: t.hr.close, exact: true }).click();
  await openHR(page, f.owner, f.employees[1], 'en');
  const originalPath = `/api/employees/${f.employees[1].id}`; const offboardRequests = loseResponse(page, originalPath, 'DELETE', 'offboarding');
  await page.getByRole('button', { name: t.hr.confirmNow, exact: true }).click(); await page.getByRole('button', { name: t.hr.recover, exact: true }).waitFor();
  options = await ok(HR_API, originalPath + '/offboarding-options', 'GET', undefined, f.hr, report.workspaceId); const recordId = options.offboarding.id;
  check('lost offboarding response still committed once', options.offboarding.status === 'completed' && options.canTrackActions && !options.canOffboard);
  check('unknown offboarding locks action fields', await page.getByRole('button', { name: t.hr.markEquipment, exact: true }).isDisabled());
  await screenshot(page, 'hr-offboarding-unconfirmed');
  await page.reload(); await page.getByRole('button', { name: t.hr.open, exact: true }).first().click(); await page.getByRole('button', { name: t.hr.recover, exact: true }).click(); await page.getByText(t.hr.success.completed, { exact: true }).waitFor();
  check('reload recovery reuses exact offboarding body/key', offboardRequests.length === 2 && offboardRequests[0].key === offboardRequests[1].key && JSON.stringify(offboardRequests[0].body) === JSON.stringify(offboardRequests[1].body));
  options = await ok(HR_API, originalPath + '/offboarding-options', 'GET', undefined, f.hr, report.workspaceId); check('same completed offboarding after recovery', options.offboarding.id === recordId);
  check('old workspace access revoked', (await call(API, '/api/auth/me', 'GET', undefined, f.workerHr, report.workspaceId)).status === 403);
  check('other workspace and global account remain active', (await call(API, '/api/auth/me', 'GET', undefined, f.otherWorker, f.other.workspaceContext.workspace.id)).status === 200);
  const actionPath = originalPath + '/offboarding-actions'; const actionRequests = loseResponse(page, actionPath, 'POST', 'equipment action');
  await page.getByLabel(t.hr.note, { exact: true }).fill('Packaged laptop returned; review recorded.'); await page.getByRole('button', { name: t.hr.markEquipment, exact: true }).click(); await page.getByRole('button', { name: t.hr.recover, exact: true }).waitFor();
  check('unknown tracking action locks note', await page.getByLabel(t.hr.note, { exact: true }).isDisabled());
  await page.reload(); await page.getByRole('button', { name: t.hr.open, exact: true }).first().click(); await page.getByRole('button', { name: t.hr.recover, exact: true }).click(); await page.getByText(t.hr.success.action, { exact: true }).waitFor();
  check('equipment replay reuses exact body/key', actionRequests.length === 2 && actionRequests[0].key === actionRequests[1].key && JSON.stringify(actionRequests[0].body) === JSON.stringify(actionRequests[1].body));
  options = await ok(HR_API, originalPath + '/offboarding-options', 'GET', undefined, f.hr, report.workspaceId); check('equipment tracking recorded once', options.offboarding.actions.length === 1 && options.offboarding.equipment.status === 'completed');
  await page.unroute(url => url.pathname === actionPath);
  await page.getByRole('button', { name: t.hr.markFinalPay, exact: true }).click(); await page.getByText(t.hr.success.action, { exact: true }).waitFor();
  options = await ok(HR_API, originalPath + '/offboarding-options', 'GET', undefined, f.hr, report.workspaceId); check('final-pay tracking preserves employee currency', options.offboarding.finalPay.status === 'completed' && options.offboarding.finalPay.currency === 'CHF' && options.offboarding.actions.length === 2);
  await screenshot(page, 'hr-completed-tracking');
  await page.getByRole('button', { name: t.hr.close, exact: true }).click();
  const teamBefore = await call(API, '/v1/app/team', 'GET', undefined, f.owner);
  await openSOS(page, f.owner, 'en'); await page.getByRole('dialog').getByRole('combobox').click(); await page.getByRole('option', { name: 'Journey Successor', exact: true }).click();
  const handovers = loseResponse(page, '/v1/app/ownership-transfer', 'POST', 'ownership');
  await page.getByRole('dialog').getByRole('button', { name: t.team.confirm, exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: t.team.recover, exact: true }).waitFor();
  check('unconfirmed handover locks selected person', await page.getByRole('dialog').getByRole('combobox').isDisabled()); await screenshot(page, 'ownership-unconfirmed');
  await page.reload(); await page.getByRole('button', { name: t.team.recover, exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: t.team.recover, exact: true }).click(); await page.getByRole('dialog').getByText(t.team.success, { exact: true }).waitFor();
  check('former owner recovers exact handover after reload', handovers.length === 2 && handovers[0].key === handovers[1].key && JSON.stringify(handovers[0].body) === JSON.stringify(handovers[1].body));
  const teamAfter = await call(API, '/v1/app/team', 'GET', undefined, f.owner); check('ownership roles changed once', teamAfter.data.find(row => row.id === f.memberId).role === 'owner' && teamAfter.data.find(row => row.email === f.owner.user.email).role === 'admin');
  check('handover preserves purchased/assigned/reserved seats', JSON.stringify(teamBefore.meta.perTool) === JSON.stringify(teamAfter.meta.perTool));
  const newOwner = await ok(API, '/v1/app/me', 'GET', undefined, f.member, report.workspaceId); check('owner receives no free HR seat', newOwner.workspaceContext.tools.hr.access === 'no_access');
  await screenshot(page, 'ownership-recovered');
  await context.close(); await browser.close(); browser = null;
  const finalClock = (await (await fetch(API + '/__mock/status')).json()).data.clock;
  report.finalClock = { mode: finalClock.mode, now: finalClock.now };
  check('shared business clock unchanged', JSON.stringify(report.initialClock) === JSON.stringify(report.finalClock));
  report.passed = report.checks.length; report.completed = true; fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, report: path.join(out, 'report.json') }));
})().catch(async error => { report.completed = false; report.error = safeError(error); if (activePage && !activePage.isClosed()) { await activePage.screenshot({ path: path.join(out, 'failure-state.png') }).catch(() => {}); const dialog = activePage.getByRole('dialog'); if (await dialog.count()) report.screen = await dialog.innerText().catch(() => ''); } fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n'); if (browser) await browser.close(); console.error(report.error); process.exitCode = 1; });
