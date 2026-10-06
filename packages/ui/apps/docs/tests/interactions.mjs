// Behaviour checks for the stories that move things: Board (keyboard, pointer, menu, rollback,
// RTL) and CalendarGrid (grid keys, month paging, first day of the week). Runs against the
// built Storybook, like check.mjs:
//
//   pnpm --filter docs build
//   node tests/interactions.mjs
//
// The stories record what the components called on window.__orgtik / window.__orgtikCalendar.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "storybook-static");
if (!fs.existsSync(path.join(root, "index.json"))) {
  console.error("No storybook-static/. Run `pnpm --filter docs build` first.");
  process.exit(2);
}
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png" };
const server = http
  .createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(req.url.split("?")[0]).replace(/^\/$/, "/index.html"));
    fs.readFile(file, (err, data) => (err ? res.writeHead(404).end() : res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" }).end(data)));
  })
  .listen(0);
const port = await new Promise((r) => server.on("listening", () => r(server.address().port)));
const browser = await chromium.launch();

async function open(story, { locale = "en", theme = "light", args = "" } = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://localhost:${port}/iframe.html?id=${story}&viewMode=story&globals=theme:${theme};locale:${locale}${args ? `&args=${args}` : ""}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  page.errors = errors;
  return page;
}

class Fail extends Error {}
const expect = (cond, message, detail) => {
  if (!cond) throw new Fail(message + (detail === undefined ? "" : `\n      got: ${JSON.stringify(detail)}`));
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Board helpers
const layout = (page) =>
  page.evaluate(() => Object.fromEntries([...document.querySelectorAll("[data-board-column]")].map((c) => [c.dataset.boardColumn, [...c.querySelectorAll("[data-board-item]")].map((i) => i.dataset.boardItem)])));
const moves = (page) => page.evaluate(() => window.__orgtik?.moves ?? []);
const liveText = (page) => page.evaluate(() => [...document.querySelectorAll('[id^="DndLiveRegion"]')].map((n) => n.textContent).join(" "));
const focusedLabel = (page) => page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
const key = async (page, k) => {
  await page.keyboard.press(k);
  await page.waitForTimeout(80);
};
const START = { todo: ["t1", "t2", "t3"], doing: ["t4", "t5"], review: ["t6"], done: ["t7", "t8"] };

// Calendar helpers
const focusedDate = (page) => page.evaluate(() => document.activeElement?.getAttribute("data-date"));
const calendarTitle = (page) => page.evaluate(() => document.querySelector("h2[aria-live]")?.textContent);

const tests = [
  ["Board: keyboard lift, move within and across columns, drop → onMove with column and neighbours", async () => {
    const page = await open("data-board--default");
    await page.focus('button[aria-label="Move Fix login on Safari"]');
    await key(page, "Space");
    expect((await liveText(page)).includes("Picked up Fix login on Safari. Column To do, position 1 of 3."), "pick-up announced with names", await liveText(page));
    await key(page, "ArrowDown");
    expect(same((await layout(page)).todo, ["t2", "t1", "t3"]), "ArrowDown moves one down", await layout(page));
    await key(page, "ArrowRight");
    expect(same((await layout(page)).doing, ["t4", "t1", "t5"]), "ArrowRight moves to the next column at the same position", await layout(page));
    expect((await liveText(page)).includes("Fix login on Safari: column In progress, position 2 of 3."), "move announced", await liveText(page));
    await key(page, "Space");
    await page.waitForTimeout(300);
    const m = await moves(page);
    expect(m.length === 1, "one onMove", m);
    expect(same(m[0], { itemId: "t1", fromColumnId: "todo", toColumnId: "doing", toIndex: 1, beforeId: "t5", afterId: "t4" }), "onMove has the column, index and neighbours", m[0]);
    expect(same(await layout(page), { todo: ["t2", "t3"], doing: ["t4", "t1", "t5"], review: ["t6"], done: ["t7", "t8"] }), "the card stays where it was dropped", await layout(page));
    expect((await liveText(page)).includes("Dropped Fix login on Safari in column In progress, position 2 of 3."), "drop announced", await liveText(page));
    expect((await focusedLabel(page)) === "Move Fix login on Safari", "focus stays on the card's handle", await focusedLabel(page));
    return page;
  }],
  ["Board: a realtime update during a drag keeps the drag; cards are not re-rendered on every move", async () => {
    const page = await open("data-board--default");
    await page.focus('button[aria-label="Move Fix login on Safari"]');
    await key(page, "Space");
    const before = await page.evaluate(() => window.__orgtik.renders);
    await key(page, "ArrowDown");
    await key(page, "ArrowDown");
    await key(page, "ArrowRight");
    await key(page, "ArrowUp");
    const renders = (await page.evaluate(() => window.__orgtik.renders)) - before;
    expect(renders <= 2, "four moves re-render at most the moved card's body (once per column change)", renders);
    await page.evaluate(() => window.__orgtik.inject({ id: "t9", columnId: "doing", title: "Hotfix from a teammate", assignee: "Mona Adel", due: "2026-10-01", priority: null }));
    await page.waitForTimeout(150);
    expect(same((await layout(page)).doing, ["t9", "t4", "t1", "t5"]), "the new card shows and the lifted card keeps its neighbours", await layout(page));
    await key(page, "ArrowUp");
    await key(page, "Space");
    await page.waitForTimeout(300);
    const m = await moves(page);
    expect(same(m[0], { itemId: "t1", fromColumnId: "todo", toColumnId: "doing", toIndex: 1, beforeId: "t4", afterId: "t9" }), "the drop counts the new card", m);
    return page;
  }],
  ["Board: Escape cancels and restores the original position", async () => {
    const page = await open("data-board--default");
    await page.focus('button[aria-label="Move Fix login on Safari"]');
    await key(page, "Space");
    await key(page, "ArrowRight");
    await key(page, "ArrowDown");
    expect(!(await layout(page)).todo.includes("t1"), "the card moved while lifted");
    await key(page, "Escape");
    expect(same(await layout(page), START), "back where it started", await layout(page));
    expect((await moves(page)).length === 0, "no onMove");
    expect((await liveText(page)).includes("Move cancelled. Fix login on Safari is back in column To do, position 1 of 3."), "cancel announced", await liveText(page));
    return page;
  }],
  ["Board: a rejected onMove puts the card back by itself", async () => {
    const page = await open("data-board--default", { args: "reject:!true" });
    await page.focus('button[aria-label="Move Fix login on Safari"]');
    await key(page, "Space");
    await key(page, "ArrowRight");
    await key(page, "Space");
    expect((await layout(page)).doing.includes("t1"), "the move shows at once (optimistic)", await layout(page));
    await page.waitForTimeout(500);
    expect((await moves(page)).length === 1, "onMove was called");
    expect(same(await layout(page), START), "rolled back after the rejection", await layout(page));
    return page;
  }],
  ["Board: in RTL, ArrowLeft goes to the next column and ArrowRight to the previous", async () => {
    const page = await open("data-board--default", { locale: "ar" });
    const handle = 'button[aria-label="نقل إصلاح تسجيل الدخول في سفاري"]';
    await page.focus(handle);
    await key(page, "Space");
    await key(page, "ArrowRight");
    expect((await layout(page)).todo.includes("t1"), "ArrowRight from the first column goes nowhere", await layout(page));
    await key(page, "ArrowLeft");
    await key(page, "ArrowLeft");
    expect((await layout(page)).review.includes("t1"), "two ArrowLefts reach the third column", await layout(page));
    await key(page, "ArrowRight");
    expect((await layout(page)).doing.includes("t1"), "ArrowRight comes back one column", await layout(page));
    await key(page, "Space");
    await page.waitForTimeout(300);
    const m = await moves(page);
    expect(m[0]?.toColumnId === "doing" && m[0]?.toIndex === 0 && m[0]?.beforeId === "t4" && m[0]?.afterId === null, "onMove to the second column, at the top", m);
    return page;
  }],
  ["Board: the Move to menu moves without dragging and keeps focus on the card", async () => {
    const page = await open("data-board--default");
    await page.click('button[aria-label="Move Fix login on Safari to…"]');
    await page.getByRole("menuitem", { name: "In review" }).click();
    await page.waitForTimeout(300);
    const m = await moves(page);
    expect(same(m[0], { itemId: "t1", fromColumnId: "todo", toColumnId: "review", toIndex: 1, beforeId: null, afterId: "t6" }), "onMove to the end of In review", m);
    expect(same((await layout(page)).review, ["t6", "t1"]), "the card is in In review", await layout(page));
    expect((await focusedLabel(page)) === "Move Fix login on Safari to…", "focus is back on the card's menu button", await focusedLabel(page));
    await page.click('button[aria-label="Move Write the pricing page copy to…"]');
    await page.getByRole("menuitem", { name: "To the bottom" }).click();
    await page.waitForTimeout(300);
    expect(same((await layout(page)).todo, ["t3", "t2"]), "To the bottom", await layout(page));
    return page;
  }],
  ["Board: pointer drag to another column; a click opens the card", async () => {
    const page = await open("data-board--default");
    const card = await page.locator('[data-board-item="t2"]').boundingBox();
    const target = await page.locator('[data-board-column="review"]').boundingBox();
    await page.mouse.move(card.x + card.width / 2, card.y + 20);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(card.x + card.width / 2 + ((target.x + target.width / 2 - card.x - card.width / 2) * i) / 12, card.y + 20 + ((target.y + target.height - 10 - card.y - 20) * i) / 12);
    await page.waitForTimeout(100);
    await page.mouse.up();
    await page.waitForTimeout(300);
    const m = await moves(page);
    expect(m[0]?.itemId === "t2" && m[0]?.toColumnId === "review" && m[0]?.afterId === "t6", "onMove to In review, after its card", m);
    await page.click('[data-board-item="t4"] button[data-board-part="open"]');
    expect(same(await page.evaluate(() => window.__orgtik.opened), ["t4"]), "onOpen with the card");
    return page;
  }],
  ["CalendarGrid: grid keys move focus and the month; en starts on Monday", async () => {
    const page = await open("data-calendargrid--month");
    expect((await page.getAttribute("table[role=grid] thead th:first-child", "data-weekday")) === "1", "en (en-GB) weeks start on Monday");
    await page.click('[data-date="2026-10-14"]', { position: { x: 12, y: 100 } });
    expect((await focusedDate(page)) === "2026-10-14", "a click focuses the day", await focusedDate(page));
    await key(page, "ArrowRight");
    expect((await focusedDate(page)) === "2026-10-15", "ArrowRight: next day", await focusedDate(page));
    await key(page, "ArrowDown");
    expect((await focusedDate(page)) === "2026-10-22", "ArrowDown: next week", await focusedDate(page));
    await key(page, "Home");
    expect((await focusedDate(page)) === "2026-10-19", "Home: start of the week", await focusedDate(page));
    await key(page, "End");
    expect((await focusedDate(page)) === "2026-10-25", "End: end of the week", await focusedDate(page));
    await key(page, "PageDown");
    expect((await calendarTitle(page)) === "November 2026" && (await focusedDate(page)) === "2026-11-25", "PageDown: next month, same day", [await calendarTitle(page), await focusedDate(page)]);
    await key(page, "Shift+PageUp");
    expect((await calendarTitle(page)) === "November 2025" && (await focusedDate(page)) === "2025-11-25", "Shift+PageUp: previous year", [await calendarTitle(page), await focusedDate(page)]);
    await key(page, "Enter");
    expect((await page.evaluate(() => window.__orgtikCalendar.selected)).at(-1) === "2025-11-25", "Enter selects the day");
    await page.click('button[aria-label="Next month"]');
    expect((await calendarTitle(page)) === "December 2025", "the header's next button");
    return page;
  }],
  ["CalendarGrid: ar starts on Saturday and mirrors ArrowLeft/ArrowRight", async () => {
    const page = await open("data-calendargrid--month", { locale: "ar" });
    expect((await page.getAttribute("table[role=grid] thead th:first-child", "data-weekday")) === "6", "ar weeks start on Saturday");
    expect((await page.getAttribute('[data-date="2026-10-14"]', "aria-current")) === "date", "today is marked");
    await page.click('[data-date="2026-10-14"]', { position: { x: 12, y: 100 } });
    await key(page, "ArrowLeft");
    expect((await focusedDate(page)) === "2026-10-15", "ArrowLeft in RTL: next day", await focusedDate(page));
    await key(page, "ArrowRight");
    await key(page, "ArrowRight");
    expect((await focusedDate(page)) === "2026-10-13", "ArrowRight in RTL: previous day", await focusedDate(page));
    return page;
  }],
  ["CalendarGrid: +N more lists every event of the day; a chip opens its event", async () => {
    const page = await open("data-calendargrid--many-events");
    await page.getByRole("button", { name: "+5 more" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    expect((await dialog.getByRole("button").count()) === 8, "all 8 events of the day", await dialog.getByRole("button").count());
    await dialog.getByRole("button").first().click();
    expect((await page.evaluate(() => window.__orgtikCalendar.opened)).length === 1, "onOpenEvent");
    return page;
  }],
];

let failed = 0;
for (const [name, run] of tests) {
  let page;
  try {
    page = await run();
    if (page.errors.length) throw new Fail("page errors: " + page.errors.join("; "));
    console.log(`  ok    ${name}`);
  } catch (error) {
    failed++;
    console.log(`  FAIL  ${name}\n      ${error instanceof Fail ? error.message : error.stack}`);
  } finally {
    await page?.context().close();
  }
}
await browser.close();
server.close();
console.log(`\n${tests.length - failed} of ${tests.length} interaction checks passed.`);
process.exit(failed ? 1 : 0);
