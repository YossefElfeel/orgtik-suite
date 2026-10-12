// Chats (HQ): the wave's golden flows (audits/chats/wave-plan.md), walked in the browser as Mona,
// opened from SOS like a person would. Names and expected messages come from Chats' own catalog,
// so the same walk runs in every language. Quiet mode (?__quiet=1) holds the simulator still.
//
//   node flows/chats.mjs [--locale ar] [--only C3]   (SOS, Chats and the local-dev mock running)
//
// Writes audits/chats/flows[/<locale>]/<flow>/NN-<step>.png and walks.json.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { AUDITS, AUDIT_TZ, SOS_API, WORKSPACE, redact, webUrl } from "../lib/suite.mjs";
import { signIn, tokenFor } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const LOCALE = arg("--locale", "en");
const only = arg("--only", null);
const HQ_DIR = path.join(WORKSPACE, "somion-hq");
const { formatMessage } = await import(pathToFileURL(path.join(HQ_DIR, "lib", "messages.ts")).href);
const CATALOG = JSON.parse(fs.readFileSync(path.join(HQ_DIR, "messages", `${LOCALE}.json`), "utf8"));
/** A message from Chats' catalog, filled as the app fills it (plurals included). */
const m = (key, values) => {
  const text = CATALOG[key];
  if (typeof text !== "string") throw new Error(`no message ${key} in ${LOCALE}`);
  return formatMessage(text, values, LOCALE);
};
const OUT = path.join(AUDITS, "chats", "flows", ...(LOCALE === "en" ? [] : [LOCALE]));
const SOS = webUrl("sos");
const HQ = webUrl("chats");
const AS = "mona.adel@orgtik.test";
const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const walks = [];

/** A browser signed in to SOS, with Chats opened once from SOS (the session it hands over). */
async function newContext() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: AUDIT_TZ, locale: LOCALE, permissions: ["clipboard-read", "clipboard-write"] });
  await ctx.addCookies([{ name: "NEXT_LOCALE", value: LOCALE, url: SOS }, { name: "NEXT_LOCALE", value: LOCALE, url: HQ }]);
  await signIn(ctx, "sos", AS);
  return ctx;
}

async function intoChats(page) {
  await page.goto(`${SOS}/go/hq`, { waitUntil: "load" });
  await page.waitForURL((u) => u.origin === HQ && u.pathname.startsWith("/hq/"), { timeout: 60000 });
  await open(page, "/hq/office");
}

async function walk(id, title, fn, { enter = true } = {}) {
  if (only && !id.startsWith(only)) return;
  const dir = path.join(OUT, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await newContext();
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
  console.log(`\n${id}: ${title}`);
  try {
    if (enter) await intoChats(page);
    await fn({ page, ctx, step });
  } finally {
    walks.push({ id, title, locale: LOCALE, steps, console: log.console.slice(0, 10), api: log.api.map((a) => ({ ...a, url: redact(a.url) })).slice(0, 10) });
    await ctx.close();
  }
}

const open = async (page, route) => {
  await page.goto(`${HQ}${route}${route.includes("?") ? "&" : "?"}__quiet=1`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await settle(page);
};
const toastText = (page) => page.locator(".hq-rise").filter({ has: page.locator("p") }).last().innerText({ timeout: 5000 }).catch(() => "");

// C0: open Chats from SOS like a person would; no token in any address; the person is Mona.
await walk("C0-from-suite", "Open Chats from the suite", async ({ page, step }) => {
  const seen = [];
  page.on("framenavigated", (f) => f === page.mainFrame() && seen.push(f.url()));
  await step("Open Chats from SOS (/go/hq)", async () => {
    await page.goto(`${SOS}/go/hq`, { waitUntil: "load" });
    await page.waitForURL((u) => u.origin === HQ && u.pathname.startsWith("/hq/"), { timeout: 60000 });
    await settle(page);
  }, async () => {
    const leaked = seen.some((u) => /[?&](token|accessToken)=/.test(u));
    const coded = seen.some((u) => /\/auth\?code=/.test(u));
    return { ok: !leaked && coded, note: leaked ? "a token was in an address" : `via a one-time code, ${seen.length} addresses, none with a token` };
  });
  await step("Mona is the person in Chats", async () => {}, async () => {
    const me = await page.getByRole("button", { name: /Mona Adel/ }).first().isVisible().catch(() => false);
    return { ok: me, note: me ? "account menu: Mona Adel" : "Mona not shown" };
  });
  await step("The page is in the reader's language", async () => {}, async () => {
    const { lang, dir } = await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir }));
    return { ok: lang === LOCALE && dir === (LOCALE === "ar" ? "rtl" : "ltr"), note: `lang ${lang}, dir ${dir}` };
  });
}, { enter: false });

// C1: a message with a file arrives with the file (CHT-001).
await walk("C1-file", "Send a message with a file", async ({ page, step }) => {
  const text = `Walk ${Date.now().toString(36)}`;
  await step("Open #design", () => open(page, "/hq/chat/c-design"), async () => page.getByRole("log").isVisible());
  await step("Attach Q3-forecast.xlsx from Files", async () => {
    await page.getByRole("button", { name: m("chat.attach") }).click();
    await page.getByRole("button", { name: /Q3-forecast\.xlsx/ }).click();
  }, async () => page.getByText("Q3-forecast.xlsx").first().isVisible());
  await step("Write and send", async () => {
    const box = page.getByRole("combobox", { name: m("chat.messageChannel", { name: "design" }) });
    await box.fill(text);
    await box.press("Enter");
  }, async () => {
    const log = page.getByRole("log");
    const msg = log.locator(".hq-msg").filter({ hasText: text }).last();
    const has = await msg.getByText("Q3-forecast.xlsx").isVisible().catch(() => false);
    return { ok: has, note: has ? "the message carries the file" : "no file on the message" };
  });
});

// C2: the same people again open the same group (CHT-034).
await walk("C2-group", "Start a group, then again with the same people", async ({ page, step }) => {
  const startGroup = async () => {
    await open(page, "/hq/chat/c-general");
    await page.getByRole("button", { name: m("chat.newMessage") }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /Sara Lindqvist/ }).click();
    await dialog.getByRole("button", { name: /Lena Brunner/ }).click();
    await dialog.getByRole("button", { name: m("chat.startGroup") }).click();
    await page.waitForURL((u) => /\/hq\/chat\/grp-/.test(u.pathname), { timeout: 10000 });
    return new URL(page.url()).pathname;
  };
  let first = "";
  await step("Start a group with Sara and Lena", async () => {
    first = await startGroup();
  }, async () => ({ ok: Boolean(first), note: first }));
  let second = "";
  await step("Again with the same two", async () => {
    second = await startGroup();
  }, async () => ({ ok: second === first, note: second === first ? "the same group opens" : `a second group: ${second}` }));
});

// C3: Meet now; a guest joins by the link's secret; Reset link refuses the old one (CHT-005).
let link = "";
await walk("C3-guest", "Meet now and a guest", async ({ page, ctx, step }) => {
  await step("Meet now", async () => {
    await open(page, "/hq/meetings");
    await page.getByRole("button", { name: m("meetings.meetNow") }).first().click();
    await page.waitForURL((u) => /\/hq\/meetings\/[^/]+\/call/.test(u.pathname), { timeout: 15000 });
    await page.getByRole("button", { name: m("call.joinNow") }).click();
  }, async () => page.getByRole("button", { name: m("call.leave") }).isVisible());
  await step("The link carries a secret, not the meeting id", async () => {
    link = await page.getByRole("textbox", { name: m("meetings.meetingLink") }).inputValue({ timeout: 10000 });
  }, async () => {
    const meetingId = new URL(page.url()).pathname.split("/")[3];
    const key = link.split("/guest/")[1] ?? "";
    return { ok: key.length >= 24 && !key.includes(meetingId), note: `/guest/${key.slice(0, 6)}… (${key.length} characters)` };
  });
  const guest = await ctx.newPage();
  await step("A guest joins by the link", async () => {
    await guest.goto(link, { waitUntil: "load" });
    await guest.getByRole("textbox", { name: m("prejoin.yourName") }).fill("Walk Guest");
    await guest.getByRole("button", { name: m("guest.ask") }).click();
    await guest.waitForTimeout(1500);
  }, async () => {
    const inOrWaiting = (await guest.getByText(m("guest.admittedTitle")).isVisible().catch(() => false)) || (await guest.getByText(m("guest.lobbyTitle")).isVisible().catch(() => false));
    return { ok: inOrWaiting, note: inOrWaiting ? "the guest is in, or waiting for the host" : "the guest got nowhere" };
  });
  await step("Reset the link (confirmed)", async () => {
    await page.getByRole("button", { name: m("meetings.resetLink") }).first().click();
    await page.getByRole("alertdialog").getByRole("button", { name: m("meetings.resetConfirm") }).click();
    await page.waitForTimeout(800);
  }, async () => {
    const next = await page.getByRole("textbox", { name: m("meetings.meetingLink") }).inputValue();
    return { ok: next !== link && next.includes("/guest/"), note: "a new secret" };
  });
  const late = await ctx.newPage();
  await step("The old link no longer works", async () => {
    await late.goto(link, { waitUntil: "load" });
    await late.waitForTimeout(2500);
  }, async () => {
    const refused = await late.getByText(m("guest.expiredTitle")).isVisible().catch(() => false);
    return { ok: refused, note: refused ? m("guest.expiredTitle") : "the old link still opens the meeting" };
  });
});

// C4: Leave keeps the meeting going; End for everyone is confirmed (CHT-002). The workspace lives in
// the page (the mock), so the walk stays in the app instead of reloading.
await walk("C4-leave-end", "Leave, or end for everyone", async ({ page, step }) => {
  await step("Meet now and join", async () => {
    await open(page, "/hq/meetings");
    await page.getByRole("button", { name: m("meetings.meetNow") }).first().click();
    await page.waitForURL((u) => /\/call$/.test(u.pathname), { timeout: 15000 });
    await page.getByRole("button", { name: m("call.joinNow") }).click();
  }, async () => page.getByRole("button", { name: m("call.leave") }).isVisible());
  await step("Leave: the meeting is still on", async () => {
    await page.getByRole("button", { name: m("call.leave") }).click();
    await page.waitForURL((u) => /\/hq\/meetings\/[^/]+$/.test(u.pathname), { timeout: 10000 });
    await settle(page);
  }, async () => {
    const stillOn = await page.getByRole("link", { name: m("meetings.joinNow") }).or(page.getByRole("button", { name: m("meetings.joinNow") })).first().isVisible().catch(() => false);
    return { ok: stillOn, note: stillOn ? "Join meeting is still offered" : "the meeting ended" };
  });
  await step("End for everyone (confirmed)", async () => {
    await page.getByRole("link", { name: m("meetings.joinNow") }).or(page.getByRole("button", { name: m("meetings.joinNow") })).first().click();
    await page.getByRole("button", { name: m("call.joinNow") }).click();
    await page.getByRole("button", { name: m("call.endForAll") }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: m("call.endConfirm") }).click();
    await page.waitForURL((u) => /\/hq\/meetings\/[^/]+$/.test(u.pathname), { timeout: 10000 });
    await settle(page);
  }, async () => {
    const joinable = await page.getByRole("link", { name: m("meetings.joinNow") }).or(page.getByRole("button", { name: m("meetings.joinNow") })).first().isVisible().catch(() => false);
    return { ok: !joinable, note: joinable ? "still joinable" : "ended: no way to join" };
  });
});

// C5: status Focus with a note; the button says it.
await walk("C5-status", "Set your status", async ({ page, step }) => {
  await step("Open Set your status", async () => {
    await page.getByRole("button", { name: m("status.button", { status: m("status.available") }) }).click();
  }, async () => page.getByRole("dialog", { name: m("status.dialog") }).isVisible());
  await step("Focus for 25 minutes", async () => {
    await page.getByRole("dialog").getByRole("button", { name: m("status.focus.minutes", { n: 25 }) }).click();
    await page.waitForTimeout(600);
  }, async () => {
    const named = await page.getByRole("button", { name: m("status.button", { status: m("status.focus") }) }).isVisible().catch(() => false);
    return { ok: named, note: named ? m("status.button", { status: m("status.focus") }) : "status not shown" };
  });
});

// C6: search at 1440 and at 390: the page has its own field; Back goes to Chat (CHT-004, CHT-040).
await walk("C6-search", "Search, on a desk and on a phone", async ({ page, step }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 860 });
    await step(`Search "invoice" at ${width}`, async () => {
      await open(page, "/hq/chat/search");
      const field = page.getByRole("searchbox", { name: m("search.field") });
      await field.fill("invoice");
      await field.press("Enter");
      await page.waitForURL((u) => u.searchParams.get("q") === "invoice", { timeout: 8000 });
    }, async () => {
      const results = await page.getByText(/invoice/i).count();
      return { ok: results > 1, note: `${results} matches on the page` };
    });
    await step(`Back goes to Chat at ${width}`, async () => {
      await page.getByRole("button", { name: m("search.backToChat") }).click();
      await page.waitForURL((u) => u.pathname.startsWith("/hq/chat") && !u.pathname.includes("search"), { timeout: 8000 });
    }, async () => ({ ok: new URL(page.url()).origin === HQ, note: new URL(page.url()).pathname }));
  }
});

// C7: View as Aya from SOS's API, open Chats with that session: read-only, said in the reader's
// language; Stop viewing comes back as Mona (D-017).
await walk("C7-view-as", "View as someone in Chats", async ({ page, step }) => {
  const admin = await tokenFor(AS);
  const users = await (await fetch(`${SOS_API}/users?search=aya`, { headers: { Authorization: `Bearer ${admin}` } })).json();
  const aya = (users.data?.items ?? users.data)[0];
  const ro = (await (await fetch(`${SOS_API}/auth/login-as/${aya.id}`, { method: "POST", headers: { Authorization: `Bearer ${admin}` } })).json()).data.tokens.accessToken;
  const code = (await (await fetch(`${SOS_API}/auth/handoff`, { method: "POST", headers: { Authorization: `Bearer ${ro}` } })).json()).data.code;
  await step("Open Chats with the viewing session", async () => {
    await page.goto(`${HQ}/${LOCALE}/auth?code=${code}&redirect=/hq/chat/c-design`, { waitUntil: "load" });
    await page.waitForURL((u) => u.pathname === "/hq/chat/c-design", { timeout: 30000 });
    await settle(page);
  }, async () => {
    const banner = await page.getByText(m("suite.viewingAs", { name: "Aya Hamed" })).isVisible().catch(() => false);
    return { ok: banner, note: banner ? m("suite.viewingAs", { name: "Aya Hamed" }) : "no banner" };
  });
  await step("Sending is refused, with the reason", async () => {
    const box = page.getByRole("combobox", { name: m("chat.messageChannel", { name: "design" }) });
    await box.fill("Should not send");
    await box.press("Enter");
  }, async () => {
    const said = await page.getByText(m("toast.readOnly")).first().isVisible().catch(() => false);
    const posted = (await page.getByRole("log").getByText("Should not send").count()) > 0;
    return { ok: said && !posted, note: said ? m("toast.readOnly") : "no reason given" };
  });
  await step("Stop viewing: back as Mona", async () => {
    await page.getByRole("button", { name: m("suite.stopViewing") }).click();
    await page.waitForURL((u) => u.pathname === "/hq/office", { timeout: 30000 });
    await settle(page);
  }, async () => {
    const mona = await page.getByRole("button", { name: /Mona Adel/ }).first().isVisible().catch(() => false);
    return { ok: mona, note: mona ? "Mona again" : "still someone else" };
  });
}, { enter: false });

await browser.close();
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "walks.json"), JSON.stringify({ at: new Date().toISOString(), locale: LOCALE, walks }, null, 2));
const all = walks.flatMap((w) => w.steps);
console.log(`\n${all.filter((s) => s.ok).length} of ${all.length} steps passed (${LOCALE}) · written ${path.relative(AUDITS, path.join(OUT, "walks.json"))}`);
