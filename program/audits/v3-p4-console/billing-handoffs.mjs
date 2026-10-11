import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(out, '../../..'), require = createRequire(path.join(root, 'apps/docs/package.json')), { chromium } = require('playwright');
const report = { scope: 'Ordinary native billing and actual account/staff handoffs in owned offset1100 fixture', checks: [], captures: [], errors: [] };
const check = (name, pass, details) => { report.checks.push({ name, pass: Boolean(pass), details }); if (!pass) throw Error(name + ' ' + JSON.stringify(details)); };
async function api(app, endpoint, session, method = 'GET', body, operationId = crypto.randomUUID()) {
  const response = await fetch(`http://localhost:${app === 'admin' ? 8608 : 8600}${endpoint}`, { method, headers: { ...(session ? { authorization: `Bearer ${session.tokens.accessToken}` } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json', 'Idempotency-Key': operationId }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000) });
  const raw = await response.json(); if (!response.ok) throw Error(endpoint + ' ' + JSON.stringify(raw)); return raw.data;
}
async function login(email) { return api('sos', '/api/auth/login', null, 'POST', { email, password: 'Local@2026' }); }
async function enter(page, session, app, redirect) {
  const url = app === 'admin' ? 'http://localhost:4608/en/auth' : 'http://localhost:4600/auth';
  await fetch(url);
  const code = await api('sos', '/api/auth/handoff', session, 'POST', { audience: app === 'admin' ? 'staff:admin' : 'suite' });
  await page.goto(url + `?code=${encodeURIComponent(code.code)}&redirect=${encodeURIComponent(redirect)}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
}
async function select(page, label, option) { await page.getByRole('combobox', { name: label, exact: true }).click(); await page.getByRole('option', { name: option, exact: true }).click(); }
async function mutation(page, endpoint, callback) { const pending = page.waitForResponse(response => response.url().endsWith(endpoint) && ['POST', 'PATCH'].includes(response.request().method())); await callback(); const response = await pending, raw = await response.json(); check('Actual callback ' + endpoint, response.ok(), raw); console.log(endpoint + ' ' + response.status()); return raw.data; }
const browser = await chromium.launch({ headless: true }), context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true }), page = await context.newPage();
page.setDefaultTimeout(120000); page.on('pageerror', error => report.errors.push(error.message));
const capture = async (target, name) => { await target.screenshot({ path: path.join(out, name + '.png') }); report.captures.push(name + '.png'); };
try {
  const mona = await login('mona.adel@orgtik.test'), staff = await api('sos', '/api/auth/workspace', mona, 'POST', { mode: 'staff', target: 'admin' });
  const draft = await api('admin', '/v1/admin/invoices', staff, 'POST', { workspaceId: 'ws_nile', lines: [{ label: 'Actual native owner payment link', amount: 50 }] });
  const invoice = await api('admin', `/v1/admin/console/billing/invoices/${draft.id}/action`, staff, 'POST', { action: 'issue' });
  await enter(page, staff, 'admin', '/billing'); await page.getByRole('heading', { name: 'Billing operations', level: 1, exact: true }).waitFor();
  await page.getByRole('searchbox', { name: 'Find invoice or workspace', exact: true }).fill(invoice.number);
  await page.getByRole('button', { name: invoice.number, exact: true }).click(); await page.getByRole('dialog').waitFor();
  await mutation(page, '/v1/admin/console/billing/manual-retry', () => page.getByRole('button', { name: 'Pause staff attempts', exact: true }).click());
  await page.getByRole('button', { name: 'Resume staff attempts', exact: true }).waitFor();
  check('Paused native staff attempts disable payment retry', !await page.getByRole('button', { name: 'Retry mock payment', exact: true }).isEnabled());
  await mutation(page, '/v1/admin/console/billing/manual-retry', () => page.getByRole('button', { name: 'Resume staff attempts', exact: true }).click());
  await page.getByRole('button', { name: 'Pause staff attempts', exact: true }).waitFor();
  await mutation(page, '/v1/admin/console/billing/notice', () => page.getByRole('button', { name: 'Record mock reminder', exact: true }).click());
  const link = await mutation(page, '/v1/admin/console/billing/pay-links', () => page.getByRole('button', { name: 'Create payment link', exact: true }).click());
  check('Actual invoice owns the created payment link', link.invoiceId === invoice.id && link.workspaceId === 'ws_nile');
  await capture(page, 'native-billing-recovery-controls'); await page.keyboard.press('Escape');
  const buyer = await login('nour.khaled@nilefoods.test'), owner = await api('sos', '/api/auth/workspace', buyer, 'POST', { workspaceId: 'ws_nile', target: 'suite' });
  const ownerContext = await browser.newContext({ viewport: { width: 390, height: 1000 } }), ownerPage = await ownerContext.newPage(); ownerPage.setDefaultTimeout(120000); ownerPage.on('pageerror', error => report.errors.push(error.message));
  await enter(ownerPage, owner, 'sos', link.path);
  const account = JSON.parse(fs.readFileSync(path.join(root, 'apps/sos/messages/en.json'), 'utf8')).AccountV3;
  await ownerPage.getByRole('heading', { name: account.paymentLink, level: 1, exact: true }).waitFor();
  const view = await api('sos', `/v1/app/pay-links/${link.id}`, owner), method = view.paymentMethods.find(row => row.kind === 'card' && row.last4 !== '0002');
  await select(ownerPage, account.savedPaymentMethod, `${method.kind} ${method.last4 || ''}`);
  let lost = false; const original = [];
  await ownerPage.route(`**/v1/app/pay-links/${link.id}`, async route => {
    if (route.request().method() === 'POST') { original.push(route.request().postDataJSON()); if (!lost) { lost = true; await route.fetch(); await route.abort('failed'); return; } }
    await route.continue();
  });
  await ownerPage.getByRole('button', { name: account.payCurrentInvoice, exact: true }).click();
  await ownerPage.getByRole('button', { name: account.recoverOriginalPayment, exact: true }).waitFor();
  check('Lost response committed the actual owner invoice once', (await api('admin', '/v1/admin/console/billing', staff)).invoices.find(row => row.id === invoice.id).payments.length === 1);
  await ownerPage.reload({ waitUntil: 'domcontentloaded' });
  await ownerPage.getByRole('button', { name: account.recoverOriginalPayment, exact: true }).click();
  await ownerPage.getByRole('button', { name: account.recoverOriginalPayment, exact: true }).waitFor({ state: 'hidden' });
  check('Reload recovers exactly the original payment body', original.length === 2 && JSON.stringify(original[0]) === JSON.stringify(original[1]));
  check('Original payment recovery does not create a second charge', (await api('admin', '/v1/admin/console/billing', staff)).invoices.find(row => row.id === invoice.id).payments.length === 1);
  await capture(ownerPage, 'native-owner-pay-link-recovered-390');
  await ownerContext.close();
  const paid = (await api('admin', '/v1/admin/console/billing', staff)).invoices.find(row => row.id === invoice.id);
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByRole('heading', { name: 'Billing operations', level: 1, exact: true }).waitFor();
  await page.getByRole('searchbox', { name: 'Find invoice or workspace', exact: true }).fill(invoice.number);
  await page.getByRole('button', { name: invoice.number, exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Amount', exact: true }).fill('5'); await page.getByRole('textbox', { name: 'Audit reason', exact: true }).fill('Ordinary native credit-note proof');
  await mutation(page, `/v1/admin/console/billing/invoices/${invoice.id}/action`, () => page.getByRole('button', { name: 'Record mock refund', exact: true }).click());
  const refunded = (await api('admin', '/v1/admin/console/billing', staff)).invoices.find(row => row.id === invoice.id);
  check('Ordinary refund creates native credit note with original issued money', refunded.creditNotes.length === paid.creditNotes.length + 1 && refunded.total === invoice.total && refunded.currency === invoice.currency);
  await capture(page, 'native-invoice-credit-note'); await page.keyboard.press('Escape');
  await page.goto('http://localhost:4608/en/staff/invitations', { waitUntil: 'domcontentloaded' }); await page.getByRole('heading', { name: 'Staff invitations', level: 1, exact: true }).waitFor();
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('ahmed.tarek@orgtik.test');
  const invitation = await mutation(page, '/v1/admin/console/staff/invitations', () => page.getByRole('button', { name: 'Invite staff person', exact: true }).click());
  const row = page.getByRole('table').locator('tbody tr').filter({ hasText: invitation.email }); await row.waitFor();
  check('Staff invitation displays human role labels', (await row.innerText()).includes('Support') && !(await row.innerText()).includes('super_admin'));
  await capture(page, 'native-staff-invitation');
  const invitee = await login('ahmed.tarek@orgtik.test'), inviteeContext = await browser.newContext({ viewport: { width: 390, height: 1000 } }), inviteePage = await inviteeContext.newPage(); inviteePage.setDefaultTimeout(120000); inviteePage.on('pageerror', error => report.errors.push(error.message));
  await enter(inviteePage, invitee, 'sos', '/staff-invitations'); await inviteePage.getByRole('heading', { name: account.staffInvitations, level: 1, exact: true }).waitFor();
  await capture(inviteePage, 'native-staff-invitation-recipient-390');
  const accepted = await mutation(inviteePage, `/v1/app/staff-invitations/${invitation.id}/accept`, () => inviteePage.getByRole('button', { name: account.acceptStaffInvitation, exact: true }).click());
  check('Actual staff acceptance ends the old session before access is reused', accepted.state === 'accepted' && accepted.sessionAction === 'signed_out');
  await inviteePage.waitForURL('**/auth/login');
  const next = await login('ahmed.tarek@orgtik.test'), nextStaff = await api('sos', '/api/auth/workspace', next, 'POST', { mode: 'staff', target: 'admin' });
  check('Accepted native staff person can select Console after fresh login', nextStaff.staffAccess.apps.includes('admin'));
  await inviteeContext.close();
  await page.goto('http://localhost:4608/en/workspaces/ws_nile', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'View as owner', exact: true }).click();
  const dialog = page.getByRole('alertdialog'); await dialog.getByRole('textbox').fill('Actual read-only owner view proof');
  const popupPending = page.waitForEvent('popup'); await dialog.getByRole('button', { name: 'Open read-only view', exact: true }).click(); const popup = await popupPending; popup.setDefaultTimeout(120000);
  await popup.waitForLoadState('domcontentloaded'); await popup.waitForURL(url => !url.pathname.startsWith('/auth'));
  check('Ordinary View-as opens actual Account rather than a presentation route', popup.url().startsWith('http://localhost:4600/') && !popup.url().includes('/presentation'));
  await popup.getByText(/read.only/i).first().waitFor(); await capture(popup, 'native-owner-view-as');
  check('Source Console remains its original staff view', page.url().includes('/en/workspaces/ws_nile'));
  await popup.close();
  check('No runtime errors in native billing and handoffs', !report.errors.length, report.errors); report.completed = true;
} catch (error) { report.failure = error.message; await capture(page, 'billing-handoffs-failure').catch(() => {}); throw error; }
finally { fs.writeFileSync(path.join(out, 'billing-handoffs.json'), JSON.stringify(report, null, 2) + '\n'); await browser.close(); }
console.log(JSON.stringify({ checks: report.checks.length, captures: report.captures.length, completed: report.completed }));
