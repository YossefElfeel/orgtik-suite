// Screenshots of a smoke page in EN/AR × light/dark.
//   node shots.mjs            -> the buttons page, shot-<locale>-<theme>.png
//   node shots.mjs forms      -> the forms page, after pressing Save (errors) and with the Select open
import { createRequire } from "node:module";
const require = createRequire("C:/Users/yosse/Projects/New sass/orgtik-program/tools/qa/package.json");
const { chromium } = require("playwright");

const route = process.argv[2] ?? "";
const browser = await chromium.launch();
const errors = [];
for (const locale of ["en", "ar"]) for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: route ? 900 : 560 }, reducedMotion: "reduce" });
  await ctx.addCookies([{ name: "ot-theme", value: theme, url: "http://localhost:3215" }]);
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`${locale}/${theme}: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`${locale}/${theme}: ${e.message}`));
  await page.goto(`http://localhost:3215/${locale}/${route}`, { waitUntil: "networkidle" });
  const name = `shot-${route || "buttons"}-${locale}-${theme}`;
  if (route === "forms") {
    await page.getByRole("button", { name: /save|حفظ/i }).click();
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${name}.png`, fullPage: true });
    await page.getByRole("combobox").first().click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${name}-select.png` });
  } else if (route === "overlays") {
    const shot = async (label) => {
      await page.waitForTimeout(350);
      await page.screenshot({ path: `${name}-${label}.png` });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    };
    const btn = (re) => page.getByRole("button", { name: re }).first();
    await btn(/rename folder|إعادة تسمية/i).click();
    await shot("dialog");
    await btn(/delete folder|حذف المجلد/i).click();
    await page.waitForTimeout(200);
    await page.getByRole("checkbox").click();
    await page.getByRole("alertdialog").getByRole("button", { name: /delete folder|حذف المجلد/i }).click();
    await page.waitForTimeout(700); // the mock rejects after 400ms
    await shot("confirm-failed");
    await btn(/open details|عرض التفاصيل/i).click();
    await shot("sheet");
    await btn(/more actions|إجراءات أخرى/i).click();
    await page.getByRole("menuitem", { name: /move to|نقل إلى/i }).hover();
    await shot("menu");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await btn(/^filters$|عوامل التصفية/i).click();
    await shot("popover");
    await page.getByRole("button", { name: /copy link|نسخ الرابط/i }).focus();
    await shot("tooltip");
  } else if (route === "display") {
    await page.getByRole("button", { name: /show success|عرض رسالة نجاح/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${name}.png`, fullPage: true });
  } else if (route === "shell") {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole("checkbox").nth(2).click();
    await page.getByRole("checkbox").nth(3).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${name}.png` });
    await page.getByRole("button", { name: /account|الحساب/i }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${name}-usermenu.png` });
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 390, height: 780 });
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /open navigation|فتح قائمة التنقل/i }).click();
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${name}-mobile-nav.png` });
  } else {
    await page.screenshot({ path: `${name}.png` });
  }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors");
