// Reviewed references use the owner's Cairo environment. Browser defaults inherit the runner's
// UTC zone and system locale, which must not change an instant's wall time in visual checks.
export const VISUAL_ENVIRONMENT = Object.freeze({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
  locale: "en-US",
  timezoneId: "Africa/Cairo",
  fixedTime: "2026-10-07T09:00:00.000Z",
});

export async function createVisualPage(browser) {
  const { fixedTime, ...options } = VISUAL_ENVIRONMENT;
  const context = await browser.newContext(options);
  const page = await context.newPage();
  // Keep timers working: setFixedTime pins Date without freezing React/Storybook task queues.
  await page.clock.setFixedTime(new Date(fixedTime));
  return { context, page };
}

export async function settleVisualStory(page, globals) {
  const theme = globals.match(/(?:^|;)theme:([^;]+)/)?.[1];
  const locale = globals.match(/(?:^|;)locale:([^;]+)/)?.[1];
  await page.waitForFunction(({ theme, locale }) => {
    const root = document.querySelector("#storybook-root");
    return root?.children.length && document.documentElement.lang === locale && document.documentElement.dataset.theme === theme;
  }, { theme, locale });
  await page.evaluate(async () => {
    // Request both packaged families explicitly; fonts.ready alone may resolve before a late
    // story render starts loading the font it needs. Missing font files must fail, not fall back.
    for (const [family, sample] of [["OrgTik Montserrat", "OrgTik"], ["OrgTik Arabic", "أورج تك"]]) {
      const loaded = await document.fonts.load(`400 14px "${family}"`, sample);
      if (!loaded.length || loaded.some(font => font.status !== "loaded")) throw new Error(`Visual font unavailable: ${family}`);
    }
    await document.fonts.ready;
  });
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

export async function visualPageMetadata(context, page) {
  const environment = await page.evaluate(() => ({
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
    now: new Date().toISOString(),
    scale: devicePixelRatio,
    viewport: { width: innerWidth, height: innerHeight },
    fonts: [...document.fonts].map(font => ({ family: font.family, weight: font.weight, status: font.status })),
  }));
  const client = await context.newCDPSession(page);
  try {
    await client.send("DOM.enable");
    await client.send("CSS.enable");
    const { root } = await client.send("DOM.getDocument");
    const platformFonts = {};
    for (const selector of ["#storybook-root code", "#storybook-root input", "#storybook-root select", "#storybook-root button"]) {
      const { nodeIds } = await client.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector });
      for (const nodeId of nodeIds.slice(0, 2)) {
        const { fonts } = await client.send("CSS.getPlatformFontsForNode", { nodeId });
        if (fonts.length) { platformFonts[selector] = fonts; break; }
      }
    }
    return { ...environment, platformFonts };
  } finally {
    await client.detach();
  }
}
