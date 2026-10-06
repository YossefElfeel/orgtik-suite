// S5 (D-036): the mirrored set for the owner's review. Every route, opened at its Arabic address
// (/ar/…), right to left, with today's English words (D-037: no translations yet), captured with the
// same steady clock and settling as the parity harness. Also checks each page really is ar/rtl and
// has no horizontal overflow.
//
//   node mirror-review.mjs [--widths 1440,390] [--locale ar]
//   -> audits/website/mirror/<locale>/<slug>__<width>.png and report.md
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { OUT, args, load, newContext, readRoutes, slug, siteCommit } from "./lib/site.mjs";

const opts = args({ widths: "1440,390", locale: "ar" });
const widths = String(opts.widths).split(",").map(Number);
const locale = opts.locale;
const dir = path.join(OUT, "mirror", locale);
fs.mkdirSync(dir, { recursive: true });
const routes = readRoutes().filter((r) => r !== "/audit-missing-page");
const browser = await chromium.launch();
const rows = [];
for (const width of widths) {
  for (const route of routes) {
    const context = await newContext(browser, width);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).split("\n")[0]));
    const address = `/${locale}${route === "/" ? "" : route}`;
    try {
      await load(page, address);
      const facts = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
        overflow: document.documentElement.scrollWidth - innerWidth,
        notFound: Boolean(document.querySelector(".not-found")),
      }));
      await page.screenshot({ path: path.join(dir, `${slug(route)}__${width}.png`), fullPage: true, animations: "disabled", caret: "hide" });
      rows.push({ route, width, ...facts, errors: errors.length });
    } catch (e) {
      rows.push({ route, width, failed: String(e.message).split("\n")[0] });
    } finally {
      await context.close();
    }
  }
}
await browser.close();
const bad = rows.filter((r) => r.failed || r.lang !== locale || r.dir !== (locale === "ar" ? "rtl" : "ltr") || r.overflow > 1 || r.notFound || r.errors);
const md = [
  `# Mirrored review: /${locale}/… (S5, D-036)`,
  "",
  `Site commit ${siteCommit().head}. ${rows.length} captures (${routes.length} routes × ${widths.join(", ")}), right to left with the English words (no translations yet, D-037).`,
  "",
  bad.length ? `**${bad.length} need a look:**` : "**All pages are ar/rtl, render, have no horizontal overflow and no errors.**",
  "",
  ...bad.map((r) => `- \`${r.route}\` at ${r.width}: ${r.failed ?? `lang ${r.lang}, dir ${r.dir}, overflow ${r.overflow}px${r.notFound ? ", not found" : ""}${r.errors ? `, ${r.errors} errors` : ""}`}`),
  "",
].join("\n");
fs.writeFileSync(path.join(dir, "report.md"), md);
console.log(md.split("\n").slice(0, 12).join("\n"));
