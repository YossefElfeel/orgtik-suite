// Fresh local finance UI run. No reset, clock mutation, hosted URL or saved credentials.
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { createRequire } = require("node:module");
const ROOT = path.resolve(process.env.SUITE_ROOT || path.join(__dirname, "../../.."));
const { chromium } = createRequire(path.join(ROOT, "program/tools/audit-kit/package.json"))("playwright");
const urls = {
  sosApi: process.env.FINANCE_SOS_API || "http://localhost:4200",
  adminApi: process.env.FINANCE_ADMIN_API || "http://localhost:4208",
  sos: process.env.FINANCE_SOS_WEB || "http://localhost:3013",
  admin: process.env.FINANCE_ADMIN_WEB || "http://localhost:3008",
};
for (const value of Object.values(urls)) {
  const url = new URL(value);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname) || url.username || url.password) throw new Error("Loopback HTTP origins only.");
}
const RUN = new Date().toISOString().replace(/\D/g, "").slice(0, 14) + "-" + crypto.randomUUID().slice(0, 8);
const OUT = path.resolve(process.env.FINANCE_EVIDENCE_DIR || path.join(__dirname, "clean-" + RUN));
fs.mkdirSync(OUT, { recursive: true });
const checks = [], captures = [];
const report = { version: 1, runId: RUN, startedAt: new Date().toISOString(), timeZone: "Africa/Cairo", origins: urls, localOnly: true, resetUsed: false, clockMutationUsed: false, checks, captures };
const redact = value => String(value).replace(/([?&](?:code|token|secret)=)[^&\s]+/gi, "$1[redacted]").replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]").replace(/Local@2026/g, "[redacted]");
const check = (name, ok, details) => { checks.push({ name, ok: Boolean(ok), ...(details !== undefined ? { details } : {}) }); if (!ok) throw new Error("Check failed: " + name); };
const rows = value => Array.isArray(value) ? value : value?.items || [];
let token, staffToken, workspaceId, workspaceName, customerId, staffId, paymentMethodId, browser;
async function api(method, endpoint, body, headers = {}) {
  const origin = endpoint.startsWith("/v1/admin") ? urls.adminApi : urls.sosApi;
  const activeToken = endpoint.startsWith("/v1/admin") ? staffToken : token;
  const response = await fetch(origin + endpoint, { method, headers: { "content-type": "application/json", ...(activeToken ? { authorization: "Bearer " + activeToken } : {}), ...(endpoint.startsWith("/v1/app") && workspaceId ? { "x-workspace": workspaceId } : {}), ...headers }, ...(body !== null && body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000) });
  const result = await response.json();
  if (!response.ok) throw new Error("Local API " + method + " " + endpoint.split("?")[0] + " answered " + response.status + " (" + (result.error?.code || "unavailable") + ")");
  return result.data;
}
function message(app, locale, area, key) {
  const file = app === "sos" ? "apps/sos/messages/usr/" + locale + "/" + area + ".json" : "apps/admin/messages/" + locale + "/" + area + ".json";
  return key.split(".").reduce((value, part) => value?.[part], JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8")));
}
async function context(app, locale = "en", theme = "light", width = 1440) {
  const origin = urls[app], view = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, colorScheme: theme, reducedMotion: "reduce" });
  const cookies = [{ name: "NEXT_LOCALE", value: locale, url: origin }, { name: "ot-theme", value: theme, url: origin }, { name: "ot-workspace", value: workspaceId, url: origin }];
  await view.addCookies(cookies);
  const page = await view.newPage(), errors = [];
  page.on("pageerror", error => errors.push(redact(error.message)));
  const handoff = await api("POST", "/api/auth/handoff", null, { authorization: "Bearer " + (app === "admin" ? staffToken : token) });
  const profilePath = app === "admin" ? "/v1/admin/me" : "/api/auth/me";
  const profileResponse = page.waitForResponse(response => new URL(response.url()).pathname === profilePath && response.status() === 200);
  await page.goto(origin + (app === "sos" ? "/auth/handoff" : "/" + locale + "/auth") + "?code=" + encodeURIComponent(handoff.code), { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForURL(url => url.origin === origin && !url.pathname.includes("/auth"), { timeout: 60000 });
  const profile = await (await profileResponse).json();
  check(app + " " + locale + " " + theme + " " + width + ": correct authenticated actor", profile.data?.user?.id === (app === "admin" ? staffId : customerId));
  await view.addCookies(cookies);
  if (app === "sos") {
    await page.getByText(workspaceName, { exact: true }).first().waitFor();
    check("Customer UI selects its fixture workspace", (await view.cookies()).some(cookie => cookie.name === "ot-workspace" && cookie.value === workspaceId));
  }
  return { view, page, origin, errors, app, locale, theme, width };
}
async function open(ctx, route) {
  await ctx.page.goto(ctx.origin + (ctx.app === "sos" ? route : "/" + ctx.locale + route), { waitUntil: "networkidle", timeout: 120000 });
  await ctx.page.locator("#ot-main, main").first().waitFor();
  await ctx.page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 30000 });
  await ctx.page.addStyleTag({ content: "nextjs-portal{display:none!important}*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;caret-color:transparent!important}" });
  await ctx.page.evaluate(() => document.fonts.ready);
}
async function capture(ctx, label) {
  const file = label + ".png";
  await ctx.page.screenshot({ path: path.join(OUT, file) });
  const facts = await ctx.page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, lang: document.documentElement.lang, dir: document.documentElement.dir, theme: document.documentElement.dataset.theme }));
  captures.push({ file, app: ctx.app, locale: ctx.locale, theme: ctx.theme, width: ctx.width, route: new URL(ctx.page.url()).pathname, facts, pageErrors: [...ctx.errors] });
  check(label + ": viewport fit", facts.scroll <= facts.width + 1, facts);
  check(label + ": no uncaught errors", ctx.errors.length === 0, ctx.errors);
  check(label + ": locale and direction", facts.lang.split("-")[0] === ctx.locale && facts.dir === (ctx.locale === "ar" ? "rtl" : "ltr"), { lang: facts.lang, dir: facts.dir });
  check(label + ": theme", facts.theme === ctx.theme, { actual: facts.theme });
}
async function fill(page, label, value) { const field = page.getByLabel(label, { exact: false }); await field.fill(String(value)); await field.press("Tab"); }
async function prepareCheckout(ctx, route, coupon) {
  await open(ctx, route);
  await ctx.page.getByRole("heading", { name: "Checkout", exact: true }).waitFor();
  if (coupon) {
    await ctx.page.getByLabel("Code", { exact: true }).fill(coupon);
    await ctx.page.getByRole("button", { name: "Apply", exact: true }).click();
    await ctx.page.getByText("Code " + coupon + " applied", { exact: false }).waitFor();
  }
  await ctx.page.waitForFunction(() => [...document.querySelectorAll("button")].some(button => /^Pay /.test(button.textContent || "") && !button.disabled));
}
async function ledger(id, label) {
  const invoice = await api("GET", "/v1/admin/invoices/" + id), net = invoice.lines.reduce((sum, line) => sum + line.amount, 0);
  check(label + ": net ledger balances", Math.abs(net - invoice.subtotal) < 0.001, { netLines: net, subtotal: invoice.subtotal });
  check(label + ": tax/payment balance", Math.abs(invoice.subtotal + invoice.tax - invoice.total) < 0.001 && invoice.payments.some(payment => payment.status === "succeeded" && Math.abs(payment.amount - invoice.total) < 0.001), { subtotal: invoice.subtotal, tax: invoice.tax, total: invoice.total });
  return invoice;
}
async function run() {
  const status = await fetch(urls.sosApi + "/__mock/status").then(response => response.json()), clock = await fetch(urls.sosApi + "/__mock/clock").then(response => response.json());
  check("Dedicated local fixture guard", status.data?.journal?.sandbox === "r0-local", { sandbox: status.data?.journal?.sandbox });
  check("Clock configured externally", clock.data?.mode === "frozen", { mode: clock.data?.mode, now: clock.data?.now });
  report.apiGeneration = status.data.generation; report.mockNow = clock.data.now;
  const signed = await fetch(urls.sosApi + "/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "mona.adel@orgtik.test", password: process.env.FINANCE_FIXTURE_PASSWORD || "Local@2026" }) }).then(response => response.json());
  staffToken = signed.data?.tokens?.accessToken; staffId = signed.data?.user?.id; check("Staff fixture sign-in", Boolean(staffToken));
  const publicQuote = await api("POST", "/v1/public/website-quotes", { groups: [{ id: "finance-billing-seed-" + RUN, kind: "software", lines: [{ catalogId: "files", months: 1, autoRenew: false }] }] }, { "x-mock-country": "EG" });
  const publicPaid = await api("POST", "/v1/public/website-orders", { quoteId: publicQuote.quoteId, reference: "finance-billing-seed-" + RUN, paymentMethod: "card", billing: { name: "Finance Verification", legalName: "Finance Verification LLC", email: "finance-" + RUN + "@orgtik.test", country: "EG" } }, { "x-mock-country": "EG" });
  check("Guest billing seed is confirmed in EGP", publicPaid.paymentStatus === "succeeded" && publicPaid.currency === "EGP");
  const registration = await api("POST", "/api/auth/register", { name: "Finance Verification", email: "finance-" + RUN + "@orgtik.test", password: crypto.randomBytes(24).toString("base64url"), company: "Finance QA " + RUN });
  token = registration.tokens?.accessToken; customerId = registration.user?.id; check("Isolated customer registration", Boolean(token));
  const me = await api("GET", "/v1/app/me"); workspaceId = me.workspace.id; workspaceName = me.workspace.name;
  check("New customer starts with its own workspace", me.workspace.role === "owner" && me.workspaces.length === 1 && workspaceId !== "ws_orgtik", { workspaceId });
  report.fixtureWorkspaceId = workspaceId; report.fixtureMode = "unique-registered-customer";
  await api("POST", "/v1/app/website-orders", { reference: publicPaid.reference, claimToken: publicPaid.claimToken });
  await api("PUT", "/v1/app/billing", { country: "EG", legalName: "Finance Verification LLC", email: "finance-" + RUN + "@orgtik.test" });
  const billing = await api("GET", "/v1/app/billing");
  check("Paid guest order establishes fixture EGP billing", billing.country === "EG" && billing.currency === "EGP");
  const method = await api("POST", "/v1/app/payment-methods", { kind: "card", brand: "Visa", last4: "4242", expires: "12/28", makeDefault: true });
  paymentMethodId = method.id;
  const seedItems = ["tasks_pro", "files_pro", "hr_pro"].map(planId => ({ planId, cycle: "monthly", ...(planId !== "files_pro" ? { intent: "seat_purchase", quantity: 30 } : {}) }));
  const seed = await api("POST", "/v1/app/checkout/confirm", { items: seedItems, paymentMethodId }, { "idempotency-key": "finance-seed-" + RUN });
  check("Fixture buys thirty-seat monthly Operations plans", seed.invoice.total > 0 && seed.lines.filter(line => line.tool === "tasks" || line.tool === "hr").every(line => line.snapshot.quantity === 30), { invoiceId: seed.invoice.id, total: seed.invoice.total });
  browser = await chromium.launch();
  await financeFlows();
  report.ok = true;
}
async function financeFlows() {
  const customer = await context("sos"), staff = await context("admin");
  const before = await api("GET", "/v1/app/subscriptions"), note = "Finance clean contract " + RUN;
  await open(customer, "/tools/custom-plan");
  for (const name of ["CRM", "Marketing", "Chat"]) await customer.page.getByRole("checkbox", { name, exact: true }).check();
  await fill(customer.page, "Seats needed per tool", 60);
  await customer.page.getByLabel("Anything else").fill(note);
  const submitted = customer.page.waitForResponse(response => new URL(response.url()).pathname === "/v1/app/custom-plans" && response.request().method() === "POST" && response.status() === 201);
  await customer.page.getByRole("button", { name: "Send the request", exact: true }).click(); await submitted;
  const request = rows(await api("GET", "/v1/admin/custom-plans?pageSize=100")).find(row => row.notes === note);
  check("Custom request preserves selected tools/capacity", request?.tools.length === 3 && request.seats === 60, { requestId: request?.id, tools: request?.tools, seats: request?.seats });
  await open(staff, "/custom-plans");
  await staff.page.getByRole("row").filter({ hasText: note }).getByRole("button", { name: /Send quote/ }).click();
  await fill(staff.page, "Price (EGP)", 50000);
  await fill(staff.page, "CRM allocation", 50000); await fill(staff.page, "Marketing allocation", 0); await fill(staff.page, "Chat allocation", 1);
  await staff.page.getByRole("button", { name: "Send quote", exact: true }).click();
  check("Invalid full-period allocation is blocked", await staff.page.getByText(message("admin", "en", "customers", "Customers.quote.allocationRequired"), { exact: true }).isVisible());
  await capture(staff, "allocation-error-en-light-1440");
  await fill(staff.page, "Chat allocation", 0); await staff.page.getByRole("button", { name: "Send quote", exact: true }).click();
  await staff.page.getByRole("dialog").waitFor({ state: "hidden" });
  const quoted = rows(await api("GET", "/v1/admin/custom-plans?pageSize=100")).find(row => row.id === request.id);
  check("Quote keeps explicit zero allocations", quoted.quote.lines.length === 3 && quoted.quote.lines.reduce((sum, line) => sum + line.amount, 0) === 50000 && quoted.quote.lines.filter(line => line.amount === 0).length === 2, { amount: quoted.quote.amount, allocations: quoted.quote.lines.map(line => ({ tool: line.tool, amount: line.amount })) });
  await customer.page.reload({ waitUntil: "networkidle" });
  const card = customer.page.locator('[data-request="' + request.id + '"]');
  await card.getByRole("button", { name: "Accept the quote", exact: true }).click();
  await customer.page.getByRole("alertdialog").getByRole("button", { name: "Accept the quote", exact: true }).click();
  await card.getByRole("link", { name: "Continue to checkout", exact: true }).waitFor();
  const accepted = rows(await api("GET", "/v1/app/custom-plans?pageSize=100")).find(row => row.id === request.id), uncharged = await api("GET", "/v1/app/subscriptions");
  check("Acceptance prepares private plans without activation", accepted.privatePlanIds.length === 3 && uncharged.lines.length === before.lines.length && !uncharged.lines.some(line => accepted.privatePlanIds.includes(line.planId)));
  await capture(customer, "accepted-before-payment-en-light-1440");
  await card.getByRole("link", { name: "Continue to checkout", exact: true }).click();
  await customer.page.getByRole("heading", { name: "Checkout", exact: true }).waitFor();
  await customer.page.getByLabel("Code", { exact: true }).fill("LAUNCH20"); await customer.page.getByRole("button", { name: "Apply", exact: true }).click();
  await customer.page.getByText("Code LAUNCH20 applied", { exact: false }).waitFor();
  const firstQuote = await api("POST", "/v1/app/checkout/preview", { items: accepted.privatePlanIds.map(planId => ({ planId, cycle: "yearly" })), coupon: "LAUNCH20" });
  check("Full contract capacity is described once", (await customer.page.locator("main").innerText()).includes("including 60 purchased seats."));
  await capture(customer, "private-contract-checkout-en-light-1440");
  const paidResponse = customer.page.waitForResponse(response => new URL(response.url()).pathname === "/v1/app/checkout/confirm" && response.request().method() === "POST" && response.status() === 201);
  await customer.page.getByRole("button", { name: /^Pay / }).click();
  const paidBody = await (await paidResponse).json();
  await customer.page.getByRole("heading", { name: "Payment received", exact: true }).waitFor();
  await capture(customer, "private-contract-paid-en-light-1440");
  const contract = rows(await api("GET", "/v1/app/custom-plans?pageSize=100")).find(row => row.id === request.id), active = await api("GET", "/v1/app/subscriptions");
  check("Payment activates each contracted capacity", contract.lineIds.length === 3 && contract.privatePlanIds.every(id => active.lines.some(line => line.planId === id && line.state === "active" && line.snapshot.quantity === 60)));
  const first = await api("GET", "/v1/admin/invoices/" + paidBody.data.invoice.id);
  check("Custom contract invoice equals endpoint quote", first.total === firstQuote.total, { invoiceId: first.id, invoice: first.total, quote: firstQuote.total });
  const lowerRequest = await api("POST", "/v1/app/custom-plans", { tools: ["crm", "marketing", "chat"], seats: 60, cycle: "yearly", notes: "Finance clean carry " + RUN });
  await api("POST", "/v1/admin/custom-plans/" + lowerRequest.id + "/quote", { amount: 1, lines: [{ tool: "crm", amount: 0 }, { tool: "marketing", amount: 1 }, { tool: "chat", amount: 0 }] });
  const lower = await api("POST", "/v1/app/custom-plans/" + lowerRequest.id + "/accept", {}), lowBody = { items: lower.privatePlanIds.map(planId => ({ planId, cycle: "yearly" })), paymentMethodId };
  const lowQuote = await api("POST", "/v1/app/checkout/preview", lowBody), lowPaid = await api("POST", "/v1/app/checkout/confirm", lowBody, { "idempotency-key": "finance-low-" + RUN });
  check("Unused period credit carries forward", lowQuote.total === 0 && lowQuote.creditRemaining > 0 && lowPaid.invoice.total === 0, { invoiceId: lowPaid.invoice.id, credit: lowQuote.creditRemaining, total: lowPaid.invoice.total });
  const bundle = rows(await api("GET", "/v1/admin/bundles?pageSize=100")).find(row => row.active && row.planIds.includes("tasks_pro"));
  const ordinary = { items: bundle.planIds.map(planId => ({ planId, cycle: "yearly" })), coupon: "LAUNCH20", paymentMethodId }, ordinaryQuote = await api("POST", "/v1/app/checkout/preview", ordinary);
  check("Eligible discounts combine with workspace credit", ordinaryQuote.accountCreditUsed > 0 && ordinaryQuote.bundleDiscount > 0 && ordinaryQuote.couponDiscount > 0, { credit: ordinaryQuote.accountCreditUsed, bundle: ordinaryQuote.bundleDiscount, coupon: ordinaryQuote.couponDiscount });
  check("Lost-response basket has a nonzero payment", ordinaryQuote.total > 0, { total: ordinaryQuote.total });
  const basketQuery = new URLSearchParams({ cycle: "yearly" });
  for (const planId of bundle.planIds) basketQuery.append("plan", planId);
  await prepareCheckout(customer, "/checkout?" + basketQuery, "LAUNCH20");
  const attempts = []; let firstLost;
  await customer.page.route("**/v1/app/checkout/confirm", async route => {
    const request = route.request(), response = await route.fetch({ timeout: 30000 }), body = await response.json();
    attempts.push({ key: request.headers()["idempotency-key"], invoiceId: body.data?.invoice?.id, status: response.status() });
    if (attempts.length === 1) { firstLost = body.data; await route.abort("connectionfailed"); } else await route.fulfill({ response });
  });
  await customer.page.getByRole("button", { name: /^Pay / }).click();
  await customer.page.getByText(message("sos", "en", "tools", "Tools.checkout.notPaidTitle"), { exact: true }).waitFor();
  check("Lost response follows a successful server charge", firstLost?.invoice?.id && attempts[0].status === 201);
  await capture(customer, "ordinary-checkout-lost-response-en-light-1440");
  await customer.page.getByRole("button", { name: /^Pay / }).click();
  await customer.page.getByRole("heading", { name: "Payment received", exact: true }).waitFor();
  check("Retry preserves idempotency key and invoice", attempts.length === 2 && Boolean(attempts[0].key) && attempts[0].key === attempts[1].key && attempts[0].invoiceId === attempts[1].invoiceId, { attempts: attempts.length, sameKey: attempts[0].key === attempts[1].key, invoiceId: attempts[1].invoiceId });
  const retryInvoice = await api("GET", "/v1/admin/invoices/" + firstLost.invoice.id);
  check("Retry creates one successful payment", retryInvoice.payments.filter(payment => payment.status === "succeeded").length === 1);
  await customer.page.unroute("**/v1/app/checkout/confirm");
  await capture(customer, "ordinary-checkout-recovered-en-light-1440");
  const fixtureIds = [first.id, lowPaid.invoice.id, firstLost.invoice.id], invoices = [];
  for (let index = 0; index < fixtureIds.length; index++) invoices.push(await ledger(fixtureIds[index], "Invoice " + (index + 1)));
  const kinds = new Set(invoices.flatMap(invoice => invoice.lines.map(line => line.kind)));
  for (const kind of ["period_credit", "account_credit", "bundle_discount", "coupon_discount", "credit_carried"]) check("Actual ledger records " + kind, kinds.has(kind));
  report.fixtureInvoiceIds = fixtureIds;
  await customer.view.close(); await staff.view.close();
  await captureMatrix(fixtureIds, invoices);
}
async function captureMatrix(ids, invoices) {
  for (const locale of ["en", "ar"]) for (const theme of ["light", "dark"]) for (const width of [390, 1440]) for (const app of ["sos", "admin"]) {
    const ctx = await context(app, locale, theme, width);
    try {
      for (let index = 0; index < ids.length; index++) {
        await open(ctx, (app === "sos" ? "/billing/invoices/" : "/invoices/") + ids[index]);
        await ctx.page.getByRole("table").first().scrollIntoViewIfNeeded();
        for (const kind of new Set(invoices[index].lines.filter(line => line.kind && line.kind !== "charge").map(line => line.kind))) {
          const label = message(app, locale, "billing", app === "sos" ? "Billing.invoice.ledger." + kind : "Billing.detail.ledger." + kind);
          check(app + " " + locale + " " + theme + " " + width + " invoice " + (index + 1) + ": " + kind, Boolean(label) && await ctx.page.getByText(label, { exact: false }).first().isVisible());
        }
        await capture(ctx, app + "-invoice-" + (index + 1) + "-" + locale + "-" + theme + "-" + width);
      }
    } finally { await ctx.view.close(); }
  }
  const note = "Finance clean mobile allocation " + RUN;
  const request = await api("POST", "/v1/app/custom-plans", { tools: ["crm", "marketing", "chat"], seats: 60, cycle: "yearly", notes: note });
  const mobile = await context("admin", "ar", "dark", 390);
  try {
    await open(mobile, "/custom-plans");
    await mobile.page.getByRole("row").filter({ hasText: note }).getByRole("button").click();
    await mobile.page.getByRole("dialog").waitFor();
    await mobile.page.waitForFunction(() => [...document.querySelectorAll('[role="dialog"]')].some(dialog => dialog.querySelectorAll("input").length >= 4));
    check("Mobile Arabic allocation fields", await mobile.page.getByRole("dialog").locator("input").count() >= 4, { requestId: request.id });
    await capture(mobile, "allocation-dialog-ar-dark-390");
  } finally { await mobile.view.close(); }
  const preview = await context("admin");
  try {
    const kwd = rows(await api("GET", "/v1/admin/invoices?currency=KWD&pageSize=100")).find(invoice => invoice.currency === "KWD");
    check("Seeded KWD invoice exists", Boolean(kwd));
    await open(preview, "/invoices/" + kwd.id);
    const text = await preview.page.locator("main").innerText();
    check("KWD total uses three decimals", text.includes(kwd.total.toFixed(3)) && text.includes("KWD"), { invoiceId: kwd.id, total: kwd.total });
    check("KWD zero stays 0.000", await preview.page.getByText(/KWD\s+0\.000/).count() > 0);
    await capture(preview, "kwd-invoice-three-decimals-en-light-1440");
    await open(preview, "/pricing/preview?plan=hr_pro");
    check("Regional tax preview distinguishes Saudi and German policy", await preview.page.getByText("Prices include 15% tax.", { exact: false }).count() > 0 && await preview.page.getByText("Prices exclude 19% tax.", { exact: false }).count() > 0);
    await capture(preview, "regional-tax-preview-en-light-1440");
  } finally { await preview.view.close(); }
}
run().catch(error => { report.ok = false; report.error = redact(error.stack || error.message); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, "finance-qa.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ runId: RUN, ok: report.ok, checks: checks.length, captures: captures.length, failures: checks.filter(check => !check.ok).map(check => check.name), error: report.error, output: OUT }, null, 2));
});
