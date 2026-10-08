const path = require("node:path");
const { chromium } = require("C:/Users/yosse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const response = await fetch("http://localhost:6307/v2/public/entries/page");
    const badge = (await response.json()).data.find(row => row.id === "pg_partners").locales.en.intro.badge;
    await page.goto("http://localhost:4197/legal/partners");
    await page.getByText(badge, { exact: true }).waitFor();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(__dirname, "partners-published-website-mobile-en.png") });
    console.log("Mobile publication captured at its initial viewport.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
