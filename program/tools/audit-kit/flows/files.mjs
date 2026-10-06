// Files: three golden flows, walked in the browser as Mona. Each step records a screenshot, what
// happened, and the console and API errors on the way. This is the audit method's flow walk
// (audits/README.md), and the script is the flows' regression test once they're fixed.
//
//   node flows/files.mjs [--locale ar]   (Files dev server and the local-dev mock running)
//
// Control names and expected messages come from the app's own catalog for that language, so the
// same walk proves the flows in every language (wave step 9: en and ar).
//
// Writes audits/files/flows/<flow>/NN-<step>.png and audits/files/flows/walks.json.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, AUDIT_TZ, WORKSPACE, redact, webUrl } from "../lib/suite.mjs";
import { mock } from "../lib/mock.mjs";
import { signIn } from "../lib/session.mjs";
import { settle, watch } from "../lib/checks.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const LOCALE = arg("--locale", "en");
const CATALOG = JSON.parse(fs.readFileSync(path.join(WORKSPACE, "file-manager-dashboard-main", "messages", `${LOCALE}.json`), "utf8"));
// A message in the walk's language, with simple {name} values (no plurals needed here).
const m = (key, values = {}) => {
  const text = key.split(".").reduce((o, k) => (o == null ? o : o[k]), CATALOG);
  if (typeof text !== "string") throw new Error(`no message ${key} in ${LOCALE}`);
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in values ? String(values[k]) : `{${k}}`));
};
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// The library's own label for the time field (its catalog, not the app's).
const TIME = { en: "Time", ar: "الوقت", de: "Uhrzeit", fr: "Heure", it: "Ora" }[LOCALE];
const OUT = path.join(AUDITS, "files", "flows", ...(LOCALE === "en" ? [] : [LOCALE]));
const BASE = webUrl("files");
const AS = "mona.adel@orgtik.test";
const unlock = await mock.lock(`files-flows (session e1a403a7)`);
const browser = await chromium.launch();
const walks = [];

async function walk(id, title, fn) {
  await mock.reset();
  const dir = path.join(OUT, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: AUDIT_TZ, permissions: ["clipboard-read", "clipboard-write"] });
  await signIn(ctx, "files", AS);
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
      await page.waitForTimeout(600);
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
    steps.push({ n, name, ok, note, ms: Date.now() - started, url: redact(new URL(page.url()).pathname + new URL(page.url()).search), screenshot: `${id}/${shot}` });
    console.log(`  ${ok ? "ok  " : "FAIL"} ${n}. ${name}${note ? ` (${note})` : ""}`);
    return ok;
  };
  console.log(`\n${id}: ${title}`);
  try {
    await fn({ page, ctx, step });
  } finally {
    walks.push({ id, title, as: AS, steps, console: log.console.slice(0, 10), api: log.api.map((a) => ({ ...a, url: redact(a.url) })).slice(0, 10) });
    await ctx.close();
  }
}

const open = async (page, route) => {
  await page.goto(BASE + route, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await settle(page);
};
// The library's toasts (and sonner's, before the wave moved Files onto the library).
const toast = (page) => page.locator("[data-orgtik-toast], [data-sonner-toast]").first().innerText({ timeout: 4000 }).catch(() => "");
// The page's own content, without the sidebar or the upload panel.
const mainText = (page) => page.locator("main").first().innerText().catch(() => "");
// A card's menu button: from the element holding exactly this text, the nearest ancestor that
// contains a button is the card itself.
// The card itself (to open a folder): the element holding exactly this text, in the main area.
async function cardMenuHost(page, name) {
  return page.locator("main").first().getByText(name, { exact: true }).first();
}
// A file's or folder's menu, by the button's spoken name (FILES-005 gave every one a name).
async function cardMenu(page, name) {
  const byName = page.getByRole("button", { name: m("Files.rowActions", { name }) }).first();
  if (await byName.count()) return byName;
  throw new Error(`no "${m("Files.rowActions", { name })}" button`);
}

// F1: upload a file into a folder, then find it there.
async function upload(page, step, folders, fileName) {
  await step("Open My files", () => open(page, `/${LOCALE}/my-files`), async () => (await page.getByRole("heading", { name: m("Files.title"), level: 1 }).isVisible()) || "heading missing");
  await step("Open Upload files", () => page.getByRole("button", { name: m("FileUpload.uploadBtn") }).click(), async () => (await page.getByRole("dialog", { name: m("FileUpload.title") }).isVisible()) || "dialog didn't open");
  // The destination is one folder (FS-FILES-3): a Combobox; choosing another replaces it.
  await step(`Choose ${folders.join(" and ")}`, async () => {
    const box = page.getByRole("dialog").getByRole("combobox").first();
    for (const f of folders) {
      await box.click();
      await box.fill(f);
      await page.getByRole("option", { name: f, exact: true }).click();
    }
  }, async () => {
    const shown = (await page.getByRole("dialog").getByRole("combobox").first().inputValue()).trim();
    const last = folders[folders.length - 1];
    return { ok: shown === last, note: `picker shows "${shown}" (one destination)` };
  });
  // FILES-023: the drop zone is a real button; from the keyboard, Enter opens the file chooser.
  await step("Open the file chooser from the keyboard", async () => {
    // A list still open from the folder picker would take the Enter: close it on the dialog's title
    // first (Escape would close the whole dialog).
    await page.getByRole("dialog").getByRole("heading").first().click();
    const zone = page.getByRole("dialog").getByRole("button", { name: m("FileUpload.dragDropFiles") }).first();
    await zone.focus();
    const chooser = page.waitForEvent("filechooser", { timeout: 5000 });
    await page.keyboard.press("Enter");
    await (await chooser).setFiles([]);
  }, async () => ({ note: "Enter on the focused drop zone opened the file chooser" }));
  await step("Add a file", () => page.locator("[role=dialog] input[type=file]").setInputFiles({ name: fileName, mimeType: "text/plain", buffer: Buffer.from("Uploaded by the Files audit walk.\n") }),
    async () => ({ ok: (await page.getByRole("dialog").innerText()).includes(fileName), note: "the file is listed in the dialog" }));
  let message = "";
  await step("Upload now", () => page.getByRole("button", { name: m("FileUpload.uploadNow") }).click(), async () => {
    await page.waitForTimeout(2500);
    message = await toast(page);
    return { ok: message.includes(m("Common.uploadSuccess")), note: `toast: ${message || "(none)"}` };
  });
  return message;
}

await walk("F1-upload", "Upload a file into a folder and find it there", async ({ page, step }) => {
  await upload(page, step, ["Contracts"], "audit-walk.txt");
  await step("Open the Contracts folder", async () => {
    await open(page, `/${LOCALE}/my-files`);
    await (await cardMenuHost(page, "Contracts")).click();
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await settle(page);
  }, async () => ({ ok: (await mainText(page)).includes("audit-walk.txt"), note: "the uploaded file is in the folder's file list" }));
});

// F1b: the destination picker lets you tick two folders. Does uploading to both work?
await walk("F1b-upload-two-folders", "Upload one file to two folders at once", async ({ page, step }) => {
  await upload(page, step, ["Contracts", "Invoices 2026"], "audit-walk-two.txt");
});

// F2: create a folder, archive it, restore it.
await walk("F2-archive", "Create a folder, archive it, restore it", async ({ page, step }) => {
  const name = "Audit walk folder";
  await step("Open My files", () => open(page, `/${LOCALE}/my-files`));
  await step("Create folder", async () => {
    await page.getByRole("button", { name: m("CreateFolder.title") }).click();
    await page.getByRole("textbox", { name: m("CreateFolder.folderName") }).fill(name);
    await page.getByRole("dialog").getByRole("button", { name: m("Common.save") }).click();
  }, async () => {
    await page.waitForTimeout(1500);
    const said = await toast(page);
    return { ok: (await mainText(page)).includes(name) && said.includes(m("Feedback.folderCreated", { name })), note: `toast: ${said || "(none)"}` };
  });
  await step("Archive it from its menu", async () => {
    await (await cardMenu(page, name)).click();
    await page.getByRole("menuitem", { name: m("Common.archive") }).click();
    await page.waitForTimeout(500);
    const confirm = page.getByRole("alertdialog").or(page.getByRole("dialog")).getByRole("button", { name: m("Dialogs.archive.confirm"), exact: true }).first();
    if (await confirm.count()) await confirm.click();
  }, async () => {
    await page.waitForTimeout(1500);
    return { ok: !(await mainText(page)).includes(name), note: `toast: ${(await toast(page)) || "(none)"}` };
  });
  await step("Find it in Archived files", async () => {
    await page.getByRole("link", { name: m("Sidebar.archived") }).first().click();
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await settle(page);
  }, async () => ({ ok: (await mainText(page)).includes(name), note: "listed in the archive" }));
  // FILES-002/003: opened directly (a link in a new tab), the folder shows its own name, and "back"
  // goes to Archived files instead of out of the app.
  await step("Open it directly in a new tab", async () => {
    const href = await page.getByRole("link", { name: new RegExp(name) }).first().getAttribute("href");
    const tab = await page.context().newPage();
    await tab.goto(new URL(href, BASE).href, { waitUntil: "load" });
    await tab.getByRole("heading", { level: 1, name }).waitFor({ timeout: 15000 });
    const back = await tab.getByRole("link", { name: m("Archived.backTo", { name: m("Archived.title") }) }).getAttribute("href");
    await tab.close();
    if (!/\/archived-files$/.test(back)) throw new Error(`back goes to ${back}`);
  }, async () => ({ note: "the folder's own name as the title; back goes to Archived files" }));
  await step("Restore it", async () => {
    await (await cardMenu(page, name)).click();
    // The menu opens with a short animation: wait for it before reading its items.
    await page.getByRole("menu").waitFor({ timeout: 5000 });
    const items = await page.getByRole("menuitem").allInnerTexts();
    const restore = items.find((t) => t.trim() === m("Common.unarchive") || t.trim() === m("Archived.restore"));
    if (!restore) throw new Error(`no Restore item (menu: ${items.join(", ")})`);
    await page.getByRole("menuitem", { name: restore.trim() }).click();
    await page.waitForTimeout(500);
    const confirm = page.getByRole("alertdialog").or(page.getByRole("dialog")).getByRole("button", { name: new RegExp(`^(${esc(m("Archived.restore"))}|${esc(m("Common.unarchive"))})$`) }).first();
    if (await confirm.count()) await confirm.click();
  }, async () => {
    await page.waitForTimeout(1500);
    const said = await toast(page);
    return { ok: said.includes(m("Feedback.restoredNamed", { name })), note: `toast: ${said || "(none)"}` };
  });
  await step("Back in My files", () => open(page, `/${LOCALE}/my-files`), async () => ({ ok: (await mainText(page)).includes(name), note: "the folder is back" }));
});

// F3: share a file with an external link, open it signed out, revoke it.
let shareUrl = "";
await walk("F3-share", "Share a file with an external link, open it signed out, revoke it", async ({ page, step }) => {
  const file = "Q3 2026 Executive Summary.pdf";
  await step("Open My files", () => open(page, `/${LOCALE}/my-files`));
  await step("Share with › External links", async () => {
    await (await cardMenu(page, file)).click();
    await page.getByRole("menuitem", { name: m("Common.shareWith") }).click();
    await page.getByRole("tab", { name: m("Share.externalTab") }).click();
  }, async () => (await page.getByRole("button", { name: m("Share.createLink") }).isVisible()) || "no Create link button");
  await step("Create a view-only link", async () => {
    await page.getByRole("textbox", { name: new RegExp(`^${esc(m("Share.label"))}`) }).fill("Audit walk");
    await page.getByRole("button", { name: m("Share.createLink") }).click();
    await page.getByRole("textbox", { name: m("Share.copyUrl") }).waitFor({ timeout: 5000 });
    shareUrl = await page.getByRole("textbox", { name: m("Share.copyUrl") }).inputValue();
  }, async () => {
    // FILES-021: the expiry is shown in the person's time zone. Right after creating, the new form's
    // default is now + 7 days, so its time must equal Cairo's clock now (it used to be 3 hours behind).
    const shown = await page.getByRole("dialog").getByLabel(TIME).first().inputValue().catch(() => "?");
    const now = new Date().toLocaleTimeString("en-GB", { timeZone: AUDIT_TZ, hour: "2-digit", minute: "2-digit" });
    const minutes = (hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
    const drift = Math.abs(minutes(shown) - minutes(now));
    return { ok: /\/share\/[^?]+\?secret=/.test(shareUrl) && (drift <= 1 || drift >= 1439), note: `expiry time shows ${shown}; Cairo time now ${now}` };
  });
  // The guest browses in the walk's language too: the link carries none, their browser picks it.
  const visitor = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: AUDIT_TZ, locale: LOCALE });
  const guest = await visitor.newPage();
  await step("Open the link signed out", async () => {
    await guest.goto(shareUrl, { waitUntil: "load" });
    await guest.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  }, async () => {
    const text = await guest.locator("body").innerText();
    await guest.screenshot({ path: path.join(OUT, "F3-share", "04b-guest-view.png") });
    return { ok: text.includes(file), note: `guest sees: ${text.split("\n").filter(Boolean).slice(0, 3).join(" / ").slice(0, 120)}` };
  });
  await step("Revoke the link", async () => {
    await page.getByRole("button", { name: m("Share.revoke"), exact: true }).first().click();
    // A confirmation that says what revoking breaks, with "Keep link" as the way out.
    await page.getByRole("alertdialog").getByRole("button", { name: m("Share.revokeConfirm") }).click();
  }, async () => {
    await page.waitForTimeout(1200);
    const text = await page.getByRole("dialog").first().innerText().catch(() => "");
    const marks = [m("Share.statusRevoked"), m("Share.revokeSuccess")];
    const revoked = marks.find((t) => text.includes(t)) ?? marks[0];
    return { ok: text.includes(revoked), note: text.split("\n").find((l) => l.includes(revoked)) || "no revoked state shown" };
  });
  await step("Open the link again signed out", async () => {
    await guest.goto(shareUrl, { waitUntil: "load" });
    await guest.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  }, async () => {
    const text = await guest.locator("body").innerText();
    await guest.screenshot({ path: path.join(OUT, "F3-share", "06b-guest-after-revoke.png") });
    return { ok: !text.includes(m("PublicShare.download")) && text.includes(m("PublicShare.unavailable")), note: `guest sees: ${text.split("\n").filter(Boolean).slice(0, 3).join(" / ").slice(0, 120)}` };
  });
  await visitor.close();
});

await browser.close();
await mock.reset();
unlock();
fs.writeFileSync(path.join(OUT, "walks.json"), JSON.stringify({ at: new Date().toISOString(), locale: LOCALE, walks }, null, 2));
const all = walks.flatMap((w) => w.steps);
console.log(`\n${all.filter((s) => s.ok).length} of ${all.length} steps passed (${LOCALE}) · written ${path.relative(AUDITS, path.join(OUT, "walks.json"))}`);
