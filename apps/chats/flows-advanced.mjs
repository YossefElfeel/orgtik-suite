/**
 * SOMION HQ - ADVANCED SETTINGS AND ROOM BEHAVIOUR
 *
 * A setting that changes nothing is a label. Each of these flips a setting or
 * a room's behaviour and asserts that the floor, the menu, the dock or a role
 * actually changed with it.
 *
 * Run against the dev server: node flows-advanced.mjs
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

const setRole = async (role) => {
  await page.getByRole("button", { name: /^(Owner|Admin|Member)$/ }).first().click();
  await page.waitForTimeout(250);
  await page.getByRole("dialog", { name: /Switch role/ }).getByRole("button", { name: new RegExp(`^${role}\\b`) }).click();
  await page.waitForTimeout(350);
};

/* ----------------------------------------------- hearing: volume, mute, moderation */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.locator('[data-user="u-sara"]').click();
await page.waitForTimeout(500);
const menu = page.getByRole("dialog", { name: /Actions for Sara/ });
check("Person menu: volume slider", (await menu.getByRole("slider", { name: /Volume of Sara/ }).count()) > 0);
check("Person menu: mute for me", (await menu.getByRole("button", { name: "Mute for me" }).count()) > 0);
check("Person menu: admin can mute mic and deafen", (await menu.getByRole("button", { name: "Mute mic" }).count()) > 0 && (await menu.getByRole("button", { name: "Deafen" }).count()) > 0);
await menu.getByRole("button", { name: "Mute for me" }).click();
await page.waitForTimeout(300);
check("Mute for me: tile says so", (await page.locator('[data-user="u-sara"]').getAttribute("aria-label"))?.includes("muted for you") === true);
await menu.getByRole("button", { name: "Mute mic" }).click();
await page.waitForTimeout(300);
check("Moderator mute: tile says so", (await page.locator('[data-user="u-sara"]').getAttribute("aria-label"))?.includes("muted by a moderator") === true);
await menu.getByRole("button", { name: "Deafen" }).click();
await page.waitForTimeout(300);
check("Moderator deafen: tile says so", (await page.locator('[data-user="u-sara"]').getAttribute("aria-label"))?.includes("deafened") === true);
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

/* Members cannot moderate audio. */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await setRole("Member");
await page.locator('[data-user="u-sara"]').click();
await page.waitForTimeout(500);
const menu2 = page.getByRole("dialog", { name: /Actions for Sara/ });
check("Member: can mute for themselves only", (await menu2.getByRole("button", { name: "Mute for me" }).count()) > 0 && (await menu2.getByRole("button", { name: "Mute mic" }).count()) === 0);
await page.keyboard.press("Escape");

/* --------------------------------------------- a room's entry status and the dock */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("button", { name: /^Quiet Room,/ }).click();
await page.waitForTimeout(700);
check("Quiet Room sets Focus on entry", (await page.locator('button[aria-haspopup="dialog"]', { hasText: /Focus/ }).count()) > 0);
const deafenSelf = page.getByRole("button", { name: /Deafen: hear nobody/ });
check("Dock: deafen yourself", (await deafenSelf.count()) > 0);
await deafenSelf.click();
await page.waitForTimeout(250);
check("Dock: deafen toggles", (await page.getByRole("button", { name: /Hear the room again/ }).count()) > 0);

/* ------------------------------------------------- a room with hours refuses entry */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByText("Room B", { exact: true }).first().hover();
await page.waitForTimeout(200);
await page.getByRole("button", { name: /Settings for Room B/ }).click({ force: true });
await page.waitForTimeout(400);
const dlg = page.getByRole("dialog", { name: /Room settings/ });
check("Room settings: kind, purpose, behaviour", (await dlg.getByLabel(/What kind of room/).count()) > 0 && (await dlg.getByLabel(/What is it for/).count()) > 0 && (await dlg.getByRole("switch", { name: /Hard capacity/ }).count()) > 0);
await dlg.getByRole("switch", { name: /Opening hours/ }).check();
await page.waitForTimeout(200);
/* A one-minute window at 03:00 is closed at any sane demo time. */
await dlg.getByLabel("From", { exact: true }).fill("03:00");
await dlg.getByLabel("To", { exact: true }).fill("03:01");
await dlg.getByRole("button", { name: "Save", exact: true }).click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: /^Room B,/ }).click();
await page.waitForTimeout(600);
check("Closed room refuses entry and says why", (await page.getByText(/Room B is closed/).count()) > 0);

/* ------------------------------------------------- a kind that hides who is inside */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("button", { name: "Add a room" }).click();
await page.waitForTimeout(350);
await page.getByLabel("Name", { exact: true }).fill("Nap room");
await page.getByRole("radio", { name: /Wellness room/ }).check();
await page.getByRole("button", { name: "Add room" }).click();
await page.waitForTimeout(700);
check("Twelve kinds: a wellness room can be added", (await page.getByRole("button", { name: /^Nap room, Wellness room/ }).count()) > 0);
check("Kind defaults: wellness names nobody", (await page.getByText(/Wellness room · Rest/).count()) > 0);

/* -------------------------------------------------- settings drive real behaviour */
await page.goto(`${BASE}/hq/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
check("Settings: section nav", (await page.getByRole("navigation", { name: "Settings sections" }).getByRole("link").count()) >= 12);
check("Settings: access section", (await page.getByText("Access", { exact: true }).count()) > 0);
await page.getByRole("radiogroup", { name: "Create channels" }).getByRole("radio", { name: "Admins only" }).click();
await page.waitForTimeout(300);
await page.getByRole("radiogroup", { name: "Earshot" }).getByRole("radio", { name: "Wide" }).click();
await page.waitForTimeout(300);
check("Settings: earshot is Wide", (await page.getByRole("radiogroup", { name: "Earshot" }).getByRole("radio", { name: "Wide" }).getAttribute("aria-checked")) === "true");
/* The settings page now has its own section nav; the module nav is the one that leaves the page. */
await page.getByRole("navigation", { name: "HQ sections" }).getByRole("link", { name: /^Chat/ }).click();
await page.getByText("Channels", { exact: true }).first().waitFor({ timeout: 5000 });
await page.waitForTimeout(300);
check("Admin still creates channels", (await page.getByRole("button", { name: "New channel" }).count()) > 0);
await setRole("Member");
await page.waitForTimeout(500);
check("Access setting narrows a member", (await page.getByRole("button", { name: "New channel" }).count()) === 0);

/* -------------------------------------------------------- owner export as a file */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await setRole("Owner");
await page.getByRole("link", { name: /^Settings/ }).click();
await page.waitForTimeout(700);
const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 5000 }).catch(() => null),
  page.getByRole("button", { name: /Export as JSON/ }).click(),
]);
check("Owner: export downloads a JSON file", Boolean(download) && (download?.suggestedFilename() ?? "").endsWith(".json"), download?.suggestedFilename() ?? "no download");

/* ------------------------------------------------ appearance: the system colour */
await page.goto(`${BASE}/hq/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const token = (name) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim().toLowerCase(), name);
const rose = await token("--color-brand-600");
await page.getByRole("radiogroup", { name: "System colour" }).getByRole("radio", { name: "Olive" }).click();
await page.waitForTimeout(250);
check("Accent: Olive re-points the brand ramp", (await token("--color-brand-600")) === "#5d6b00" && rose === "#a62e5c", await token("--color-brand-600"));
check("Accent: the accent and focus ring follow", (await token("--color-accent")) === "#5d6b00" && (await token("--color-focus-ring")) === "#5d6b00");
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(900);
check(
  "Accent: survives a reload and is painted before hydration",
  (await page.evaluate(() => document.documentElement.getAttribute("data-accent"))) === "olive" && (await token("--color-brand-600")) === "#5d6b00",
);
await setRole("Member");
check("Accent: a member may change it (it is theirs)", !(await page.getByRole("radio", { name: "Rose" }).isDisabled()));
await page.getByRole("radio", { name: "Rose" }).click();
await page.waitForTimeout(200);
check("Accent: Rose clears the override", (await page.evaluate(() => document.documentElement.getAttribute("data-accent"))) === null && (await token("--color-brand-600")) === "#a62e5c");

/* ------------------------------------------------------ signing out by choice */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("button", { name: /^Available/ }).click();
await page.waitForTimeout(250);
await page.getByRole("dialog", { name: /Set your status/ }).getByRole("button", { name: "Sign out" }).click();
await page.waitForTimeout(400);
check("Sign out: the shell is replaced by the signed-out screen", (await page.getByRole("heading", { name: "Signed out" }).count()) > 0 && (await page.getByRole("button", { name: /^Available/ }).count()) === 0);
await page.getByRole("button", { name: "Sign in again" }).click();
await page.waitForTimeout(500);
check("Sign in again: back in, status restored", (await page.getByRole("button", { name: /^Available/ }).count()) > 0);

/* ------------------------------------------- inactivity: the session ends */
/* A fake clock, installed before the page loads, so five minutes take no time. */
const ctxI = await browser.newContext({ viewport: { width: 1560, height: 1000 } });
const pi = await ctxI.newPage();
await pi.clock.install();
await pi.goto(`${BASE}/hq/settings`, { waitUntil: "networkidle" });
await pi.waitForTimeout(900);
await pi.getByLabel("Sign out after inactivity").selectOption("5");
await pi.waitForTimeout(200);
await pi.clock.fastForward(4 * 60_000 + 5_000);
await pi.waitForTimeout(300);
check("Inactivity: the last minute is announced", (await pi.getByRole("alertdialog", { name: "Still there?" }).count()) > 0);
await pi.mouse.move(300, 300);
await pi.clock.runFor(1_500);
await pi.waitForTimeout(200);
check("Inactivity: moving the mouse cancels it", (await pi.getByRole("alertdialog").count()) === 0);
await pi.clock.fastForward(5 * 60_000 + 5_000);
await pi.waitForTimeout(400);
check(
  "Inactivity: five minutes still and the session ends, saying why",
  (await pi.getByRole("heading", { name: "Signed out" }).count()) > 0 && (await pi.getByText(/No input for 5 minutes/).count()) > 0,
);
await pi.getByRole("button", { name: "Sign in again" }).click();
await pi.waitForTimeout(500);
check("Inactivity: sign in again restores the shell", (await pi.getByRole("button", { name: /^Available/ }).count()) > 0);
await ctxI.close();

/* ------------------------------------------------ insights: period and people */
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return key(d); };
await page.goto(`${BASE}/hq/insights`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
check("Insights: opens on the last 30 days", (await page.getByRole("button", { name: /^Last 30 days/ }).count()) > 0);
await page.getByRole("button", { name: /^Last 30 days/ }).click();
await page.waitForTimeout(300);
const rangeDlg = page.getByRole("dialog", { name: "Choose a period" });
check("Insights: the period dialog lists presets and two months", (await rangeDlg.getByRole("button", { name: "Last 7 days" }).count()) > 0 && (await rangeDlg.getByRole("grid").count()) === 2);
await rangeDlg.getByRole("button", { name: "Last 7 days" }).click();
await page.waitForTimeout(400);
check("Insights: preset applies and closes", (await page.getByRole("button", { name: /^Last 7 days/ }).count()) > 0 && (await page.getByRole("dialog", { name: "Choose a period" }).count()) === 0);
check("Insights: the table twin is one click away", (await page.getByRole("button", { name: "Table view" }).count()) > 0);
await page.getByRole("button", { name: "Table view" }).click();
await page.waitForTimeout(300);
check("Insights: seven days, seven rows", (await page.getByRole("row").count()) === 8);
await page.getByRole("button", { name: "Hide table" }).click();
/* A custom span, typed. */
await page.getByRole("button", { name: /^Last 7 days/ }).click();
await page.waitForTimeout(300);
await page.getByRole("dialog", { name: "Choose a period" }).getByLabel("From").fill(daysAgo(40));
await page.getByRole("dialog", { name: "Choose a period" }).getByLabel("To").fill(daysAgo(27));
check("Insights: the span counts its days", (await page.getByRole("dialog", { name: "Choose a period" }).getByText("14 days").count()) > 0);
await page.getByRole("button", { name: "Apply" }).click();
await page.waitForTimeout(400);
check("Insights: a custom span applies", (await page.getByRole("button", { name: /^Custom/ }).count()) > 0);
/* Compare is a switch, and deltas follow it. */
check("Insights: deltas name the period they are against", (await page.getByText("vs previous period").count()) > 0);
await page.getByRole("switch", { name: /Compare with the period before/ }).uncheck();
await page.waitForTimeout(300);
check("Insights: without compare there is no delta", (await page.getByText("vs previous period").count()) === 0);
await page.getByRole("switch", { name: /Compare with the period before/ }).check();
/* The cohort rule. */
await page.getByRole("button", { name: /^Everyone/ }).click();
await page.waitForTimeout(300);
await page.getByRole("dialog", { name: "Choose people" }).getByRole("button", { name: "Admins" }).click();
await page.getByRole("button", { name: "Done" }).click();
await page.waitForTimeout(400);
check("Insights: three admins is below the minimum, so nothing is shown", (await page.getByText(/3 people is below the minimum of 5/).count()) > 0 && (await page.getByText("Hours anyone was here").count()) === 0);
await page.getByRole("button", { name: /^3 people/ }).click();
await page.waitForTimeout(300);
await page.getByRole("dialog", { name: "Choose people" }).getByRole("button", { name: "Only me" }).click();
await page.getByRole("button", { name: "Done" }).click();
await page.waitForTimeout(400);
check("Insights: only me is always allowed and says so", (await page.getByText("These are your own numbers.", { exact: false }).count()) > 0 && (await page.getByText("Hours you were here").count()) > 0);
await page.getByRole("button", { name: /^Only you/ }).click();
await page.waitForTimeout(300);
await page.getByRole("dialog", { name: "Choose people" }).getByRole("option", { name: /Sara/ }).click();
await page.getByRole("dialog", { name: "Choose people" }).getByRole("option", { name: /Omar/ }).click();
await page.getByRole("dialog", { name: "Choose people" }).getByRole("option", { name: /Lena/ }).click();
await page.getByRole("dialog", { name: "Choose people" }).getByRole("option", { name: /Marc/ }).click();
await page.getByRole("button", { name: "Done" }).click();
await page.waitForTimeout(400);
check("Insights: five people is a team again", (await page.getByRole("button", { name: /^5 people/ }).count()) > 0 && (await page.getByText("Hours anyone was here").count()) > 0);
/* Export is a file and a confirmation. */
const [csv] = await Promise.all([
  page.waitForEvent("download", { timeout: 5000 }).catch(() => null),
  page.getByRole("button", { name: "Export CSV" }).click(),
]);
await page.waitForTimeout(300);
check("Insights: export downloads a CSV and says so", Boolean(csv) && (csv?.suggestedFilename() ?? "").endsWith(".csv") && (await page.getByText("Exported").count()) > 0, csv?.suggestedFilename() ?? "no download");

/* -------------------------------------------------------- meetings: calendar */
await page.goto(`${BASE}/hq/meetings`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Calendar" }).click();
await page.waitForTimeout(400);
check("Calendar: a month grid with today marked", (await page.getByRole("grid", { name: "Meetings by day" }).count()) > 0 && (await page.getByText("today", { exact: true }).count()) > 0);
check("Calendar: today's meetings are listed beside the month", (await page.getByText(/booked/).count()) > 0);
await page.getByRole("button", { name: "Week" }).click();
await page.waitForTimeout(400);
check("Calendar: the week lays meetings out by hour", (await page.getByText("09:00", { exact: true }).count()) > 0 && (await page.getByRole("link", { name: /Design critique/ }).count()) > 0);
await page.getByRole("button", { name: "Next week" }).click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: "Today" }).click();
await page.getByRole("button", { name: /^Schedule on/ }).click();
await page.waitForTimeout(300);
check("Calendar: scheduling from a day fills the day in", (await page.getByLabel("Day").inputValue()) === key(new Date()));

/* ------------------------------------------ inactivity: the computer, not the tab */
/* The real Idle Detection API cannot be driven from a test, so a stand-in is
   installed before the page loads: same surface, and a handle to flip it. */
await page.goto(`${BASE}/hq/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
check("Idle watch: settings say where inactivity is measured", (await page.getByText("Where inactivity is measured").count()) > 0);
const ctxD = await browser.newContext({ viewport: { width: 1560, height: 1000 } });
await ctxD.addInitScript(() => {
  const instances = [];
  class FakeIdleDetector extends EventTarget {
    constructor() { super(); this.userState = "active"; this.screenState = "unlocked"; this.threshold = 0; instances.push(this); }
    static requestPermission() { return Promise.resolve("granted"); }
    start({ threshold }) { this.threshold = threshold; return Promise.resolve(); }
  }
  window.IdleDetector = FakeIdleDetector;
  window.__idle = {
    set(idle) { for (const d of instances) { d.userState = idle ? "idle" : "active"; d.dispatchEvent(new Event("change")); } },
    threshold() { return instances.length ? instances[instances.length - 1].threshold : -1; },
  };
  const q = navigator.permissions.query.bind(navigator.permissions);
  navigator.permissions.query = (d) => (d && d.name === "idle-detection" ? Promise.resolve({ state: "granted" }) : q(d));
});
const pd = await ctxD.newPage();
await pd.clock.install();
await pd.goto(`${BASE}/hq/settings`, { waitUntil: "networkidle" });
await pd.waitForTimeout(900);
check("Idle watch: with permission the row says whole computer", (await pd.getByText("Whole computer").count()) > 0);
await pd.getByLabel("Sign out after inactivity").selectOption("5");
await pd.waitForTimeout(300);
check("Idle watch: the computer is asked for the policy minus the last minute", (await pd.evaluate(() => window.__idle.threshold())) === 4 * 60_000);
/* Working in another window: the tab sees nothing for ten minutes and must not care. */
await pd.clock.fastForward(10 * 60_000);
await pd.waitForTimeout(200);
check("Idle watch: no tab input for 10 minutes is not idleness", (await pd.getByRole("alertdialog").count()) === 0 && (await pd.getByRole("heading", { name: "Signed out" }).count()) === 0);
await pd.evaluate(() => window.__idle.set(true));
await pd.clock.runFor(1_500);
await pd.waitForTimeout(200);
check("Idle watch: the computer going idle starts the last minute", (await pd.getByText(/Your computer has seen no input for 5 minutes/).count()) > 0);
await pd.evaluate(() => window.__idle.set(false));
await pd.clock.runFor(1_500);
await pd.waitForTimeout(200);
check("Idle watch: input anywhere on the computer cancels it", (await pd.getByRole("alertdialog").count()) === 0);
await pd.evaluate(() => window.__idle.set(true));
await pd.clock.fastForward(61_000);
await pd.waitForTimeout(300);
check("Idle watch: a full minute idle ends the session and says the computer reported it", (await pd.getByText(/Your computer reported no input for 5 minutes/).count()) > 0);
await ctxD.close();

/* HQ asks for the computer-wide watch itself, on the first click it sees. */
const ctxA = await browser.newContext({ viewport: { width: 1560, height: 1000 } });
await ctxA.addInitScript(() => {
  let state = "prompt";
  class FakeIdleDetector extends EventTarget {
    constructor() { super(); this.userState = "active"; this.screenState = "unlocked"; }
    static requestPermission() { state = "granted"; return Promise.resolve("granted"); }
    start() { return Promise.resolve(); }
  }
  window.IdleDetector = FakeIdleDetector;
  const q = navigator.permissions.query.bind(navigator.permissions);
  navigator.permissions.query = (d) => (d && d.name === "idle-detection" ? Promise.resolve({ state }) : q(d));
});
const pa = await ctxA.newPage();
await pa.goto(`${BASE}/hq/settings`, { waitUntil: "networkidle" });
await pa.waitForTimeout(900);
check("Idle watch: before any click, inside HQ only", (await pa.getByText("Inside HQ", { exact: true }).count()) > 0);
await pa.getByRole("heading", { name: "HQ settings" }).click();
await pa.waitForTimeout(600);
check("Idle watch: asked on the first click, and granted", (await pa.getByText("Whole computer", { exact: true }).count()) > 0);
await ctxA.close();

/* A desktop shell that reports the OS idle time needs no permission at all. */
const ctxB = await browser.newContext({ viewport: { width: 1560, height: 1000 } });
await ctxB.addInitScript(() => {
  let idle = 0;
  window.somionDesktop = { idleSeconds: () => idle };
  window.__desktop = { set: (s) => { idle = s; } };
});
const pb = await ctxB.newPage();
await pb.clock.install();
await pb.goto(`${BASE}/hq/settings`, { waitUntil: "networkidle" });
await pb.waitForTimeout(900);
check("Desktop app: the OS idle time counts as the whole computer", (await pb.getByText("Whole computer", { exact: true }).count()) > 0);
await pb.getByLabel("Sign out after inactivity").selectOption("5");
await pb.waitForTimeout(300);
await pb.evaluate(() => window.__desktop.set(4 * 60 + 1));
await pb.clock.runFor(2_500);
await pb.waitForTimeout(200);
check("Desktop app: the OS reporting idle starts the last minute", (await pb.getByText(/Your computer has seen no input for 5 minutes/).count()) > 0);
await pb.evaluate(() => window.__desktop.set(0));
await pb.clock.runFor(2_500);
await pb.waitForTimeout(200);
check("Desktop app: OS input anywhere cancels it", (await pb.getByRole("alertdialog").count()) === 0);
await ctxB.close();

/* ----------------------------------------------- dead ends that used to be */
/* A notification is about something, so it goes there. */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("button", { name: /Notifications/ }).click();
await page.waitForTimeout(300);
const firstNote = page.getByRole("dialog").getByRole("listitem").getByRole("button").first();
const noteCount = await firstNote.count();
if (noteCount > 0) {
  await firstNote.click();
  await page.waitForURL(/\/hq\/(chat|office|meetings)/, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(400);
}
check("Dead ends: a notification opens what it is about", noteCount === 0 || (await page.getByRole("dialog", { name: /Notifications/ }).count()) === 0);

/* A link to a message lands on the message, not the bottom of the channel. */
await page.goto(`${BASE}/hq/chat/search?q=invoice`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const hit = page.getByRole("link", { name: /invoice/i }).first();
const hitHref = (await hit.getAttribute("href")) ?? "";
check("Dead ends: a search result links to the message itself", /#m-/.test(hitHref) || /#/.test(hitHref), hitHref);
await hit.click();
await page.waitForURL(/\/hq\/chat\/[^/]+#/, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(700);
const anchor = hitHref.split("#")[1] ?? "";
check("Dead ends: the message is on screen and lit", anchor !== "" && (await page.locator(`#${anchor}`).count()) > 0 && (await page.locator(`#${anchor}`).evaluate((el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; })));

/* Stubs answer instead of being inert. */
await page.goto(`${BASE}/hq/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("button", { name: "Manage in Business OS" }).click();
await page.waitForTimeout(300);
check("Dead ends: Manage in Business OS says where people are managed", (await page.getByText("People are managed in the Business OS").count()) > 0);
await page.goto(`${BASE}/hq/chat/c-clients`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const cardOpen = page.getByRole("button", { name: "Open", exact: true }).first();
if ((await cardOpen.count()) > 0) {
  await cardOpen.click();
  await page.waitForTimeout(300);
}
check("Dead ends: a record from another module says so when opened", (await cardOpen.count()) === 0 || (await page.getByText(/lives in another module/).count()) > 0);

/* Messaging someone you have never messaged creates the conversation. */
const ctxP = await browser.newContext({ viewport: { width: 390, height: 780 } });
const pp = await ctxP.newPage();
await pp.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await pp.waitForTimeout(900);
const msgBtn = pp.getByRole("button", { name: "Message", exact: true }).last();
if ((await msgBtn.count()) > 0) {
  await msgBtn.click();
  await pp.waitForURL(/\/hq\/chat\//, { timeout: 30000 }).catch(() => {});
}
check("Dead ends: Message on the phone list always reaches a conversation", (await msgBtn.count()) === 0 || /\/hq\/chat\//.test(pp.url()), pp.url());
await ctxP.close();

/* ---------------------------------------- the walk-through: bugs and gaps */
/* Details takes precedence over an open thread, and gives it back on close. */
await page.goto(`${BASE}/hq/chat/c-design`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("button", { name: /3 replies/ }).click();
await page.waitForTimeout(400);
check("Walk-through: a thread opens from its reply count", (await page.getByRole("heading", { name: "Thread" }).count()) > 0);
check("Walk-through: a reply can also go to the channel", (await page.getByRole("checkbox", { name: /Also send to #design/ }).count()) > 0);
await page.getByRole("button", { name: "Details" }).click();
await page.waitForTimeout(400);
check("Walk-through: Details shows over an open thread", (await page.getByRole("complementary", { name: /Details for/ }).count()) > 0 && (await page.getByRole("heading", { name: "Thread" }).count()) === 0);
await page.getByRole("complementary", { name: /Details for/ }).getByRole("button", { name: "Close" }).click();
await page.waitForTimeout(400);
check("Walk-through: closing Details brings the thread back", (await page.getByRole("heading", { name: "Thread" }).count()) > 0);
/* A draft survives leaving and coming back. */
await page.getByRole("textbox", { name: "Message #design" }).fill("half a thought");
await page.getByRole("link", { name: /^#?general$|general/ }).first().click();
await page.waitForTimeout(600);
await page.getByRole("link", { name: /design/ }).first().click();
await page.waitForTimeout(600);
check("Walk-through: a draft survives a trip to another channel", (await page.getByRole("textbox", { name: "Message #design" }).inputValue()) === "half a thought");
await page.getByRole("textbox", { name: "Message #design" }).fill("");
check("Walk-through: the mention chip owns its @", (await page.getByRole("button", { name: "@Yousef El Fil" }).count()) > 0);

/* The office list groups by real room. */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("button", { name: "List" }).click();
await page.waitForTimeout(300);
check("Walk-through: desks are not a room in the list", (await page.getByRole("heading", { name: "At their desks" }).count()) > 0 && (await page.getByRole("heading", { name: "Room B" }).count()) > 0 && (await page.getByRole("heading", { name: "In rooms" }).count()) === 0);
/* A room wears its meeting. */
await page.getByRole("button", { name: "Floor" }).click();
await page.waitForTimeout(300);
check("Walk-through: a room shows the meeting in it now, or next", (await page.getByText(/until \d|Next: /).count()) > 0);

/* Search narrows by conversation, person, time and file. */
await page.goto(`${BASE}/hq/chat/search?q=invoice`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const before = await page.getByRole("link", { name: /invoice/i }).count();
await page.getByRole("combobox", { name: "In" }).selectOption({ label: "#design" });
await page.waitForTimeout(300);
const inDesign = await page.getByRole("link", { name: /invoice/i }).count();
check("Walk-through: search narrows to one conversation", inDesign > 0 && inDesign < before, `${inDesign} of ${before}`);
await page.getByRole("checkbox", { name: "Has a file" }).check();
await page.waitForTimeout(300);
check("Walk-through: search narrows to messages with a file", (await page.getByText(/invoice-template/).count()) > 0);
await page.getByRole("button", { name: "Clear" }).click();
await page.waitForTimeout(300);
check("Walk-through: Clear restores every result", (await page.getByRole("link", { name: /invoice/i }).count()) === before);

/* The schedule form is complete. */
await page.goto(`${BASE}/hq/meetings`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("button", { name: "Schedule" }).first().click();
await page.waitForTimeout(300);
check("Walk-through: scheduling asks for length, room and people", (await page.getByRole("radiogroup", { name: "Length" }).count()) > 0 && (await page.getByRole("combobox", { name: "Room" }).count()) > 0 && (await page.getByText("People", { exact: true }).count()) > 0);
await page.getByLabel("Title", { exact: true }).fill("Retainer renewal walk-through");
await page.getByRole("radiogroup", { name: "Length" }).getByRole("radio", { name: "60" }).click();
const roomA = await page.getByRole("combobox", { name: "Room" }).locator("option", { hasText: /^Room A/ }).first().getAttribute("value");
await page.getByRole("combobox", { name: "Room" }).selectOption(roomA ?? { index: 1 });
await page.getByRole("button", { name: /Sara/ }).click();
await page.getByLabel("What is it for?").fill("Agree the new rate before the renewal goes out.");
await page.getByRole("button", { name: "Schedule", exact: true }).last().click();
await page.waitForTimeout(600);
const newRow = page.locator("li").filter({ hasText: "Retainer renewal walk-through" }).first();
check("Walk-through: the meeting lists with its room and people", (await newRow.count()) > 0 && /Room A/.test((await newRow.textContent()) ?? ""), (await newRow.textContent())?.slice(0, 80) ?? "no row");
await newRow.getByRole("link", { name: /Retainer renewal walk-through/ }).click();
await page.waitForTimeout(800);
check("Walk-through: the detail carries the description and the invited person", (await page.getByText("Agree the new rate before the renewal goes out.").count()) > 0 && (await page.getByText("Sara Lindqvist").count()) > 0);

/* Members get a pre-join; the call has a speaker view and host controls; the whiteboard opens. */
const errorsBefore = errors.length;
await page.goto(`${BASE}/hq/meetings/mt-1/call`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
check("Walk-through: a member sees the pre-join first", (await page.getByRole("button", { name: "Join now" }).count()) > 0);
await page.getByRole("button", { name: "Join now" }).click();
await page.waitForTimeout(1500);
await page.getByRole("button", { name: "Speaker view" }).click();
await page.waitForTimeout(300);
check("Walk-through: speaker view is a real layout", (await page.getByRole("button", { name: "Grid view" }).count()) > 0);
await page.getByRole("button", { name: "People" }).click();
await page.waitForTimeout(300);
check("Walk-through: the host can mute the room", (await page.getByRole("button", { name: "Mute everyone" }).count()) > 0 && (await page.getByRole("button", { name: "Mute", exact: true }).count()) > 0);
await page.getByRole("button", { name: "Mute everyone" }).click();
await page.waitForTimeout(300);
check("Walk-through: a muted person is marked", (await page.getByText("muted", { exact: false }).count()) > 0);
await page.getByRole("button", { name: "Whiteboard" }).click();
await page.waitForTimeout(3500);
check("Walk-through: the whiteboard opens without an error", errors.length === errorsBefore && (await page.locator(".excalidraw").count()) > 0, errors.slice(errorsBefore).join(" | "));

/* From a task to the floor; from a profile to a conversation and to the transparency page. */
await page.goto(`${BASE}/tasks/t-4471`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
check("Walk-through: a task's assignee can be found on the floor", (await page.getByRole("link", { name: "Find on floor" }).count()) > 0);
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.locator('[data-user="u-jonas"], [data-user="u-felix"], [data-user="u-maya"]').first().click().catch(() => {});
await page.waitForTimeout(300);
if ((await page.getByRole("button", { name: "Profile" }).count()) > 0) {
  await page.getByRole("button", { name: "Profile" }).click();
  await page.waitForTimeout(300);
  check("Walk-through: a profile links to what HQ records", (await page.getByRole("link", { name: /What HQ records about people/ }).count()) > 0);
  await page.getByRole("dialog").getByRole("button", { name: "Message" }).click();
  await page.waitForURL(/\/hq\/chat\//, { timeout: 30000 }).catch(() => {});
  check("Walk-through: Message from a profile reaches a conversation for anyone", /\/hq\/chat\//.test(page.url()), page.url());
}

/* Insights: responsiveness, adoption and the personal export. */
await page.goto(`${BASE}/hq/insights`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
check("Walk-through: insights answer how fast mentions get a reply", (await page.getByText("Replies to mentions").count()) > 0 && (await page.getByText("Active members").count()) > 0 && (await page.getByText("Client visits").count()) > 0);
const [mineCsv] = await Promise.all([
  page.waitForEvent("download", { timeout: 5000 }).catch(() => null),
  page.getByRole("button", { name: "Export my time" }).click(),
]);
check("Walk-through: a person can export their own time", Boolean(mineCsv) && (mineCsv?.suggestedFilename() ?? "").startsWith("my-time"), mineCsv?.suggestedFilename() ?? "no download");

/* ------------------------------------------------- the screen inventory */
/* A thread on a phone is the whole screen, and Back returns to the messages. */
const ctxM = await browser.newContext({ viewport: { width: 390, height: 780 } });
const pm = await ctxM.newPage();
await pm.goto(`${BASE}/hq/chat/c-design`, { waitUntil: "networkidle" });
await pm.waitForTimeout(900);
await pm.getByRole("button", { name: /3 replies/ }).click();
await pm.waitForTimeout(500);
const threadBox = await pm.getByRole("heading", { name: "Thread" }).boundingBox();
check("Screens: a thread on a phone fills the screen", Boolean(threadBox) && (threadBox?.y ?? 99) < 60 && (await pm.getByRole("textbox", { name: "Reply in thread" }).isVisible()));
await pm.goBack();
await pm.waitForTimeout(500);
check("Screens: Back on a phone returns from the thread to the messages", (await pm.getByRole("heading", { name: "Thread" }).count()) === 0 && /c-design/.test(pm.url()));
await ctxM.close();

/* Activation: trial, activated, switched off, and back. */
await page.goto(`${BASE}/hq/activate`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await setRole("Owner");
check("Screens: activation opens on trial with days left", (await page.getByRole("heading", { name: "HQ is on trial" }).count()) > 0 && (await page.getByText(/days left/).count()) > 0);
await page.getByRole("button", { name: /^Activate on/ }).click();
await page.waitForTimeout(300);
check("Screens: activating moves the module to activated", (await page.getByRole("heading", { name: "HQ is activated" }).count()) > 0);
await page.getByRole("button", { name: /switch the module off/ }).click();
await page.waitForTimeout(300);
check("Screens: switched off says so and offers a trial", (await page.getByRole("heading", { name: /is not switched on/ }).count()) > 0 && (await page.getByRole("button", { name: "Start a 14-day trial" }).count()) > 0);
await page.getByRole("link", { name: /^Office/ }).click().catch(() => {});
await page.waitForTimeout(800);
check("Screens: a switched-off module keeps the shell on its entry point", /\/hq\/activate/.test(page.url()), page.url());
await page.getByRole("button", { name: "Start a 14-day trial" }).click();
await page.waitForTimeout(300);
check("Screens: the trial starts again from off", (await page.getByRole("heading", { name: "HQ is on trial" }).count()) > 0);
await page.goto(`${BASE}/hq/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
check("Screens: settings shows the plan and links to activation", (await page.getByRole("link", { name: "Plan and activation" }).count()) > 0);

/* Integrations: off, error, connecting, connected. */
check("Screens: Microsoft 365 needs attention and Google is not connected", (await page.getByText("Needs attention").count()) > 0 && (await page.getByRole("button", { name: "Connect" }).count()) > 0);
await page.getByRole("button", { name: "Reconnect" }).click();
await page.waitForTimeout(200);
check("Screens: reconnecting shows a connecting state", (await page.getByText("Connecting…").count()) > 0);
await page.waitForTimeout(900);
check("Screens: the calendar is connected as an account", (await page.getByText(/Connected as info@somion.org/).count()) > 0);
await page.getByRole("button", { name: "Disconnect" }).first().click();
await page.waitForTimeout(200);
check("Screens: a connected calendar can be disconnected", (await page.getByRole("button", { name: "Connect" }).count()) >= 2);

/* Email templates and the standalone board. */
await page.getByRole("link", { name: "Preview them" }).click();
await page.waitForTimeout(800);
check("Screens: the four emails render with subjects", (await page.getByText("Inés mentioned you in #design").count()) > 0 && (await page.getByText(/starts in 10 minutes/).count()) > 0);
await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "DE", exact: true }).click();
await page.waitForTimeout(300);
check("Screens: the pseudo-locale stretches the subjects", (await page.getByText("Inés mentioned you in #design", { exact: true }).count()) === 0);
await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "EN", exact: true }).click();
await page.goto(`${BASE}/hq/whiteboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(3500);
check("Screens: a whiteboard stands on its own", (await page.getByRole("heading", { name: "Whiteboard" }).count()) > 0 && (await page.locator(".excalidraw").count()) > 0);

/* Inside a room: the panel, the link states, and the room's chat. */
await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("button", { name: /^Room B,/ }).click();
await page.waitForTimeout(300);
check("Screens: entering a room says it is connecting", (await page.getByText("Connecting…").count()) > 0);
await page.waitForTimeout(1200);
const problem = (await page.getByText("Connection problem").count()) > 0;
check("Screens: the link ends connected, or says there is a problem and offers a retry", problem ? (await page.getByRole("button", { name: "Retry" }).count()) > 0 : (await page.getByText(/^\d+:\d\d$/).count()) > 0);
await page.getByRole("button", { name: "Room details" }).click();
await page.waitForTimeout(400);
const roomDlg = page.getByRole("dialog", { name: /Room B: inside the room/ });
check("Screens: the room panel lists who is inside with a volume each", (await roomDlg.getByText("Nadia Kovač").count()) > 0 && (await roomDlg.getByRole("slider", { name: /Volume of Nadia/ }).count()) > 0);
await roomDlg.getByRole("textbox", { name: "Message Room B" }).fill("Parking this here for tomorrow");
await roomDlg.getByRole("textbox", { name: "Message Room B" }).press("Enter");
await page.waitForTimeout(400);
check("Screens: a note left in the room stays in its chat", (await roomDlg.getByText("Parking this here for tomorrow").count()) > 0);
check("Screens: an admin can lock the room from inside", (await roomDlg.getByRole("button", { name: "Lock the room" }).count()) > 0);
await roomDlg.getByRole("button", { name: "Leave" }).click();
await page.waitForTimeout(400);
check("Screens: leaving from the panel leaves the room", (await page.getByRole("dialog", { name: /inside the room/ }).count()) === 0 && (await page.getByRole("button", { name: /^Room B,.*2 of 6/ }).count()) > 0);

/* The first-day floor, and someone else's screen share. */
await page.keyboard.press("Shift+E");
await page.waitForTimeout(500);
check("Screens: an empty office says you are the first one in", (await page.getByText("You are the first one in today").count()) > 0 && (await page.getByRole("link", { name: "Invite people" }).count()) > 0);
await page.keyboard.press("Shift+E");
await page.waitForTimeout(500);
check("Screens: pressing again brings everyone back", (await page.getByText("You are the first one in today").count()) === 0);
await page.goto(`${BASE}/hq/meetings/mt-1/call`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("button", { name: "Join now" }).click();
await page.waitForTimeout(1200);
await page.keyboard.press("Shift+P");
await page.waitForTimeout(500);
check("Screens: someone else's share fills the stage and is named", (await page.getByText("Lena Brunner is sharing their screen").count()) > 0);
await page.keyboard.press("Shift+P");
await page.waitForTimeout(400);
check("Screens: the share ends and the grid returns", (await page.getByText(/is sharing their screen/).count()) === 0);

/* A guest turned away at the lobby. */
await page.keyboard.press("Shift+G");
await page.waitForTimeout(600);
const decline = page.getByRole("button", { name: "Decline" });
check("Screens: the lobby offers Decline beside Admit", (await decline.count()) > 0);
await decline.first().click();
await page.waitForTimeout(400);
check("Screens: a declined guest leaves the lobby", (await page.getByText(/is waiting/).count()) === 0);
const ctxG = await browser.newContext({ viewport: { width: 1200, height: 800 } });
const pg = await ctxG.newPage();
await pg.goto(`${BASE}/guest/mt-1`, { waitUntil: "networkidle" });
await pg.waitForTimeout(900);
await pg.getByLabel("Your name").fill("Anna Baumgartner");
await pg.getByRole("button", { name: "Ask to join" }).click();
await pg.waitForTimeout(400);
check("Screens: the guest waits in the lobby", (await pg.getByText("Waiting for the host").count()) > 0);
await ctxG.close();

/* Links in messages get a card; an upload from the device attaches. */
await page.goto(`${BASE}/hq/chat/c-engineering`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
check("Screens: a URL in a message becomes a link and a card", (await page.getByRole("link", { name: /github\.com/ }).count()) > 0 && (await page.getByText("GitHub · github.com").count()) > 0);
await page.getByRole("button", { name: "Attach from File Manager" }).click();
await page.waitForTimeout(300);
await page.getByLabel("Upload from this device").setInputFiles({ name: "handover-notes.md", mimeType: "text/markdown", buffer: Buffer.from("# Notes") });
await page.waitForTimeout(300);
check("Screens: an upload from the device is attached", (await page.getByText("handover-notes.md").count()) > 0);

/* A weekly meeting is its next four weeks. */
await page.goto(`${BASE}/hq/meetings`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("button", { name: "Schedule" }).first().click();
await page.getByLabel("Title", { exact: true }).fill("Weekly retainer check");
await page.getByRole("checkbox", { name: /Repeats weekly/ }).check();
await page.getByRole("button", { name: "Schedule", exact: true }).last().click();
await page.waitForTimeout(600);
check("Screens: a weekly meeting lists four occurrences marked Weekly", (await page.locator("li").filter({ hasText: "Weekly retainer check" }).count()) === 4 && (await page.getByText("Weekly", { exact: true }).count()) >= 4);

await browser.close();

console.table(results);
const failed = results.filter((r) => r.result === "FAIL").length;
console.log(`${results.length - failed}/${results.length} passed`);
if (errors.length) console.log("page errors:", errors.slice(0, 3));
