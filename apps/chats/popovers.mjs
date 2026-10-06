/**
 * SOMION HQ - POPOVER VISIBILITY
 *
 * Counting `role=dialog` in the DOM proved nothing: the top bar clipped every
 * dropdown for weeks while that count kept passing. This checks what a person
 * checks - that the panel is inside the viewport and is the thing under the
 * pointer at its own centre - at a comfortable window and a short one.
 *
 * Run against the dev server: node popovers.mjs
 */

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const results = [];

const browser = await chromium.launch();

const check = async (page, label, locator) => {
  const box = await locator.boundingBox();
  const vp = page.viewportSize();
  if (!box) {
    results.push({ viewport: `${vp.width}x${vp.height}`, popover: label, result: "FAIL", detail: "no box" });
    return;
  }
  const inside =
    box.x >= 0 && box.y >= 0 && box.x + box.width <= vp.width + 1 && box.y + box.height <= vp.height + 1;
  const onTop = await page.evaluate(
    ({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return Boolean(el && el.closest("[role=dialog],[role=listbox]"));
    },
    { x: box.x + box.width / 2, y: box.y + Math.min(box.height / 2, 60) },
  );
  results.push({
    viewport: `${vp.width}x${vp.height}`,
    popover: label,
    result: inside && onTop ? "pass" : "FAIL",
    detail: `${Math.round(box.width)}x${Math.round(box.height)} at ${Math.round(box.x)},${Math.round(box.y)}${inside ? "" : " · outside"}${onTop ? "" : " · covered"}`,
  });
};

for (const [w, h] of [
  [1560, 1000],
  [1200, 560],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${BASE}/hq/office`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1300);

  await page.getByRole("button", { name: /^Available/ }).click();
  await page.waitForTimeout(350);
  await check(page, "Status picker", page.getByRole("dialog", { name: /Set your status/ }));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  await page.getByRole("button", { name: /Notifications/ }).click();
  await page.waitForTimeout(350);
  await check(page, "Notifications", page.getByRole("dialog").first());
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  await page.getByRole("button", { name: /Admin/ }).first().click();
  await page.waitForTimeout(350);
  await check(page, "Role switcher", page.getByRole("dialog", { name: /Switch role/ }));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  const search = page.getByLabel(/Search messages/).first();
  await search.click();
  await search.type("inv", { delay: 30 });
  await page.waitForTimeout(400);
  await check(page, "Search results", page.getByRole("listbox"));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  /* Omar sits low on the floor: the menu has to flip above him or scroll. */
  await page.locator('[data-user="u-omar"]').click();
  await page.waitForTimeout(700);
  await check(page, "Person menu (Omar, low on the floor)", page.getByRole("dialog", { name: /Actions for Omar/ }));
  if (h === 560) await page.screenshot({ path: ".shots/menu-short.png" });
  await page.keyboard.press("Escape");

  await page.close();
}

await browser.close();

console.table(results);
const failed = results.filter((r) => r.result === "FAIL").length;
console.log(failed ? `${failed} popover(s) not fully visible` : "Every popover is visible where it opens.");
