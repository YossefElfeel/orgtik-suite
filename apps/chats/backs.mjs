/**
 * SOMION HQ - BACK AND ESCAPE
 *
 * The browser's Back closes what is open before it leaves the page, and one
 * press does one visible thing. These walk the cases that went wrong while
 * the mechanism was built: a modal over a pane, a modal closed by Escape and
 * then Back, a choice that navigates, and an overlay reopened after closing.
 *
 * Run against the dev server: node backs.mjs
 */

import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const out = [];
const say = (n, ok, d = "") => out.push({ probe: n, result: ok ? "pass" : "FAIL", detail: d });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1560, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 140)));
const path = () => new URL(page.url()).pathname;
const back = async (ms = 600) => { await page.goBack().catch(() => {}); await page.waitForTimeout(ms); };
const dialogs = async () => page.getByRole("dialog").count();
const paneOpen = async () => (await page.getByRole("complementary", { name: /Details for/ }).count()) > 0;

/* a: nested pane + modal, two presses */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.goto(`${BASE}/hq/chat/c-general`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.getByRole("button", { name: "Details" }).click();
await page.waitForTimeout(300);
await page.getByRole("tab", { name: /Members/ }).click();
await page.waitForTimeout(250);
await page.getByRole("complementary", { name: /Details for/ }).getByRole("button", { name: "Add people" }).click();
await page.waitForTimeout(350);
say("a0 pane + modal open", (await paneOpen()) && (await page.getByRole("dialog", { name: /Add people/ }).count()) > 0);
await back();
say("a1 Back closes the modal, pane stays, page stays", (await page.getByRole("dialog", { name: /Add people/ }).count()) === 0 && (await paneOpen()) && path() === "/hq/chat/c-general", `${path()} pane=${await paneOpen()}`);
await back();
say("a1b second Back closes the pane, page stays", !(await paneOpen()) && path() === "/hq/chat/c-general", path());

/* a2: modal closed programmatically, then one Back closes the pane */
await page.getByRole("button", { name: "Details" }).click();
await page.waitForTimeout(300);
await page.getByRole("tab", { name: /Members/ }).click();
await page.waitForTimeout(250);
await page.getByRole("complementary", { name: /Details for/ }).getByRole("button", { name: "Add people" }).click();
await page.waitForTimeout(350);
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
say("a2 pre: Escape closed the modal, pane still open", (await page.getByRole("dialog", { name: /Add people/ }).count()) === 0 && (await paneOpen()));
await back(900);
say("a2 one Back closes the pane (skipping the dead modal entry)", !(await paneOpen()) && path() === "/hq/chat/c-general", `${path()} pane=${await paneOpen()}`);
await back(900);
say("a2b next Back leaves the page", path() === "/hq/office", path());

/* b: Escape then Back leaves the page */
await page.goto(`${BASE}/hq/chat/c-general`, { waitUntil: "networkidle" });
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.locator('button[aria-haspopup="dialog"]', { hasText: /Available|Focus|Busy|Away|In a meeting/ }).first().click();
await page.waitForTimeout(300);
say("b0 status picker open", (await page.getByRole("dialog", { name: /Set your status/ }).count()) > 0);
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
say("b1 Escape closed it", (await page.getByRole("dialog", { name: /Set your status/ }).count()) === 0);
await back(1000);
say("b Escape then Back leaves the page", path() === "/hq/chat/c-general", path());

/* d: Back closes a modal in place */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.goto(`${BASE}/hq/chat/c-general`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.getByRole("button", { name: "New channel" }).click();
await page.waitForTimeout(350);
say("d0 modal open", (await page.getByRole("dialog", { name: /New channel/ }).count()) > 0);
await back();
say("d Back closes the modal in place", (await page.getByRole("dialog", { name: /New channel/ }).count()) === 0 && path() === "/hq/chat/c-general", path());
await back(900);
say("d2 next Back leaves the page", path() === "/hq/office", path());

/* c: a choice that navigates, then Back returns without the modal */
await page.goto(`${BASE}/hq/chat/c-design`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.getByRole("button", { name: "New message" }).click();
await page.waitForTimeout(350);
const dlg = page.getByRole("dialog", { name: /New message/ });
await dlg.getByRole("button", { name: /Marc/ }).click();
await dlg.getByRole("button", { name: /Priya/ }).click();
await dlg.getByRole("button", { name: "Start group" }).click();
await page.waitForTimeout(1200);
say("c Start group navigates", path().startsWith("/hq/chat/") && path() !== "/hq/chat/c-design", path());
await back(1000);
say("c2 Back returns to the channel with no modal", path() === "/hq/chat/c-design" && (await dialogs()) === 0, `${path()} dialogs=${await dialogs()}`);

/* e: reopen the same overlay twice, Back closes it once and the second Back leaves */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.goto(`${BASE}/hq/chat/c-general`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.getByRole("button", { name: "New channel" }).click();
await page.waitForTimeout(300);
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
await page.getByRole("button", { name: "New channel" }).click();
await page.waitForTimeout(300);
await back();
say("e Back closes a reopened modal", (await page.getByRole("dialog", { name: /New channel/ }).count()) === 0 && path() === "/hq/chat/c-general", path());
await back(900);
say("e2 then leaves the page", path() === "/hq/office", path());

await browser.close();
console.table(out);
console.log(`${out.filter((r) => r.result === "pass").length}/${out.length} passed`);
if (errors.length) console.log("page errors:", errors.slice(0, 4));
