// VS-1 evidence: the Files pilot's "My files" page (suite shell + folders + the Files list, all on
// @orgtik/ui) in 5 languages × 2 themes × 2 widths, signed in as Mona.
//
//   node vs1.mjs [--route /my-files] [--label vs1]
//   node vs1.mjs --app sos --route /auth/login --signed-out --label vs1-sos-login
// Files carries the language in the path (/ar/my-files); SOS keeps its URLs and reads the
// NEXT_LOCALE cookie (VS-1), so the check sets that cookie instead.
//
// For every combination it records a full-page screenshot and:
//   - axe critical/serious on the parts VS-1 owns (the shell and the main content)
//   - console errors and uncaught exceptions
//   - page overflow (document wider than the viewport)
//   - the language and direction the page actually has (lang, dir, data-theme)
//   - visible Latin-only text in a non-English page: English left behind in the UI
//   - images that loaded with nothing to show (a wrong address)
// Output: audits/files/vs1/<label>.{json,md} and shots/ (git-ignored).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { signIn } from "./lib/session.mjs";
import { axe, settle, watch } from "./lib/checks.mjs";
import { webUrl, APPS } from "./lib/suite.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const route = opt("--route", "/my-files");
const label = opt("--label", "vs1");
const app = opt("--app", "files");
const signedOut = args.includes("--signed-out");
const out = path.resolve(here, "..", "..", "audits", app, "vs1");
fs.mkdirSync(path.join(out, "shots"), { recursive: true });

const LOCALES = ["en", "ar", "de", "fr", "it"];
const THEMES = ["light", "dark"];
const WIDTHS = [{ w: 390, h: 844 }, { w: 1440, h: 900 }];
const EMAIL = "mona.adel@orgtik.test";

const browser = await chromium.launch();
let state;
if (!signedOut) {
  const base = await browser.newContext();
  const signed = await signIn(base, app, EMAIL);
  if (!signed.ok) throw new Error(`sign-in failed: landed on ${signed.landed}`);
  state = await base.storageState();
  await base.close();
}
// Files and the Website Manager carry the language in the path; SOS reads a cookie.
// Apps with locale: false (SOS, Chats) keep their addresses and read the NEXT_LOCALE cookie.
const cookieLocale = APPS[app]?.locale === false;
const urlFor = (locale) => (cookieLocale ? `${webUrl(app)}${route}` : `${webUrl(app)}/${locale}${route === "/" ? "" : route}`);

const rows = [];
for (const locale of LOCALES)
  for (const theme of THEMES)
    for (const { w, h } of WIDTHS) {
      const context = await browser.newContext({ viewport: { width: w, height: h }, storageState: state, reducedMotion: "reduce" });
      await context.addCookies([
        { name: "ot-theme", value: theme, url: webUrl(app) },
        ...(cookieLocale ? [{ name: "NEXT_LOCALE", value: locale, url: webUrl(app) }] : []),
      ]);
      const page = await context.newPage();
      const log = watch(page);
      await page.goto(urlFor(locale), { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
      // The lists load in the browser; wait for their placeholders to go.
      await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"), null, { timeout: 20000 }).catch(() => {});
      await settle(page);
      const facts = await page.evaluate(() => {
        const html = document.documentElement;
        const main = document.querySelector("#ot-main") ?? document.querySelector("main");
        // Visible text runs with no Arabic letter, in a page that should be Arabic, excluding
        // user content (file and folder names, people's names: marked dir=auto or inside links to items).
        const latin = [];
        if (html.lang === "ar") {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const t = n.textContent.trim();
            const el = n.parentElement;
            // ISO currency codes are how Intl writes money in Arabic too ("‏39.00 CHF"), not English.
            if (!t || !/[A-Za-z]{3}/.test(t.replace(/\b(?:CHF|EUR|USD|GBP|SAR|AED|KWD|EGP)\b/g, "")) || /[؀-ۿ]/.test(t)) continue;
            // User content (names, file names) is marked dir=auto or <bdi>: it stays as people wrote it.
            if (el.closest("[dir=auto],[dir=ltr],bdi,nextjs-portal,script,style,code,kbd,title")) continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            latin.push(t.slice(0, 40));
          }
        }
        return {
          lang: html.lang,
          dir: html.dir,
          theme: html.getAttribute("data-theme"),
          overflow: html.scrollWidth - html.clientWidth,
          mainOverflow: main ? main.scrollWidth - main.clientWidth : null,
          latin: [...new Set(latin)].slice(0, 12),
          // Images that finished loading with nothing to show: a wrong address.
          brokenImages: [...document.images].filter((i) => i.getAttribute("src") && i.complete && i.naturalWidth === 0).map((i) => i.getAttribute("src").split("/").pop()),
        };
      });
      const a = await axe(page);
      const name = `${label}_${locale}-${theme}-${w}`;
      await page.screenshot({ path: path.join(out, "shots", `${name}.png`), fullPage: true });
      rows.push({
        locale,
        theme,
        width: w,
        ...facts,
        critical: a.critical,
        serious: a.serious,
        rules: a.violations.filter((v) => v.impact === "critical" || v.impact === "serious").map((v) => `${v.id}(${v.nodes})`),
        console: log.console.length,
        uncaught: log.page.length,
        api: log.api.length,
        firstError: log.page[0] || log.console[0] || null,
      });
      await context.close();
      process.stdout.write(".");
    }
await browser.close();

const bad = (r) =>
  r.critical || r.serious || r.console || r.uncaught || r.overflow > 0 || String(r.lang).split("-")[0] !== r.locale || r.dir !== (r.locale === "ar" ? "rtl" : "ltr") || r.theme !== r.theme || r.latin.length || r.brokenImages.length;
const md = [
  `# VS-1 check: \`${route}\``,
  "",
  `${rows.length} renders (5 languages × 2 themes × 390/1440) of ${app}, ${signedOut ? "signed out" : `signed in as ${EMAIL}`}. Generated by \`tools/audit-kit/vs1.mjs\`.`,
  "",
  "| Language | Theme | Width | lang/dir | axe crit/serious | Console | Uncaught | Overflow | English left | Broken images |",
  "|---|---|---|---|---|---|---|---|---|---|",
  ...rows.map(
    (r) =>
      `| ${r.locale} | ${r.theme} | ${r.width} | ${r.lang}/${r.dir} | ${r.critical}/${r.serious}${r.rules.length ? " " + r.rules.join(" ") : ""} | ${r.console} | ${r.uncaught} | ${r.overflow} | ${r.latin.length ? r.latin.join(" · ") : "—"} | ${r.brokenImages.length ? [...new Set(r.brokenImages)].join(" · ") : "—"} |`,
  ),
  "",
  `Clean renders: ${rows.filter((r) => !bad(r)).length} of ${rows.length}.`,
  rows.some((r) => r.firstError) ? "\n## First errors\n\n" + rows.filter((r) => r.firstError).map((r) => `- ${r.locale}-${r.theme}-${r.width}: ${r.firstError}`).join("\n") : "",
].join("\n");
fs.writeFileSync(path.join(out, `${label}.json`), JSON.stringify(rows, null, 2) + "\n");
fs.writeFileSync(path.join(out, `${label}.md`), md + "\n");
console.log("\n" + md);
