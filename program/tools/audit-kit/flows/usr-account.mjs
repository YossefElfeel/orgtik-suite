// USR: team, services, support, notifications and workspace settings (spec 05 USR-13/14, 16–24,
// 26/27), walked in SOS's customer dashboard. Names and expected messages come from SOS's own
// catalogs (messages/<locale>.json + messages/usr/<locale>/*.json), so the same walk runs in every
// language. OrgTik's staff steps (quote, deliver) go through the admin API as Sherif (u15).
//
//   node flows/usr-account.mjs [--locale ar] [--only U2]   (SOS on :3013 and the local-dev mock running)
//
// Writes audits/usr/flows[/<locale>]/<walk>/NN-<step>.png and usr-account.json (the other USR
// flows write their own json next to it).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, AUDIT_TZ, WORKSPACE, redact, webUrl, apiUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { signIn, tokenFor } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const LOCALE = arg("--locale", "en");
const only = arg("--only", null);
const SOS_DIR = path.join(WORKSPACE, "somion-sos-frontend-main", "messages");
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const CATALOG = Object.assign(
  {},
  read(path.join(SOS_DIR, `${LOCALE}.json`)),
  ...fs.readdirSync(path.join(SOS_DIR, "usr", LOCALE)).map((f) => read(path.join(SOS_DIR, "usr", LOCALE, f))),
);
const m = (key, values = {}) => {
  const text = key.split(".").reduce((o, k) => (o == null ? o : o[k]), CATALOG);
  if (typeof text !== "string") throw new Error(`no message ${key} in ${LOCALE}`);
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in values ? String(values[k]) : `{${k}}`));
};
// The first sentence-ish part of a message, for "the page says this" checks that ignore the rest.
const head = (s, n = 24) => s.slice(0, n);
const OUT = path.join(AUDITS, "usr", "flows", ...(LOCALE === "en" ? [] : [LOCALE]));
const SOS = webUrl("sos");
const PLATFORM = `${apiUrl("admin")}/v1`;
const MONA = "mona.adel@orgtik.test";
const KARIM = "karim.hassan@orgtik.test";
const SALMA = "salma.nabil@orgtik.test"; // `employee`: a member of OrgTik Egypt
const SHERIF = "sherif.magdy@orgtik.test"; // u15, OrgTik's service manager
const unlock = await mock.lock(`usr-account-flows (USR team/services/support/account)`);
const browser = await chromium.launch();
const walks = [];

async function api(method, url, email, body) {
  const token = await tokenFor(email);
  const res = await fetch(PLATFORM + url, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ...json };
}
const staff = (id, body) => api("POST", `/admin/service-requests/${id}/actions`, SHERIF, body);

async function walk(id, title, as, fn) {
  if (only && !id.startsWith(only)) return;
  await mock.reset();
  const dir = path.join(OUT, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: AUDIT_TZ, locale: LOCALE });
  await ctx.addCookies([{ name: "NEXT_LOCALE", value: LOCALE, url: SOS }]);
  await signIn(ctx, "sos", as);
  const page = await ctx.newPage();
  const log = watch(page);
  const steps = [];
  let n = 0;
  const step = async (name, action, check) => {
    n++;
    const started = Date.now();
    let ok = true;
    let note = "";
    try {
      await action();
      await page.waitForTimeout(500);
      if (check) {
        const r = await check();
        ok = r === true || (typeof r === "object" && r !== null && r.ok !== false);
        note = typeof r === "object" && r ? r.note || "" : r === true ? "" : String(r);
      }
    } catch (e) {
      ok = false;
      note = String(e.message).split("\n")[0];
    }
    const shot = `${String(n).padStart(2, "0")}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}.png`;
    await page.screenshot({ path: path.join(dir, shot) }).catch(() => {});
    steps.push({ n, name, ok, note, ms: Date.now() - started, url: redact(page.url()), screenshot: `${id}/${shot}` });
    console.log(`  ${ok ? "ok  " : "FAIL"} ${n}. ${name}${note ? ` (${note})` : ""}`);
    return ok;
  };
  console.log(`\n${id}: ${title} (as ${as})`);
  try {
    await fn({ page, ctx, step });
  } finally {
    walks.push({ id, title, as, locale: LOCALE, steps, console: log.console.slice(0, 10), api: log.api.map((a) => ({ ...a, url: redact(a.url) })).slice(0, 10) });
    await ctx.close();
  }
}

const open = async (page, route) => {
  // A client navigation still settling can abort a goto (net::ERR_ABORTED): try once more.
  await page.goto(SOS + route, { waitUntil: "load" }).catch(async (e) => {
    if (!/ERR_ABORTED/.test(e.message)) throw e;
    await page.waitForTimeout(500);
    await page.goto(SOS + route, { waitUntil: "load" });
  });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"), null, { timeout: 20000 }).catch(() => {});
  await settle(page);
};
const toast = (page) => page.locator("[data-orgtik-toast]").first().innerText({ timeout: 6000 }).catch(() => "");
const main = (page) => page.locator("main").first();
const h1 = (page) => main(page).getByRole("heading", { level: 1 }).first().innerText({ timeout: 8000 }).catch(() => "");
const visible = (loc) => loc.first().waitFor({ state: "visible", timeout: 8000 }).then(() => true, () => false);
const unreadCount = async (page) => {
  const link = page.getByRole("link", { name: new RegExp(m("Workspace.nav.notifications")) }).first();
  const text = (await link.innerText().catch(() => "")).replace(m("Workspace.nav.notifications"), "").trim();
  return text ? Number(text) : 0;
};

// U1: Karim (admin) invites a member, sees what the seat costs before sending, and can't make an admin.
await walk("U1-invite", "Invite with the seat cost; admins can't make admins", KARIM, async ({ page, step }) => {
  const email = "nadia.new@orgtik.test";
  let seats = 0;
  await step("Open Team", () => open(page, "/team"), async () => {
    const t = await h1(page);
    seats = Number((await main(page).locator("dd").first().innerText()).replace(/\D/g, ""));
    return { ok: t === m("Team.title") && seats > 0, note: `${t}; ${seats} paid seats` };
  });
  await step("Open the invitation; Admin is the owner's", async () => {
    await page.getByRole("button", { name: m("Team.invite.open") }).click();
    await page.getByRole("dialog").waitFor({ timeout: 5000 });
  }, async () => {
    const dialog = page.getByRole("dialog");
    const admin = dialog.getByRole("radio", { name: new RegExp(m("Workspace.roles.admin")) });
    const disabled = await admin.isDisabled().catch(async () => (await admin.getAttribute("aria-disabled")) === "true" || (await admin.getAttribute("data-disabled")) !== null);
    const said = await visible(dialog.getByText(m("Team.invite.adminOwnerOnly")));
    return { ok: disabled && said, note: `admin option disabled: ${disabled}; says "${m("Team.invite.adminOwnerOnly")}"` };
  });
  await step("The API refuses an admin invite from an admin (422 owner_only)", () => Promise.resolve(), async () => {
    const r = await api("POST", "/app/team/invite", KARIM, { email: "would.be.admin@orgtik.test", role: "admin", tools: null });
    return { ok: r.status === 422 && r.error?.fieldErrors?.role === "owner_only", note: `${r.status} ${r.error?.fieldErrors?.role ?? ""}` };
  });
  await step("Fill email; the seat cost shows before sending", async () => {
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(m("Team.invite.email"), { exact: false }).fill(email);
  }, async () => {
    const dialog = page.getByRole("dialog");
    const cost = m("Team.cost.title", { before: seats, after: seats + 1 });
    const shown = await visible(dialog.getByText(cost));
    const total = await visible(dialog.getByText(m("Team.cost.total")));
    return { ok: shown && total, note: cost };
  });
  await step("A guest is free", async () => {
    await page.getByRole("dialog").getByRole("radio", { name: new RegExp(m("Workspace.roles.guest")) }).click();
  }, async () => ({ ok: await visible(page.getByRole("dialog").getByText(m("Team.cost.guestBody"))), note: m("Team.cost.guestBody") }));
  let said = "";
  await step("Send as a member", async () => {
    await page.getByRole("dialog").getByRole("radio", { name: new RegExp(m("Workspace.roles.member")) }).click();
    await page.getByRole("dialog").getByRole("button", { name: m("Team.invite.send") }).click();
    said = await toast(page);
    await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 8000 });
  }, async () => {
    const row = await visible(main(page).getByText(email));
    return { ok: row && said.includes(head(m("Team.invite.sent", { email }))), note: `toast: ${said.replace(/\n/g, " ")}` };
  });
});

// U2: Mona requests a service (a short brief is refused on the field), OrgTik quotes, Mona reads the
// quote, accepts, a failed payment is said with the way forward, she pays; OrgTik delivers, she approves.
await walk("U2-service", "Request, quote, accept, pay, approve the delivery", MONA, async ({ page, step }) => {
  let id = "";
  let number = "";
  await step("Open Services and request Brand identity", async () => {
    await open(page, "/services");
    await main(page).getByRole("link", { name: new RegExp(`^${m("Services.catalog.request")}`) }).first().click();
    await page.waitForURL(/\/services\/new\?service=/, { timeout: 15000 });
    await settle(page);
  }, async () => ({ ok: (await h1(page)) === m("Services.new.title"), note: new URL(page.url()).search }));
  await step("A brief under 20 characters is refused on the field", async () => {
    await main(page).getByLabel(m("Services.new.requestTitle"), { exact: false }).fill("Refresh our brand");
    await main(page).getByLabel(m("Services.new.brief"), { exact: false }).fill("New logo");
    await main(page).getByRole("button", { name: m("Services.new.submit") }).click();
  }, async () => {
    const said = m("Services.new.errors.briefShort", { min: 20 });
    return { ok: (await visible(main(page).getByText(said))) && /\/services\/new/.test(page.url()), note: said };
  });
  await step("Send with a full brief", async () => {
    await main(page).getByLabel(m("Services.new.brief"), { exact: false }).fill("A new logo, colours and a short brand book for our Cairo and Riyadh offices.");
    await main(page).getByRole("button", { name: m("Services.new.submit") }).click();
    await page.waitForURL(/\/services\/requests\/[^/?]+$/, { timeout: 15000 });
    await settle(page);
  }, async () => {
    id = decodeURIComponent(new URL(page.url()).pathname.split("/").pop());
    number = await main(page).locator("nav [dir=ltr]").first().innerText().catch(() => "");
    return { ok: (await h1(page)) === "Refresh our brand", note: `${number} (${id}); toast: ${(await toast(page)).replace(/\n/g, " ")}` };
  });
  await step("OrgTik reviews and quotes (staff, admin API)", async () => {
    await staff(id, { action: "review" });
    const q = await staff(id, { action: "quote", lines: [{ label: "Brand identity package", amount: 39000 }, { label: "Subscriber discount 10%", amount: -3900 }], validDays: 14 });
    if (q.status !== 200) throw new Error(`quote ${q.status} ${q.error?.code}`);
    await open(page, `/services/requests/${encodeURIComponent(id)}`);
  }, async () => {
    const valid = await visible(main(page).getByText(new RegExp(m("Services.detail.validUntil", { date: "" }).trim())));
    const discount = await visible(main(page).getByText("Subscriber discount 10%"));
    return { ok: valid && discount, note: "quote lines, the subscriber discount line and its validity shown" };
  });
  await step("Accept the quote", async () => {
    await main(page).getByRole("button", { name: m("Services.detail.accept") }).click();
    const confirm = page.getByRole("alertdialog");
    await confirm.waitFor({ timeout: 5000 });
    await confirm.getByRole("button", { name: m("Services.detail.accept") }).click();
    await confirm.waitFor({ state: "hidden", timeout: 8000 });
  }, async () => ({ ok: await visible(main(page).getByRole("button", { name: m("Services.detail.payAmount") })), note: m("Services.detail.toPayTitle") }));
  await step("A declined payment is said, with the way to the cards (402)", async () => {
    const r = await mock.control("admin", "/v1/__mock/fail-next-payment", { body: { count: 1 } });
    if (!r.ok) throw new Error(`fail-next-payment ${r.status}`);
    await main(page).getByRole("button", { name: m("Services.detail.payAmount") }).click();
    const confirm = page.getByRole("alertdialog");
    await confirm.waitFor({ timeout: 5000 });
    await confirm.getByRole("button", { name: m("Services.detail.pay"), exact: true }).click();
    await confirm.waitFor({ state: "hidden", timeout: 8000 });
  }, async () => {
    const said = await visible(main(page).getByText(m("Services.detail.errors.paymentFailed")));
    const link = await visible(main(page).getByRole("link", { name: m("Services.detail.toPaymentMethods") }));
    return { ok: said && link, note: m("Services.detail.errors.paymentFailed") };
  });
  await step("Pay again", async () => {
    await main(page).getByRole("button", { name: m("Services.detail.payAmount") }).click();
    const confirm = page.getByRole("alertdialog");
    await confirm.waitFor({ timeout: 5000 });
    await confirm.getByRole("button", { name: m("Services.detail.pay"), exact: true }).click();
    await confirm.waitFor({ state: "hidden", timeout: 8000 });
  }, async () => ({ ok: await visible(main(page).getByText(m("Services.detail.quotePaid"), { exact: true })), note: `toast: ${(await toast(page)).replace(/\n/g, " ")}` }));
  await step("OrgTik delivers (staff); the auto-approve date shows", async () => {
    const d = await staff(id, { action: "deliver", note: "Logo, colours and the brand book.", files: ["brand-book.pdf"] });
    if (d.status !== 200) throw new Error(`deliver ${d.status} ${d.error?.code}`);
    await open(page, `/services/requests/${encodeURIComponent(id)}`);
  }, async () => ({ ok: await visible(main(page).getByText(new RegExp(head(m("Services.detail.autoApprove", { date: "" }), 16)))), note: "auto-approve date (G-30) shown" }));
  await step("Approve the delivery", async () => {
    await main(page).getByRole("button", { name: m("Services.detail.approve") }).click();
    const confirm = page.getByRole("alertdialog");
    await confirm.waitFor({ timeout: 5000 });
    await confirm.getByRole("button", { name: m("Services.detail.approve") }).click();
    await confirm.waitFor({ state: "hidden", timeout: 8000 });
  }, async () => {
    const done = await visible(main(page).getByText(new RegExp(head(m("Services.detail.completedOn", { date: "" }), 10))));
    return { ok: done, note: `toast: ${(await toast(page)).replace(/\n/g, " ")}` };
  });
  await step("The request lists as completed", () => open(page, "/services/requests"), async () => ({ ok: await visible(main(page).getByRole("link", { name: number })), note: number }));
});

// U3: Mona opens a ticket and replies to it.
await walk("U3-support", "Open a ticket and reply", MONA, async ({ page, step }) => {
  const subject = "Invoice shows the old address";
  await step("Open a new ticket", async () => {
    await open(page, "/support/new");
    await main(page).getByLabel(m("Support.new.subject"), { exact: false }).fill(subject);
    await main(page).getByRole("combobox").first().click();
    await page.getByRole("option", { name: m("Support.categories.billing"), exact: true }).click();
    await main(page).getByLabel(m("Support.new.message"), { exact: false }).fill("Our address changed in September; the October invoice still has the old one.");
    await main(page).getByRole("button", { name: m("Support.new.submit") }).click();
    await page.waitForURL(/\/support\/(?!new$)[^/]+$/, { timeout: 15000 });
    await settle(page);
  }, async () => ({ ok: (await h1(page)) === subject, note: `toast: ${(await toast(page)).replace(/\n/g, " ")}` }));
  await step("Reply", async () => {
    await main(page).getByLabel(m("Support.detail.replyLabel"), { exact: false }).fill("The new address is in Billing details now.");
    await main(page).getByRole("button", { name: m("Support.detail.reply") }).click();
  }, async () => ({ ok: await visible(main(page).getByText("The new address is in Billing details now.")), note: `toast: ${(await toast(page)).replace(/\n/g, " ")}` }));
  await step("Mark resolved, then a reply reopens it", async () => {
    await main(page).getByRole("button", { name: m("Support.detail.resolve") }).click();
    const confirm = page.getByRole("alertdialog");
    await confirm.waitFor({ timeout: 5000 });
    await confirm.getByRole("button", { name: m("Support.detail.resolve") }).click();
    await confirm.waitFor({ state: "hidden", timeout: 8000 });
    await main(page).getByLabel(m("Support.detail.replyLabel"), { exact: false }).fill("Actually, one more thing.");
    await main(page).getByRole("button", { name: m("Support.detail.reply") }).click();
  }, async () => {
    const said = await toast(page);
    return { ok: said.includes(head(m("Support.detail.reopened"))) && (await visible(main(page).getByRole("button", { name: m("Support.detail.resolve") }))), note: `toast: ${said.replace(/\n/g, " ")}` };
  });
  await step("A closed ticket says to open a new one", async () => {
    await open(page, "/support");
    const closed = main(page).getByRole("row").filter({ hasText: "Dark mode in Files" }).getByRole("link");
    await closed.click();
    await page.waitForURL(/\/support\/[^/]+$/, { timeout: 10000 });
    await settle(page);
  }, async () => ({ ok: (await visible(main(page).getByText(m("Support.detail.closedTitle")))) && (await visible(main(page).getByRole("link", { name: m("Support.detail.openNew") }))), note: m("Support.detail.closedTitle") }));
});

// U4: Mona marks her notifications read; the sidebar's count drops.
await walk("U4-notifications", "Mark notifications read; the sidebar count drops", MONA, async ({ page, step }) => {
  let before = 0;
  await step("Open Notifications", () => open(page, "/notifications"), async () => {
    before = await unreadCount(page);
    return { ok: before > 0, note: `sidebar count ${before}` };
  });
  await step("Mark all as read", async () => {
    await main(page).getByRole("button", { name: m("Account.notifications.markAll") }).click();
    await page.waitForTimeout(1200);
  }, async () => {
    const after = await unreadCount(page);
    return { ok: after === 0 && (await visible(main(page).getByText(m("Account.notifications.allRead")))), note: `sidebar count ${before} → ${after}` };
  });
});

// U5: Mona renames the workspace; deleting it is refused while an invoice is open, and says why.
await walk("U5-workspace", "Rename; delete blocked by an open invoice", MONA, async ({ page, step }) => {
  const name = "OrgTik Egypt HQ";
  await step("Rename the workspace", async () => {
    await open(page, "/workspace");
    await main(page).getByLabel(m("Account.workspace.name"), { exact: false }).fill(name);
    await main(page).getByRole("button", { name: m("Account.workspace.save") }).click();
    await page.waitForTimeout(1200);
  }, async () => {
    const said = await toast(page);
    const top = await page.locator("header").first().innerText().catch(() => "");
    return { ok: said.includes(head(m("Account.workspace.renamed", { name }))) && top.includes(name), note: `switcher shows ${name}` };
  });
  await step("Delete asks for the exact name", async () => {
    await main(page).getByRole("button", { name: m("Account.workspace.delete") }).click();
    await page.getByRole("alertdialog").waitFor({ timeout: 5000 });
    await page.getByRole("alertdialog").getByRole("textbox").fill(name.slice(0, -1));
  }, async () => {
    const btn = page.getByRole("alertdialog").getByRole("button", { name: m("Account.workspace.delete") });
    return { ok: await btn.isDisabled(), note: "confirm stays off until the name matches" };
  });
  await step("Type the name; the open invoice blocks it, with the reason", async () => {
    const confirm = page.getByRole("alertdialog");
    await confirm.getByRole("textbox").fill(name);
    await confirm.getByRole("button", { name: m("Account.workspace.delete") }).click();
    await confirm.waitFor({ state: "hidden", timeout: 8000 });
  }, async () => {
    const said = m("Account.workspace.unpaidBody", { name });
    return { ok: (await visible(main(page).getByText(said))) && (await visible(main(page).getByRole("link", { name: m("Account.workspace.toInvoices") }))), note: said };
  });
});

// U6: Salma, a member: the team is read-only and there's no way to request a service.
await walk("U6-member", "A member reads the team; no request button", SALMA, async ({ page, step }) => {
  await step("Team is read-only", () => open(page, "/team"), async () => {
    const invite = await page.getByRole("button", { name: m("Team.invite.open") }).count();
    const menus = await main(page).getByRole("button", { name: new RegExp(head(m("Team.actionsFor", { name: "" }), 8)) }).count();
    const said = await visible(main(page).getByText(new RegExp(head(m("Team.readOnly", { name: "OrgTik Egypt" }), 20))));
    return { ok: invite === 0 && menus === 0 && said, note: `invite buttons ${invite}, row menus ${menus}` };
  });
  await step("Services has no request button", () => open(page, "/services"), async () => {
    const links = await main(page).getByRole("link", { name: new RegExp(`^${m("Services.catalog.request")}`) }).count();
    return { ok: links === 0 && (await visible(main(page).getByText(m("Services.catalog.memberNote")))), note: `request links ${links}` };
  });
  await step("Requesting directly says it's not for members", () => open(page, "/services/new?service=svc_brand"), async () => {
    const t = await h1(page);
    const form = await main(page).getByRole("button", { name: m("Services.new.submit") }).count();
    return { ok: form === 0 && t === m("Workspace.gate.title", { role: m("Workspace.roles.admin") }), note: `no form; ${t}` };
  });
});

await browser.close();
await mock.reset();
unlock();
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "usr-account.json"), JSON.stringify({ at: new Date().toISOString(), locale: LOCALE, walks }, null, 2));
const all = walks.flatMap((w) => w.steps);
console.log(`\n${all.filter((s) => s.ok).length} of ${all.length} steps passed (${LOCALE}) · written ${path.relative(AUDITS, path.join(OUT, "usr-account.json"))}`);
