// VS-1, walked end to end in the browser, the way a person does it:
//   sign in on SOS (the new @orgtik/ui form) → SOS home → the launcher's Files tile →
//   Files' hand-off → the new suite shell → My files → the Files list.
// Plus the two things the sign-in rebuild changed: ?redirect= is honoured for a path on SOS, and
// refused for another site (no open redirect).
//
//   node flows/vs1.mjs      (SOS on :3013, Files on :3002 and the local-dev mock running)
//
// Writes audits/files/flows/vs1/NN-<step>.png and audits/files/flows/vs1.json. The password
// comes from local-dev (test identities only) and is never written anywhere.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AUDITS, PASSWORD, webUrl } from "../lib/suite.mjs";
import { settle, watch } from "../lib/checks.mjs";

const OUT = path.join(AUDITS, "files", "flows", "vs1");
const SOS = webUrl("sos");
const FILES = webUrl("files");
const AS = "mona.adel@orgtik.test";
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const results = [];

async function run(title, locale, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: "NEXT_LOCALE", value: locale, url: SOS }]);
  const page = await ctx.newPage();
  const log = watch(page);
  const steps = [];
  let n = 0;
  const step = async (name, action, check) => {
    n++;
    let ok = true;
    let note = "";
    try {
      await action();
      await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
      const r = await check();
      ok = r === true || (r && r.ok);
      note = typeof r === "object" && r ? r.note ?? "" : "";
    } catch (e) {
      ok = false;
      note = String(e.message || e).split("\n")[0].slice(0, 200);
    }
    await settle(page);
    const file = `${String(results.length + 1)}${String(n).padStart(2, "0")}-${name}.png`;
    await page.screenshot({ path: path.join(OUT, file) }).catch(() => {});
    // Addresses are recorded without their query: a hand-off URL carries a token.
    steps.push({ step: n, name, ok, note, at: page.url().split("?")[0], shot: file });
  };
  await fn(page, step);
  results.push({ title, locale, passed: steps.filter((s) => s.ok).length, steps: steps.length, ok: steps.every((s) => s.ok), steps_detail: steps, console: log.console.length, consoleSample: log.console.slice(0, 3), uncaught: log.page.length });
  await ctx.close();
}

const signInWith = async (page, email, password) => {
  await page.getByRole("textbox", { name: /email|البريد|e-mail/i }).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /^(sign in|تسجيل الدخول|anmelden|se connecter|accedi)$/i }).click();
};

for (const locale of ["en", "ar"]) {
  await run(`Sign in on SOS → launcher → Files shell → the Files list (${locale})`, locale, async (page, step) => {
    await step(
      "sos-sign-in-page",
      () => page.goto(`${SOS}/auth/login`, { waitUntil: "networkidle" }),
      async () => {
        const lang = await page.evaluate(() => document.documentElement.lang);
        return { ok: lang === locale && (await page.locator('input[type="password"]').count()) === 1, note: `lang=${lang}` };
      },
    );
    await step(
      "wrong-password-says-so",
      () => signInWith(page, AS, "not-the-password"),
      async () => {
        // Scoped to the form: Next's route announcer is also role=alert.
        const alert = page.locator("form [role=alert]");
        await alert.waitFor({ timeout: 8000 });
        const text = (await alert.innerText()).trim();
        // The mock's message is English; the page must speak the person's language.
        return { ok: locale === "en" ? /match/.test(text) : /[؀-ۿ]/.test(text), note: text.slice(0, 80) };
      },
    );
    await step(
      "sign-in",
      () => signInWith(page, AS, PASSWORD),
      async () => {
        await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 20000 });
        return { ok: true, note: new URL(page.url()).pathname };
      },
    );
    let filesHref = null;
    await step(
      "launcher-has-files",
      async () => {
        await page.waitForTimeout(1500);
        filesHref = await page.evaluate((origin) => [...document.querySelectorAll("a[href]")].map((a) => a.href).find((h) => h.startsWith(origin)) ?? null, FILES);
      },
      async () => ({ ok: Boolean(filesHref), note: filesHref ? "a Files tile links to " + filesHref.split("?")[0] : "no Files link on SOS home" }),
    );
    await step(
      "open-files",
      () => page.goto(filesHref, { waitUntil: "load" }),
      async () => {
        await page.waitForURL((u) => !/\/auth\/?$/.test(u.pathname), { timeout: 30000 });
        await page.locator("#ot-main").waitFor({ timeout: 20000 });
        const rail = await page.getByRole("navigation", { name: /apps|التطبيقات/i }).count();
        const lang = await page.evaluate(() => document.documentElement.lang);
        // The hand-off must keep the language the person signed in with.
        return { ok: rail === 1 && lang === locale, note: `landed ${new URL(page.url()).pathname} (lang=${lang}), suite rail ${rail ? "present" : "missing"}` };
      },
    );
    await step(
      "my-files",
      () => page.getByRole("navigation", { name: /main navigation|التنقل الرئيسي/i }).getByRole("link", { name: /my files|ملفاتي/i }).click(),
      async () => {
        await page.getByRole("table").waitFor({ timeout: 20000 });
        const rows = await page.getByRole("table").locator("tbody tr").count();
        const current = await page.locator('[aria-current="page"]').first().innerText().catch(() => "");
        return { ok: rows > 0, note: `${rows} rows; current nav item: ${current.trim()}` };
      },
    );
  });
}

// The redirect after sign-in: a path on SOS is followed; another site is not (open redirect).
for (const [name, target, expectPath] of [
  ["redirect-to-sos-path", "/people", "/people"],
  ["redirect-to-other-site-refused", "https://example.com/phish", "/"],
  ["redirect-protocol-relative-refused", "//example.com/phish", "/"],
]) {
  await run(`?redirect=${target} after sign-in`, "en", async (page, step) => {
    await step(
      name,
      async () => {
        await page.goto(`${SOS}/auth/login?redirect=${encodeURIComponent(target)}`, { waitUntil: "networkidle" });
        await signInWith(page, AS, PASSWORD);
        await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 20000 });
      },
      async () => {
        const u = new URL(page.url());
        return { ok: u.origin === SOS && u.pathname === expectPath, note: `landed ${u.origin}${u.pathname}` };
      },
    );
  });
}

await browser.close();
fs.writeFileSync(path.join(AUDITS, "files", "flows", "vs1.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.passed}/${r.steps}  ${r.title}  (console ${r.console}, uncaught ${r.uncaught})`);
  for (const s of r.steps_detail) if (!s.ok || process.argv.includes("--verbose")) console.log(`   ${s.ok ? "ok " : "NO "} ${s.name}: ${s.note}`);
}
process.exit(results.every((r) => r.ok) ? 0 : 1);
