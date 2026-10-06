// A signed-out screenshot of an SOS page (auth flows), for a quick look.
//   node shot-out.mjs /auth/forgot-password ar light out.png
import { createRequire } from "node:module";
import { webUrl } from "./lib/suite.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const [route, locale = "en", theme = "light", out = "out.png", storage] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await ctx.addCookies([{ name: "NEXT_LOCALE", value: locale, url: webUrl("sos") }, { name: "ot-theme", value: theme, url: webUrl("sos") }]);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).split("\n")[0]));
if (storage) await page.addInitScript(([k, v]) => sessionStorage.setItem(k, v), storage.split("="));
await page.goto(webUrl("sos") + route, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
await page.waitForTimeout(1200);
await page.screenshot({ path: out });
console.log(out, errors.join(" | "));
await browser.close();
