// Prints the full hydration/console errors of one Files route as Mona (debug aid, not a gate).
//   node probe-hydration.mjs /my-files/<id>/<id> [locale] [--app sos]
import { createRequire } from "node:module";
import { signIn } from "./lib/session.mjs";
import { webUrl } from "./lib/suite.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const argv = process.argv.slice(2);
const appAt = argv.indexOf("--app");
const app = appAt > -1 ? argv.splice(appAt, 2)[1] : "files";
const [route = "/", locale = "en"] = argv;

const browser = await chromium.launch();
const base = await browser.newContext();
const signed = await signIn(base, app, "mona.adel@orgtik.test");
if (!signed.ok) throw new Error("sign-in failed");
const state = await base.storageState();
await base.close();
const context = await browser.newContext({ storageState: state });
const page = await context.newPage();
page.on("console", (m) => m.type() === "error" && console.log("CONSOLE:", m.text().slice(0, 3000)));
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(-2500)));
await page.goto(app === "files" ? `${webUrl(app)}/${locale}${route}` : `${webUrl(app)}${route}`, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
await page.waitForTimeout(3000);
await browser.close();
