// Lists the form controls of a signed-out SOS page with their accessible names (debug aid).
import { createRequire } from "node:module";
import { webUrl } from "./lib/suite.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
await page.goto(webUrl("sos") + process.argv[2], { waitUntil: "networkidle" });
const snap = await page.locator("form").first().ariaSnapshot();
console.log(snap);
console.log(await page.evaluate(() => [...document.querySelectorAll("input")].map((i) => `${i.type} id=${i.id} labels=${[...(i.labels || [])].map((l) => l.textContent).join("|")} aria-labelledby=${i.getAttribute("aria-labelledby")}`).join("\n")));
await browser.close();
