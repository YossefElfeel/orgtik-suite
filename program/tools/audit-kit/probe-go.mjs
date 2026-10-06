// Traces /go/<app> as Mona: requests, responses and console (debug aid).
import { createRequire } from "node:module";
import { signIn } from "./lib/session.mjs";
import { webUrl } from "./lib/suite.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const browser = await chromium.launch();
const ctx = await browser.newContext();
await signIn(ctx, "sos", "mona.adel@orgtik.test");
const page = await ctx.newPage();
page.on("console", (m) => console.log("CONSOLE", m.type(), m.text().slice(0, 200)));
page.on("pageerror", (e) => console.log("PAGEERROR", String(e).slice(0, 300)));
page.on("response", (r) => /handoff|my-scopes|auth/.test(r.url()) && console.log("RESP", r.status(), r.url().replace(/token=[^&]+/, "token=…").replace(/code=[^&]+/, "code=…")));
page.on("framenavigated", (f) => f === page.mainFrame() && console.log("NAV", f.url().replace(/token=[^&]+/, "token=…").replace(/code=[^&]+/, "code=…")));
await page.goto(webUrl("sos") + "/go/file_manager", { waitUntil: "load" });
await page.waitForTimeout(12000);
console.log("FINAL", page.url().replace(/code=[^&]+/, "code=…"));
await browser.close();
