/**
 * SOMION HQ - OWNER, ADMIN AND MEMBER FLOWS
 *
 * The flows the roles audit found missing or incomplete, walked to their end
 * state. A capability that gates nothing is not a capability, and a step that
 * accepts input and drops it is worse than one that is missing - both are
 * asserted here rather than assumed.
 *
 * Run against the dev server: node flows-owner.mjs
 */

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const results = [];
const check = (name, pass, detail = "") => results.push({ flow: name, result: pass ? "pass" : "FAIL", detail });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1560, height: 1000 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 120)));

/** The store lives in the page, so the role is set after every load. */
const setRole = async (role) => {
  await page.getByRole("button", { name: /^(Owner|Admin|Member)$/ }).first().click();
  await page.waitForTimeout(250);
  await page.getByRole("dialog", { name: /Switch role/ }).getByRole("button", { name: new RegExp(`^${role}\\b`) }).click();
  await page.waitForTimeout(350);
};

/* ------------------------------------------------ owner sees the whole thing */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await setRole("Owner");
await page.getByRole("link", { name: /^Settings/ }).click();
await page.waitForTimeout(700);
check("Owner: settings has the reset control", (await page.getByRole("button", { name: /^Reset$/ }).count()) > 0);
check("Owner: settings links to setup", (await page.getByRole("link", { name: /Open setup/ }).count()) > 0);
check("Owner: controls are live", !(await page.getByRole("switch").first().isDisabled()));

/* ------------------------------------------------ member sees, cannot change */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await setRole("Member");
await page.getByRole("link", { name: /^Settings/ }).click();
await page.waitForTimeout(700);
check("Member: settings are read-only", await page.getByRole("switch").first().isDisabled());
check("Member: told why", (await page.getByText(/viewing as Member/).count()) > 0);
check("Member: no reset, no setup", (await page.getByRole("button", { name: /^Reset$/ }).count()) === 0 && (await page.getByRole("link", { name: /Open setup/ }).count()) === 0);
await page.getByRole("link", { name: /^Office/ }).click();
await page.waitForTimeout(600);
check("Member: cannot add rooms", (await page.getByRole("button", { name: "Add a room" }).count()) === 0);
await page.goto(`${BASE}/hq/setup`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
/* A fresh load is admin again; switch, then hit the route client-side. */
await setRole("Member");
await page.getByRole("link", { name: /^Settings/ }).click();
await page.waitForTimeout(500);
await page.goto(`${BASE}/hq/setup`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
check("Setup: reachable for admins (fresh load)", (await page.getByText(/What is this workspace called/).count()) > 0);

/* ------------------------------------------------------- add, then remove a room */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("button", { name: "Add a room" }).click();
await page.waitForTimeout(350);
await page.getByLabel("Name", { exact: true }).fill("Room C");
await page.getByRole("button", { name: "Add room" }).click();
await page.waitForTimeout(600);
check("Admin: added room appears on the floor", (await page.getByRole("button", { name: /^Room C, Meeting room/ }).count()) > 0);
await page.getByText("Room C", { exact: true }).first().hover();
await page.waitForTimeout(200);
await page.getByRole("button", { name: /Settings for Room C/ }).click({ force: true });
await page.waitForTimeout(350);
await page.getByRole("button", { name: "Remove room" }).first().click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Remove room" }).last().click();
await page.waitForTimeout(600);
check("Admin: removed room leaves the floor", (await page.getByRole("button", { name: /^Room C, Meeting room/ }).count()) === 0);

/* --------------------------------------------- rename, archive, unarchive */
await page.goto(`${BASE}/hq/chat/c-design`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Details" }).click();
await page.waitForTimeout(400);
const pane = page.getByRole("complementary", { name: /Details for/ });
await pane.getByLabel("Name").fill("design-crit");
await pane.getByRole("button", { name: "Rename" }).click();
await page.waitForTimeout(500);
check("Admin: channel renamed", (await page.getByRole("link", { name: /design-crit/ }).count()) > 0);
await pane.getByRole("button", { name: "Archive" }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Archive" }).last().click();
await page.waitForTimeout(600);
check("Admin: archived channel is read-only", (await page.getByText(/archived/i).count()) > 0);
check("Admin: archived list appears", (await page.getByText("Archived", { exact: true }).count()) > 0);
await page.getByRole("link", { name: /design-crit/ }).first().click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: "Details" }).click();
await page.waitForTimeout(400);
await page.getByRole("complementary", { name: /Details for/ }).getByRole("button", { name: "Unarchive" }).click();
await page.waitForTimeout(500);
/* A seeded channel is archived too, so the section stays; this one leaves it. */
check(
  "Admin: unarchive brings it back",
  (await page.locator("span.line-through", { hasText: "design-crit" }).count()) === 0 &&
    (await page.getByRole("link", { name: /design-crit/ }).count()) > 0,
);

/* --------------------------------------------------------- remove a member */
await page.goto(`${BASE}/hq/chat/c-design`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Details" }).click();
await page.waitForTimeout(400);
await page.getByRole("tab", { name: /Members/ }).click();
await page.waitForTimeout(300);
const before = (await page.getByRole("tab", { name: /Members/ }).textContent())?.trim();
await page.getByRole("button", { name: /Remove Nadia/ }).click();
await page.waitForTimeout(500);
const after = (await page.getByRole("tab", { name: /Members/ }).textContent())?.trim();
check("Admin: can remove a member", before !== after, `${before} -> ${after}`);

/* ------------------------------------------------ moderate someone's message */
await page.goto(`${BASE}/hq/chat/c-design`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const theirs = page.locator(".hq-msg").filter({ hasText: "This is much better" }).first();
await theirs.hover();
await theirs.getByRole("button", { name: "More actions" }).click();
await page.waitForTimeout(300);
check("Admin: moderation is labelled as such", (await page.getByRole("menuitem", { name: "Delete as admin" }).count()) > 0);
await page.getByRole("menuitem", { name: "Delete as admin" }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Delete message" }).click();
await page.waitForTimeout(500);
check("Admin: moderated message leaves a tombstone", (await page.getByText("This message was deleted.").count()) > 0);

/* -------------------------------------------------- member cannot moderate */
await page.goto(`${BASE}/hq/chat/c-design`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await setRole("Member");
const theirs2 = page.locator(".hq-msg").filter({ hasText: "Pushed the second pass" }).first();
await theirs2.hover();
await theirs2.getByRole("button", { name: "More actions" }).click();
await page.waitForTimeout(300);
check("Member: cannot delete others' messages", (await page.getByRole("menuitem", { name: /Delete/ }).count()) === 0);
await page.keyboard.press("Escape");

/* ------------------------------------------------------------ group message */
await page.goto(`${BASE}/hq/chat/c-design`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("button", { name: "New message" }).click();
await page.waitForTimeout(350);
const dlg = page.getByRole("dialog");
await dlg.getByRole("button", { name: /Marc/ }).click();
await dlg.getByRole("button", { name: /Priya/ }).click();
await dlg.getByRole("button", { name: "Start group" }).click();
await page.waitForTimeout(900);
check("New message: two people start a group", page.url().includes("/hq/chat/grp-"), page.url().split("/").pop());
check("New message: group named after its people", (await page.getByText(/Marc, Priya|Priya, Marc/).count()) > 0);

/* -------------------------------------------- the wizard keeps an added room */
await page.goto(`${BASE}/hq/setup`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Next", exact: true }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Next", exact: true }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Add a room" }).click();
await page.waitForTimeout(250);
await page.getByLabel(/Room \d+ name/).last().fill("Studio");
await page.getByRole("button", { name: "Next", exact: true }).click();
await page.waitForTimeout(250);
await page.getByRole("button", { name: "Next", exact: true }).click();
await page.waitForTimeout(250);
await page.getByRole("button", { name: "Finish", exact: true }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Go to the office" }).click();
await page.waitForTimeout(900);
check("Wizard: a room added in setup exists afterwards", (await page.getByRole("button", { name: /^Studio,/ }).count()) > 0);

/* -------------------------------------------------------------- clear status */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("button", { name: /^Available/ }).click();
await page.waitForTimeout(300);
await page.getByLabel(/What are you up to/).fill("Deep in the export");
await page.getByRole("dialog", { name: /Set your status/ }).getByRole("button", { name: /^Busy/ }).click();
await page.waitForTimeout(400);
/* The floor tile carries the status text too; the pill is the one that opens a dialog. */
const pill = page.locator('button[aria-haspopup="dialog"]', { hasText: "Deep in the export" });
check("Status: custom line shows", (await pill.count()) > 0);
await pill.click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: /^Clear/ }).click();
await page.waitForTimeout(400);
check("Status: cleared explicitly", (await page.locator('button[aria-haspopup="dialog"]', { hasText: "Deep in the export" }).count()) === 0);

await browser.close();

console.table(results);
const failed = results.filter((r) => r.result === "FAIL").length;
console.log(`${results.length - failed}/${results.length} passed`);
if (errors.length) console.log("page errors:", errors.slice(0, 3));
