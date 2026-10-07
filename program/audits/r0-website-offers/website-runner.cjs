// Isolated local R0 website flow verification. No hosted reset, clock change or provider calls.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const ROOT = path.resolve(process.env.SUITE_ROOT || path.join(__dirname, '../../..'));
const { chromium } = createRequire(path.join(ROOT, 'program/tools/audit-kit/package.json'))('playwright');
const WEB = process.env.WEBSITE_WEB || 'http://localhost:4173';
const API = process.env.WEBSITE_API || 'http://localhost:4200';
const SOS = process.env.WEBSITE_SOS || 'http://localhost:3013';
for (const value of [WEB, API, SOS]) {
  const origin = new URL(value);
  if (origin.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(origin.hostname) || origin.username || origin.password || origin.pathname !== '/') throw new Error('Loopback HTTP origins only.');
}
const FOCUS = process.argv.includes('--rejections');
const run = Date.now().toString(36) + '-' + crypto.randomUUID().slice(0, 8);
const OUT = path.resolve(process.env.WEBSITE_EVIDENCE_DIR || path.join(require('node:os').tmpdir(), 'orgtik-r0-website-' + (FOCUS ? 'rejections-' : '') + run));
fs.mkdirSync(OUT, { recursive: true });
const checks = [], shots = [];
const sourceFiles = ['src/App.jsx', 'src/content/snapshot.js', 'src/content/strings-templates.js', 'src/reference/PurchaseCheckout.jsx', 'src/reference/PurchaseUI.jsx', 'src/reference/PurchasePricing.jsx', 'src/reference/purchase-adapter.js', 'src/reference/purchase-catalog.js', 'src/reference/purchase-platform.js', 'src/reference/purchase-store.js', 'src/reference/purchase.css', 'src/reference/suite-session.js', 'tests/purchase.test.mjs', 'tests/suite-session.test.mjs'];
const metadata = { version: 1, startedAt: new Date().toISOString(), localOnly: true, resetUsed: false, clockMutationUsed: false, origins: { website: WEB, api: API, sos: SOS }, sourceFingerprints: sourceFiles.map(file => ({ file: 'apps/website/landing-directions/' + file, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'apps/website/landing-directions', file))).digest('hex') })) };
const redact = value => String(value).replace(/([?&](?:code|token|secret)=)[^&\s]+/gi, '$1[redacted]').replace(/Bearer\s+[^\s]+/gi, 'Bearer [redacted]').replace(/(?:Local|Prototype|Mismatch)@2026/g, '[redacted]');
const writeReport = error => fs.writeFileSync(path.join(OUT, 'website-qa.json'), JSON.stringify({ ...metadata, finishedAt: new Date().toISOString(), run, checks, shots, ...(error ? { error: redact(error.stack || error.message) } : {}) }, null, 2) + '\n');
const assert = (name, pass, details) => { checks.push({ name, pass: Boolean(pass), details }); if (!pass) throw new Error(name); };
const brief = order => ({ reference: order.reference, quoteId: order.quoteId, currency: order.currency, decimals: order.decimals, total: order.quote.total, tax: order.quote.tax, region: order.region, paymentStatus: order.paymentStatus, proofPresent: Boolean(order.claimToken) });
async function api(route, body, token) {
  const response = await fetch(API + route, { method: body ? 'POST' : 'GET', headers: { ...(token ? { authorization: 'Bearer ' + token } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(route + ': ' + response.status + ' ' + result.error?.code);
  return result.data;
}
const login = email => api('/api/auth/login', { email, password: process.env.WEBSITE_FIXTURE_PASSWORD || 'Local@2026' });
const files = (id, months = 3) => ({ id, kind: 'software', lines: [{ catalogId: 'files', months, autoRenew: true }] });
async function start(browser, width = 1440, country, token) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, reducedMotion: 'reduce' });
  if (country) await context.route(API + '/v1/public/**', route => route.continue({ headers: { ...route.request().headers(), 'x-mock-country': country } }));
  if (token) await context.addInitScript(({ token, origin }) => { if (location.origin === origin) localStorage.setItem('orgtik.suite-session.v1', JSON.stringify({ token })); }, { token, origin: WEB });
  const page = await context.newPage();
  const errors = [], quotes = [], orders = [], requests = [];
  page.on('pageerror', error => errors.push(redact(error.message)));
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin === API && request.method() === 'POST') requests.push({ path: url.pathname, body: request.postDataJSON() });
  });
  page.on('response', async response => {
    if (!response.ok()) return;
    const pathname = new URL(response.url()).pathname;
    try { const result = await response.json(); if (pathname === '/v1/public/website-quotes') quotes.push(result.data); if (pathname === '/v1/public/website-orders') orders.push(result.data); } catch {}
  });
  await page.goto(WEB + '/checkout?qa=1', { waitUntil: 'networkidle' });
  return { context, page, errors, quotes, orders, requests };
}
async function seed(ctx, group) {
  await ctx.page.evaluate(group => localStorage.setItem('orgtik.cart.v2', JSON.stringify({version:2,groups:[group],messages:[]})), group);
  await ctx.page.reload({waitUntil:'networkidle'});
  await ctx.page.waitForFunction(() => {const text=document.querySelector('.purchase-payment-total strong')?.textContent;return text && text !== '—'});
  await ctx.page.getByRole('button', { name: /^Pay / }).waitFor();
}
async function fill(ctx, email, method = 'twint') {
  await ctx.page.locator('input[name="name"]').fill('Website Prototype');
  await ctx.page.locator('input[name="email"]').fill(email);
  await ctx.page.locator('input[name="paymentMethod"][value="' + method + '"]').check();
}
async function capture(ctx, name, fullPage = true) {
  await ctx.page.evaluate(() => document.fonts.ready);
  const facts = await ctx.page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, heading: document.querySelector('h1')?.textContent, direction: document.documentElement.dir }));
  await ctx.page.screenshot({ path: path.join(OUT, name + '.png'), fullPage });
  shots.push({ name, facts });
  assert(name + ': no page overflow', facts.scroll <= facts.width, facts);
  assert(name + ': no runtime errors', ctx.errors.length === 0, ctx.errors);
  if (await ctx.page.locator('.purchase-summary > .purchase-caption').isVisible()) {
    const ratio=await ctx.page.locator('.purchase-summary > .purchase-caption').evaluate(el=>{const rgb=color=>color.match(/[\d.]+/g).slice(0,3).map(Number);const l=color=>rgb(color).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);const fg=l(getComputedStyle(el).color),bg=l(getComputedStyle(el.closest('.purchase-summary')).backgroundColor);return(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)});
    assert(name+': summary regional caption meets text contrast',ratio>=4.5,{ratio});
  }
}
async function paid(ctx) {
  await ctx.page.getByRole('button', { name: /^(Pay |Recover payment$)/ }).click();
  await ctx.page.getByRole('heading', { name: 'Access your customer account.', exact: true }).waitFor({ timeout: 30000 });
  await ctx.page.getByRole('button', { name: 'Set up my account', exact: true }).waitFor();
  return ctx.orders.at(-1);
}
let browser;
(async () => {
  const status = await api('/__mock/status');
  const clock = await api('/__mock/clock');
  if (status.journal?.sandbox !== 'r0-local' || clock.mode !== 'frozen') throw new Error('The runner requires the dedicated r0-local fixture and an externally frozen clock.');
  metadata.apiGeneration = status.generation; metadata.mockNow = clock.now;
  browser = await chromium.launch();
  try {
    if (FOCUS) {
      const rejected = await start(browser,390);
      await seed(rejected,files('rejected-'+run));await fill(rejected,`rejected-${run}@prototype.test`);
      await rejected.context.route(API+'/v1/public/website-orders',route=>route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:{code:'owner_required'}})}),{times:1});
      await rejected.page.getByRole('button',{name:/^Pay /}).click();
      await rejected.page.getByRole('alert').filter({hasText:/workspace owner/}).waitFor();
      assert('A first explicit rejection leaves billing editable and no pending attempt',await rejected.page.locator('input[name="email"]').isEnabled()&&await rejected.page.evaluate(()=>sessionStorage.getItem('orgtik.purchase-attempt.v1')===null));
      assert('Rejected request never creates a paid receipt',rejected.orders.length===0);
      const first=rejected.requests.filter(r=>r.path.endsWith('website-orders')).at(-1).body.reference;
      await capture(rejected,'owner-rejection-editable-390');
      const successful=await paid(rejected);
      assert('A new permitted confirmation uses a new reference',successful.reference!==first);
      await rejected.context.close();
      const recovery=await start(browser,390);await seed(recovery,files('protected-recovery-'+run));await fill(recovery,`protected-${run}@prototype.test`);
      let paidBeforeLoss;
      await recovery.context.route(API+'/v1/public/website-orders',async route=>{const response=await route.fetch();paidBeforeLoss=(await response.json()).data;await route.abort('failed')},{times:1});
      await recovery.page.getByRole('button',{name:/^Pay /}).click();await recovery.page.getByRole('alert').filter({hasText:/recover the same attempt/}).waitFor();
      const quoteCount=recovery.quotes.length;
      await recovery.context.route(API+'/v1/public/website-orders',route=>route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:{code:'owner_required'}})}),{times:1});
      await recovery.page.getByRole('button',{name:'Recover payment',exact:true}).click();await recovery.page.getByRole('alert').filter({hasText:/workspace owner/}).waitFor();
      assert('A recovery rejection preserves the previously uncertain reference',await recovery.page.evaluate(reference=>JSON.parse(sessionStorage.getItem('orgtik.purchase-attempt.v1')).payload.reference===reference,paidBeforeLoss.reference));
      assert('Uncertain recovery keeps its original billing immutable',await recovery.page.locator('input[name="email"]').isDisabled());
      await capture(recovery,'owner-rejection-uncertain-recovery-390');
      const recovered=await paid(recovery);
      assert('Recovered permission reuses the paid server order without requoting',recovered.reference===paidBeforeLoss.reference&&recovered.createdAt===paidBeforeLoss.createdAt&&recovery.quotes.length===quoteCount);
      const bodies=recovery.requests.filter(r=>r.path.endsWith('website-orders')).map(r=>r.body);
      assert('All uncertain recovery requests retain the exact payload',bodies.length===3&&bodies.every(body=>JSON.stringify(body)===JSON.stringify(bodies[0])));
      await recovery.context.close();
      return;
    }
    // Complete guest purchase, manual and automatic terms, account creation and one-time handoff.
    const guest = await start(browser);
    const email = `website-${run}@prototype.test`;
    await seed(guest, { id: 'guest-' + run, kind: 'software', lines: [{ catalogId: 'files', months: 6, autoRenew: true }, { catalogId: 'website', months: 3, autoRenew: false }] });
    assert('No payment method selected by default', await guest.page.locator('input[name="paymentMethod"]:checked').count() === 0);
    assert('Pay remains disabled before a payment method', await guest.page.getByRole('button', { name: /^Pay / }).isDisabled());
    await fill(guest, email);
    const quote = guest.quotes.at(-1);
    assert('The full taxed server quote is visible before Pay', await guest.page.locator('.purchase-payment-total').innerText().then(t => t.includes((quote.quote.total / 100).toFixed(2))), { total: quote.quote.total, tax: quote.quote.tax });
    assert('Quote contains only configuration, without browser amounts', guest.requests.filter(r => r.path.endsWith('website-quotes')).every(r => !JSON.stringify(r.body).match(/total|currency|monthlyMinor|price/)));
    await capture(guest, 'checkout-guest-ch-1440');
    const order = await paid(guest);
    assert('Receipt comes from the confirmed server quote', order.quoteId === quote.quoteId && order.quote.total === quote.quote.total && order.claimToken, brief(order));
    assert('Tool activation is pending the workspace link', await guest.page.getByText('Ready to activate in your workspace', { exact: true }).count() === 1);
    assert('Website management is a service onboarding request', order.groups.flatMap(g => g.lines).find(l => l.catalogId === 'website').activation === 'awaiting-onboarding');
    assert('Confirmation retains six/three month terms and renewal choices', order.groups[0].lines[0].months === 6 && order.groups[0].lines[0].autoRenew && order.groups[0].lines[1].months === 3 && !order.groups[0].lines[1].autoRenew);
    const confirmationBody = guest.requests.find(r => r.path === '/v1/public/website-orders').body;
    assert('Confirm transmits proof/configuration only', Object.keys(confirmationBody).sort().join(',') === 'billing,paymentMethod,quoteId,reference');
    await capture(guest, 'receipt-guest-ch-1440');
    await guest.page.getByRole('button', { name: 'Set up my account', exact: true }).click();
    const dialog = guest.page.getByRole('dialog');
    await dialog.locator('input[name="password"]').fill('Prototype@2026');
    await dialog.locator('input[name="confirmPassword"]').fill('Mismatch@2026');
    await dialog.getByRole('button', { name: 'Continue to my dashboard', exact: true }).click();
    assert('Password mismatch prevents registration', guest.requests.filter(r => r.path === '/api/auth/register').length === 0);
    await dialog.locator('input[name="confirmPassword"]').fill('Prototype@2026');
    await capture(guest, 'password-setup-1440', false);
    await dialog.getByRole('button', { name: 'Continue to my dashboard', exact: true }).click();
    await guest.page.waitForURL(url => url.origin === SOS && !url.pathname.includes('/auth'), { timeout: 60000 });
    assert('Setup registers once and links only the server claim', guest.requests.filter(r => r.path === '/api/auth/register').length === 1 && guest.requests.filter(r => r.path === '/v1/app/website-orders').every(r => Object.keys(r.body).sort().join(',') === 'claimToken,reference'));
    assert('Handoff opens the dashboard without credentials in the address', !guest.page.url().match(/token|password|email|code=/));
    const auth = await api('/api/auth/login', { email, password: 'Prototype@2026' });
    const token = auth.tokens.accessToken;
    const me = await api('/v1/app/me', null, token);
    const invoices = await api('/v1/app/invoices', null, token);
    const invoice = invoices.find(i => i.websiteReference === order.reference) || invoices[0];
    const subscriptions = await api('/v1/app/subscriptions', null, token);
    const requests = await api('/v1/app/service-requests', null, token);
    assert('Guest claim initializes its empty workspace in the paid currency', me.workspace.currency === order.currency, { currency: me.workspace.currency });
    assert('Linked invoice agrees with the immutable receipt exactly once', invoices.length === 1 && invoice.currency === order.currency && Math.abs(invoice.total * 100 - order.quote.total) < 0.01, { count: invoices.length, currency: invoice.currency, total: invoice.total });
    const fileLine = subscriptions.lines.find(l => l.tool === 'files');
    assert('Purchased tool has the six-month renewal boundary', fileLine?.termMonths === 6 && fileLine.state === 'active', { termMonths: fileLine?.termMonths, state: fileLine?.state });
    assert('Website purchase opens one managed request without CMS entitlement', requests.length === 1 && !subscriptions.lines.some(l => l.tool === 'website_manager'), { serviceRequests: requests.length });
    await guest.page.goto(SOS + '/billing/invoices/' + invoice.id, { waitUntil: 'networkidle' });
    await capture(guest, 'linked-invoice-ch-1440');
    await guest.page.goto(WEB + '/checkout', { waitUntil: 'networkidle' });
    await guest.page.getByText('Workspace activation confirmed', { exact: true }).waitFor();
    assert('Receipt refresh confirms activation without duplicating the invoice', (await api('/v1/app/invoices', null, token)).length === 1);
    assert('Receipt survives reload without passwords or card details', await guest.page.evaluate(() => [...Object.keys(sessionStorage)].filter(k => k.includes('purchase')).every(k => !/password|cardNumber|securityCode/.test(sessionStorage.getItem(k)))));
    await guest.context.close();

    // Controlled mock visitor region with its required precision, at mobile width.
    const gulf = await start(browser, 390, 'KW');
    await seed(gulf, files('kw-' + run, 12));
    await fill(gulf, `kw-${run}@prototype.test`, 'paypal');
    assert('KWD uses the server currency and three decimals', gulf.quotes.at(-1).currency === 'KWD' && /KWD\s+[\d’,.]+\.\d{3}/.test(await gulf.page.locator('.purchase-payment-total').innerText()));
    assert('TWINT is absent outside the supported server region', await gulf.page.locator('input[value="twint"]').count() === 0);
    await gulf.page.locator('.purchase-mobile-order summary').click();
    await capture(gulf, 'checkout-kw-390');
    await paid(gulf);
    await capture(gulf, 'receipt-kw-390');
    await gulf.page.getByRole('button', { name: 'Set up my account', exact: true }).click();
    await capture(gulf, 'password-setup-390', false);
    await gulf.context.close();

    // Confirmed decline preserves cart/billing and creates a new immutable attempt on retry.
    const decline = await start(browser, 390);
    await seed(decline, files('decline-' + run, 3));
    await fill(decline, `decline-${run}@prototype.test`);
    await decline.page.locator('.purchase-demo-controls summary').click();
    await decline.page.locator('.purchase-demo-controls select').first().selectOption('declined');
    await decline.page.getByRole('button', { name: /^Pay / }).click();
    await decline.page.getByRole('alert').filter({ hasText: /declined/i }).waitFor();
    assert('Declined payment preserves entered billing and cart', await decline.page.locator('input[name="email"]').inputValue() === `decline-${run}@prototype.test` && await decline.page.evaluate(() => JSON.parse(localStorage.getItem('orgtik.cart.v2')).groups.length) === 1);
    assert('Decline never creates a paid claim', decline.orders.at(-1).paymentStatus === 'failed' && !decline.orders.at(-1).claimToken);
    await capture(decline, 'declined-payment-390');
    const firstRef = decline.orders.at(-1).reference;
    await decline.page.locator('.purchase-demo-controls select').first().selectOption('success');
    const retried = await paid(decline);
    assert('Confirmed decline uses a new attempt reference for retry', retried.reference !== firstRef, { failedReference: firstRef, paidReference: retried.reference });
    await decline.context.close();

    // Lose the response after the server confirms, then recover exactly that attempt after reload.
    const unknown = await start(browser);
    await seed(unknown, files('recovery-' + run, 6));
    await fill(unknown, `recover-${run}@prototype.test`);
    let lost;
    await unknown.context.route(API + '/v1/public/website-orders', async route => { const response = await route.fetch(); lost = (await response.json()).data; await route.abort('failed'); }, { times: 1 });
    await unknown.page.getByRole('button', { name: /^Pay / }).click();
    await unknown.page.getByRole('alert').filter({ hasText: /recover the same attempt/ }).waitFor();
    assert('Unknown result keeps the original pending proof and billing', await unknown.page.evaluate(() => Boolean(JSON.parse(sessionStorage.getItem('orgtik.purchase-attempt.v1'))?.payload.quoteId)));
    await unknown.page.evaluate(() => localStorage.setItem('orgtik.cart.v2',JSON.stringify({version:2,groups:[],messages:[]})));
    await unknown.page.reload({ waitUntil: 'networkidle' });
    assert('Recovery is available after the cart was emptied', await unknown.page.getByRole('button', { name: 'Recover payment', exact: true }).isEnabled() && await unknown.page.locator('input[name="email"]').isDisabled());
    await capture(unknown, 'payment-recovery-1440');
    const quoteCount = unknown.quotes.length;
    const recovered = await paid(unknown);
    const attempts = unknown.requests.filter(r => r.path === '/v1/public/website-orders').map(r => r.body);
    assert('Recovery reuses the identical request without requoting', unknown.quotes.length === quoteCount && attempts.length === 2 && JSON.stringify(attempts[0]) === JSON.stringify(attempts[1]));
    assert('Lost response recovers the same server result', recovered.reference === lost.reference && recovered.quoteId === lost.quoteId && recovered.createdAt === lost.createdAt && recovered.quote.total === lost.quote.total, brief(recovered));
    await unknown.context.close();

    // A rejected expired quote updates the visible quote, requiring another explicit Pay.
    const expiry = await start(browser);
    await seed(expiry, files('expiry-' + run));
    await fill(expiry, `expiry-${run}@prototype.test`);
    const quoteRequestsBefore = expiry.requests.filter(r => r.path.endsWith('website-quotes')).length;
    const expiredId = expiry.quotes.at(-1).quoteId;
    await expiry.context.route(API + '/v1/public/website-orders', route => route.fulfill({ status: 410, contentType: 'application/json', body: JSON.stringify({ error: { code: 'quote_expired' } }) }), { times: 1 });
    const refreshedResponse = expiry.page.waitForResponse(r => new URL(r.url()).pathname === '/v1/public/website-quotes' && r.ok());
    await expiry.page.getByRole('button', { name: /^Pay / }).click();
    await expiry.page.getByRole('alert').filter({ hasText: /quote expired/ }).waitFor();
    const refreshed = (await (await refreshedResponse).json()).data;
    await expiry.page.waitForFunction(() => !document.querySelector('.purchase-checkout-panel form button[type="submit"]').disabled);
    assert('Expired quote refreshes before a second explicit Pay', expiry.orders.length === 0 && refreshed.quoteId !== expiredId && expiry.requests.filter(r => r.path.endsWith('website-quotes')).length === quoteRequestsBefore + 1, { confirmedOrders: expiry.orders.length, quoteRequests: expiry.requests.filter(r => r.path.endsWith('website-quotes')).length, quoteRequestsBefore });
    await capture(expiry, 'quote-expired-1440');
    await paid(expiry);
    await expiry.context.close();

    // A signed-in workspace overrides the visitor fixture and pays the displayed regional tax.
    const nour = await login('nour.khaled@nilefoods.test');
    const signed = await start(browser, 1440, 'KW', nour.tokens.accessToken);
    await seed(signed, files('workspace-' + run, 3));
    await signed.page.waitForFunction(() => document.querySelector('input[name="email"]')?.value === 'nour.khaled@nilefoods.test');
    await signed.page.locator('input[name="paymentMethod"][value="paypal"]').check();
    const workspaceQuote = signed.quotes.at(-1);
    assert('Signed-in workspace billing wins over the mock country override', workspaceQuote.currency === 'EGP' && workspaceQuote.region.country === 'EG' && workspaceQuote.region.source === 'workspace', { currency: workspaceQuote.currency, region: workspaceQuote.region });
    assert('Workspace tax is included in the Pay total before payment', workspaceQuote.quote.tax > 0 && await signed.page.getByText('Tax added (14%)', { exact: false }).count() > 0);
    await capture(signed, 'checkout-workspace-egp-1440');
    await signed.page.getByRole('button', { name: /^Pay / }).click();
    await signed.page.getByRole('heading', { name: 'Access your customer account.', exact: true }).waitFor();
    await signed.page.getByText('Workspace activation confirmed', { exact: true }).waitFor();
    assert('Signed-in confirmation reflects actual platform activation', await signed.page.getByText('Workspace activation confirmed', { exact: true }).count() === 1);
    assert('Frozen tax is explained in the receipt', await signed.page.locator('.purchase-receipt tfoot').innerText().then(t => t.includes('Tax added (14%)')));
    await capture(signed, 'receipt-workspace-egp-1440');
    await signed.context.close();

    // Preserve the previous Partners/header/footer design and responsive navigation.
    const parity = await start(browser, 390);
    await parity.page.goto(WEB + '/legal/partners', { waitUntil: 'networkidle' });
    assert('Partners and Imprint remain in the legal navigation', await parity.page.getByRole('tab', { name: 'Partners', exact: true }).count() > 0 && await parity.page.getByRole('tab', { name: 'Imprint', exact: true }).count() > 0);
    await capture(parity, 'partners-preserved-390');
    await parity.page.goto(WEB + '/', { waitUntil: 'networkidle' });
    await parity.page.locator('#partners').scrollIntoViewIfNeeded();
    assert('Mock Partners strip remains between Two sides and Work', await parity.page.evaluate(() => { const section = document.querySelector('#partners'); return section?.previousElementSibling?.id === 'two-sides' && section?.nextElementSibling?.id === 'work'; }));
    await capture(parity, 'home-partners-preserved-390', false);
    await parity.context.close();
  } finally {
    if (browser) await browser.close();
    writeReport();
  }
  console.log(JSON.stringify({ out: OUT, checks: checks.length, captures: shots.length, failed: checks.filter(c => !c.pass) }, null, 2));
})().catch(error => { writeReport(error); console.error(redact(error.stack || error.message)); process.exit(1); });
