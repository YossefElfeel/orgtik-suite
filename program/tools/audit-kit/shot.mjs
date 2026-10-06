// One screenshot of one route as Mona, for a quick look while building (not a gate).
//   node shot.mjs --app sos --route /people [--locale ar] [--theme dark] [--width 1440] [--out file.png]
import path from "node:path";
import { createRequire } from "node:module";
import { signIn } from "./lib/session.mjs";
import { APPS, AUDITS, webUrl } from "./lib/suite.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : d;
};
const app = arg("--app", "sos");
const route = arg("--route", "/");
const locale = arg("--locale", "en");
const theme = arg("--theme", "light");
const width = Number(arg("--width", "1440"));
const out = arg("--out", path.join(AUDITS, app, "shots", `look${route.replace(/\W+/g, "_")}_${locale}_${theme}_${width}.png`));
const as = arg("--as", "mona.adel@orgtik.test");

const browser = await chromium.launch();
const base = await browser.newContext();
if (!(await signIn(base, app, as)).ok) throw new Error("sign-in failed");
const state = await base.storageState();
await base.close();
const ctx = await browser.newContext({ viewport: { width, height: 900 }, storageState: state, reducedMotion: "reduce" });
await ctx.addCookies([
  { name: "ot-theme", value: theme, url: webUrl(app) },
  { name: "NEXT_LOCALE", value: locale, url: webUrl(app) },
]);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).split("\n")[0]));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().split("\n")[0]));
// Apps with locale: false (SOS, Chats) keep their addresses and read the NEXT_LOCALE cookie.
const url = APPS[app]?.locale === false ? `${webUrl(app)}${route}` : `${webUrl(app)}/${locale}${route === "/" ? "" : route}`;
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.screenshot({ path: out });
console.log(out);
for (const e of errors.slice(0, 8)) console.log("ERROR:", e.slice(0, 300));
await browser.close();
