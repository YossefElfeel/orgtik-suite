const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/yosse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const API = 'http://127.0.0.1:5300', HR_API = 'http://localhost:5304', WEB = 'http://localhost:3105';
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, '.env.shared-fixture.local'), 'utf8'));
const report = { realm: 'r1-leave-local', checks: [], captures: [], source: {}, clockMutation: false, dataReset: false };
for (const file of ['apps/hr/redux/app/baseApi.ts', 'apps/hr/redux/features/timeOff/timeOffApi.ts', 'apps/hr/lib/time-off-attempt.ts', 'apps/hr/components/pages/attendance/AddTimeDialog/index.tsx', 'apps/hr/components/pages/time-off/TimeOffDialog/index.tsx', 'apps/hr/schemas/attendance/add-time-off.schemas.ts', 'apps/hr/messages/en.json', 'apps/hr/messages/ar.json', 'mock/apps/hr/leave.js', 'mock/lib/business-calendar.js']) report.source[file] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const words = locale => JSON.parse(fs.readFileSync('apps/hr/messages/' + locale + '.json', 'utf8'));
const check = (name, value) => { assert.ok(value, name); report.checks.push({ name, pass: true }); };
const safe = error => String(error?.message || error).split('\nCall log:')[0].replace(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g, '[redacted-token]').replace(/code=[^&\s]+/g, 'code=[redacted]');
async function call(origin, route, method, body, session, key = crypto.randomUUID()) {
  const r = await fetch(origin + route, { method, headers: { ...(body === undefined ? {} : { 'content-type': 'application/json', 'idempotency-key': key }), ...(session ? { authorization: 'Bearer ' + session.tokens.accessToken, 'x-workspace': fixture.workspaceId } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const result = await r.json(); if (!r.ok) throw Error(route + ' returned ' + r.status + '/' + (result.code || result.error?.code || '')); return result.data;
}
async function session(page, who, locale, route) {
  const data = await call(API, '/api/auth/handoff', 'POST', { audience: 'tool:hr' }, who);
  await page.goto(WEB + '/' + locale + '/auth?code=' + encodeURIComponent(data.code) + '&redirect=' + encodeURIComponent(route));
}
async function form(page, who, locale) {
  await session(page, who, locale, '/calendar');
  await page.getByRole('button', { name: words(locale).addTimeDialog.trigger, exact: true }).waitFor({ timeout: 60000 });
  await page.getByRole('button', { name: words(locale).addTimeDialog.trigger, exact: true }).click();
}
async function civilDay(page, label, value, locale) {
  await page.getByLabel(label, { exact: true }).click();
  const formatted = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-u-ca-gregory-nu-latn' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', calendar: 'gregory', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
  const escaped = formatted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await page.locator('[data-slot="popover-content"]').getByRole('button', { name: new RegExp(escaped) }).click();
  await page.locator('[data-slot="popover-content"]').waitFor({ state: 'detached', timeout: 5000 });
}
async function detail(page, who, code, locale) {
  await session(page, who, locale, '/time-off?q=' + encodeURIComponent(code));
  await page.getByRole('button', { name: words(locale).timeOffTable.tooltips.viewEdit, exact: true }).first().waitFor({ timeout: 60000 });
  await page.getByRole('button', { name: words(locale).timeOffTable.tooltips.viewEdit, exact: true }).first().click();
  await page.getByRole('dialog').getByRole('region', { name: words(locale).timeOffDialog.sections.hrDecision, exact: true }).waitFor();
}
async function capture(page, name) {
  await page.locator('[data-ending-style]').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
  await page.screenshot({ path: path.join(__dirname, name + '.png') }); report.captures.push(name + '.png');
  check(name + ': no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  const geometry = await page.getByRole('dialog').evaluate(el => { const r = el.getBoundingClientRect(); return [r.left, r.right, innerWidth]; });
  check(name + ': dialog fits viewport', geometry[0] >= -1 && geometry[1] <= geometry[2] + 1);
  check(name + ': no missing messages', !/MISSING_MESSAGE|timeOffDialog\.|addTimeDialog\./.test(await page.getByRole('dialog').innerText()));
}
function lost(page, routePath, method, label) {
  const attempts = []; let first = true;
  page.route(url => url.pathname === routePath, async route => {
    if (route.request().method() !== method) return route.continue();
    const request = route.request(); attempts.push({ body: request.postDataJSON(), key: request.headers()['idempotency-key'], workspace: request.headers()['x-workspace'], contentType: request.headers()['content-type'] });
    try {
      const r = await route.fetch({ maxRetries: 1, timeout: 15000 }); check(label + ': backend committed before response loss', [200, 201].includes(r.status()));
      if (first) { first = false; await route.abort('failed'); } else await route.fulfill({ response: r });
    } catch (error) { report.transportError = safe(error); await route.abort('failed').catch(() => {}); }
  }); return attempts;
}
let browser, activePage;
(async () => {
  const status = (await (await fetch(API + '/__mock/status')).json()).data;
  check('isolated realm and frozen clock', status.journal.sandbox === report.realm && status.clock.mode === 'frozen');
  report.initialClock = { mode: status.clock.mode, now: status.clock.now };
  browser = await chromium.launch({ headless: true });
  for (const v of [{ locale: 'en', width: 1440, theme: 'light' }, { locale: 'en', width: 390, theme: 'light' }, { locale: 'ar', width: 1440, theme: 'dark' }, { locale: 'ar', width: 390, theme: 'dark' }]) {
    const context = await browser.newContext({ viewport: { width: v.width, height: v.width === 390 ? 844 : 1000 }, timezoneId: 'America/Los_Angeles' });
    await context.addCookies([{ name: 'NEXT_LOCALE', value: v.locale, url: WEB }, { name: 'ot-theme', value: v.theme, url: WEB }]);
    const page = await context.newPage(); activePage = page; const t = words(v.locale);
    await form(page, fixture.people.worker.session, v.locale);
    await civilDay(page, t.addTimeDialog.startDate, '2026-10-08', v.locale); await civilDay(page, t.addTimeDialog.endDate, '2026-10-08', v.locale);
    check('form ' + v.locale + '/' + v.width + ': language direction', await page.locator('html').getAttribute('dir') === (v.locale === 'ar' ? 'rtl' : 'ltr'));
    check('form ' + v.locale + '/' + v.width + ': theme', await page.locator('html').getAttribute('data-theme') === v.theme);
    check('form ' + v.locale + '/' + v.width + ': upload omitted', await page.getByRole('dialog').locator('input[type=file]').count() === 0);
    await capture(page, 'request-' + v.locale + '-' + v.width + '-' + v.theme); await context.close(); console.log('Baseline ' + v.locale + '/' + v.width + ' passed');
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'America/Los_Angeles' });
  const page = await context.newPage(); activePage = page; const t = words('en');
  await form(page, fixture.people.worker.session, 'en');
  await civilDay(page, t.addTimeDialog.startDate, '2026-10-08', 'en'); await civilDay(page, t.addTimeDialog.endDate, '2026-10-07', 'en');
  await page.getByRole('button', { name: t.timeOffDialog.actions.sendRequest, exact: true }).click(); await page.getByText(t.addTimeDialog.validation.dateOrder, { exact: true }).waitFor(); check('date-order error shown', true);
  await civilDay(page, t.addTimeDialog.endDate, '2026-10-08', 'en');
  await page.getByLabel(t.addTimeDialog.note, { exact: true }).fill('HR acceptance request; generic fixture note.');
  const creates = lost(page, '/api/attendance/time-offs/requests', 'POST', 'create');
  await page.getByRole('button', { name: t.timeOffDialog.actions.sendRequest, exact: true }).click(); await page.getByRole('button', { name: t.timeOffDialog.actions.recover, exact: true }).waitFor();
  check('create fields lock on unknown outcome', await page.getByLabel(t.addTimeDialog.note, { exact: true }).isDisabled()); await capture(page, 'create-unconfirmed');
  let items = (await call(HR_API, '/api/attendance/time-offs/requests', 'GET', undefined, fixture.people.worker.hr)).items;
  const created = items.find(row => row.employeeNote === 'HR acceptance request; generic fixture note.'); check('one persisted create with civil date', created && created.startDate === '2026-10-08' && created.endDate === '2026-10-08');
  await page.reload(); await page.getByRole('button', { name: t.addTimeDialog.trigger, exact: true }).click(); await page.getByRole('button', { name: t.timeOffDialog.actions.recover, exact: true }).click(); await page.getByText(t.addTimeDialog.saved.replace('{code}', created.requestCode), { exact: true }).waitFor();
  check('create recovery keeps exact body/key/scope', creates.length === 2 && JSON.stringify(creates[0]) === JSON.stringify(creates[1]));
  check('JSON command contains no operationId/files/scope body authority', creates.every(a => a.contentType.includes('application/json') && !('operationId' in a.body) && !('files' in a.body) && !('scope' in a.body) && a.workspace === fixture.workspaceId));
  await capture(page, 'create-recovered');
  await detail(page, fixture.people.manager.session, created.requestCode, 'en');
  const manager = page.getByRole('region', { name: t.timeOffDialog.sections.managerDecision, exact: true });
  await manager.getByRole('button', { name: t.timeOffDialog.actions.approve, exact: true }).click(); await manager.getByLabel(t.timeOffDialog.fields.noteReason, { exact: true }).fill('Manager reviewed.'); await manager.getByRole('button', { name: t.timeOffDialog.actions.submitDecision, exact: true }).click(); await page.getByText(t.timeOffDialog.decisionSaved, { exact: true }).waitFor();
  let row = await call(HR_API, '/api/attendance/time-offs/requests/' + created.id, 'GET', undefined, fixture.hr);
  check('manager approval stays pending HR review', row.status === 'pending' && row.managerActionStatus === 'approved' && row.hrActionStatus === 'pending' && row.managerDecidedByUserId === fixture.people.manager.id);
  await capture(page, 'manager-approved-hr-pending');
  await detail(page, fixture.owner, created.requestCode, 'en');
  const decisions = lost(page, '/api/attendance/time-offs/requests/' + created.id + '/decision', 'PATCH', 'HR decision');
  const hr = page.getByRole('region', { name: t.timeOffDialog.sections.hrDecision, exact: true });
  await hr.getByRole('button', { name: t.timeOffDialog.actions.approve, exact: true }).click(); await hr.getByLabel(t.timeOffDialog.fields.noteReason, { exact: true }).fill('HR reviewed.'); await hr.getByRole('button', { name: t.timeOffDialog.actions.submitDecision, exact: true }).click(); await page.getByRole('button', { name: t.timeOffDialog.actions.recover, exact: true }).waitFor();
  await capture(page, 'decision-unconfirmed');
  await page.reload(); await page.getByRole('button', { name: t.timeOffTable.tooltips.viewEdit, exact: true }).first().click(); await page.getByRole('button', { name: t.timeOffDialog.actions.recover, exact: true }).click(); await page.getByText(t.timeOffDialog.decisionSaved, { exact: true }).waitFor();
  check('HR decision recovery keeps exact body/key/scope', decisions.length === 2 && JSON.stringify(decisions[0]) === JSON.stringify(decisions[1]));
  row = await call(HR_API, '/api/attendance/time-offs/requests/' + created.id, 'GET', undefined, fixture.hr); check('HR final approval and attribution persist', row.status === 'approved' && row.hrActionStatus === 'approved' && row.hrDecidedByUserId === fixture.owner.user.id);
  await capture(page, 'approved-two-stages');
  const cancellable = await call(HR_API, '/api/attendance/time-offs/requests', 'POST', { timeOffType: 'annual_leave', durationType: 'partial', startDate: '2026-10-12', endDate: '2026-10-12', partialStartTime: '11:00', partialEndTime: '11:30', employeeNote: 'Cancellation fixture.' }, fixture.people.worker.hr);
  await detail(page, fixture.people.worker.session, cancellable.requestCode, 'en');
  const cancels = lost(page, '/api/attendance/time-offs/requests/' + cancellable.id + '/cancel', 'PATCH', 'cancel');
  await page.getByRole('button', { name: t.timeOffDialog.actions.cancelRequest, exact: true }).click(); await page.getByRole('button', { name: t.timeOffDialog.actions.confirmCancel, exact: true }).click(); await page.getByRole('button', { name: t.timeOffDialog.actions.recover, exact: true }).waitFor();
  await page.reload(); await page.getByRole('button', { name: t.timeOffTable.tooltips.viewEdit, exact: true }).first().click(); await page.getByRole('button', { name: t.timeOffDialog.actions.recover, exact: true }).click(); await page.getByText(t.timeOffDialog.cancelledSaved, { exact: true }).waitFor();
  check('cancellation recovery keeps exact body/key/scope', cancels.length === 2 && JSON.stringify(cancels[0]) === JSON.stringify(cancels[1]));
  row = await call(HR_API, '/api/attendance/time-offs/requests/' + cancellable.id, 'GET', undefined, fixture.people.worker.hr); check('cancelled record retained with no fresh actions', row.status === 'cancelled' && !row.capabilities.canCancel && !row.capabilities.canDecide); await capture(page, 'cancelled-record');
  await form(page, fixture.people.worker.session, 'en'); await page.getByLabel(t.addTimeDialog.durationType, { exact: true }).click(); await page.getByRole('option', { name: t.addTimeDialog.durationTypes.customHours, exact: true }).click();
  await civilDay(page, t.addTimeDialog.startDate, '2026-10-14', 'en'); await page.getByLabel(t.addTimeDialog.durationTypes.startTime, { exact: true }).fill('13:00'); await page.getByLabel(t.addTimeDialog.durationTypes.endTime, { exact: true }).fill('12:00'); await page.getByRole('button', { name: t.timeOffDialog.actions.sendRequest, exact: true }).click(); await page.getByText(t.addTimeDialog.validation.timeOrder, { exact: true }).waitFor(); check('partial-time order error shown', true);
  await page.getByLabel(t.addTimeDialog.durationTypes.endTime, { exact: true }).fill('14:00');
  let requests = 0, refreshes = 0, releaseRefresh; const held = new Promise(resolve => { releaseRefresh = resolve; }); let refreshStarted; const started = new Promise(resolve => { refreshStarted = resolve; });
  await page.route(url => url.pathname === '/api/attendance/time-offs/requests', async route => { if (route.request().method() !== 'POST') return route.continue(); requests++; await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, code: 'expired' }) }); });
  await page.route(url => url.pathname === '/api/auth/refresh', async route => { refreshes++; refreshStarted(); try { const response = await route.fetch({ maxRetries: 1 }); await held; await route.fulfill({ response }); } catch (e) { report.refreshError = safe(e); await route.abort().catch(() => {}); } });
  await page.getByRole('button', { name: t.timeOffDialog.actions.sendRequest, exact: true }).click(); await started;
  const newProfile = await call(API, '/api/auth/me', 'GET', undefined, fixture.people.manager.hr);
  await page.evaluate(({ profile, tokens }) => { sessionStorage.setItem('orgtik.tab-session.v1', JSON.stringify({ ...profile, tokens })); window.dispatchEvent(new Event('orgtik:session-changed')); }, { profile: newProfile, tokens: fixture.people.manager.hr.tokens });
  releaseRefresh(); await page.waitForTimeout(500);
  check('401 refresh never resends old body under new actor', requests === 1 && refreshes === 1);
  const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem('orgtik.tab-session.v1')).user.id); check('superseded refresh never logs out new actor', stored === fixture.people.manager.id);
  const oldAttempt = await page.evaluate(({ realm, ws, actor }) => JSON.parse(sessionStorage.getItem('orgtik.hr-leave.v1:' + realm + ':' + ws + ':' + actor + ':create')), { realm: fixture.realm, ws: fixture.workspaceId, actor: fixture.people.worker.id }); check('original uncertain attempt retains key/body/scope', oldAttempt?.uncertain === true && oldAttempt.request.scope.actorId === fixture.people.worker.id);
  await context.close(); await browser.close(); browser = null;
  const final = (await (await fetch(API + '/__mock/status')).json()).data.clock; report.finalClock = { mode: final.mode, now: final.now }; check('business clock unchanged', JSON.stringify(report.initialClock) === JSON.stringify(report.finalClock));
  report.passed = report.checks.length; report.completed = true; fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, report: path.join(__dirname, 'report.json') }));
})().catch(async error => { report.completed = false; report.error = safe(error); if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: path.join(__dirname, 'failure.png') }).catch(() => {}); fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 2) + '\n'); if (browser) await browser.close(); console.error(report.error); process.exitCode = 1; });
