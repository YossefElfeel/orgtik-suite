import { after, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

// Vite loads the same JSX, CSS and JSON modules used by the published website.
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, entries: [] },
  appType: "custom",
  logLevel: "error",
});
const { default: snapshot } = await server.ssrLoadModule(
  "/src/content/snapshot.js",
);
const { managedPageTree, SectionMedia, SharedMedia } =
  await server.ssrLoadModule("/src/content/managed-page.jsx");
const baseline = structuredClone(snapshot.entries);
afterEach(() => {
  snapshot.entries = structuredClone(baseline);
  delete globalThis.window;
});
after(() => server.close());

test("published section order changes body sections without moving header, footer or section steps", () => {
  const home = snapshot.entries.page.find((entry) => entry.id === "pg_home");
  home.presentation = {
    sectionOrder: ["software", "hero", "services"],
    sectionMedia: {},
    cursor: { text: {}, link: "" },
  };
  const tree = h(
    "main",
    null,
    h("header", null, "Shared header"),
    h("section", { "data-cms-section": "hero" }, "Hero"),
    h(
      Fragment,
      null,
      h(
        "section",
        { "data-cms-section": "services" },
        h("ol", null, h("li", null, "Choose"), h("li", null, "Review")),
      ),
      h("section", { "data-cms-section": "software" }, "Software"),
    ),
    h("footer", null, "Shared footer"),
  );
  const html = renderToStaticMarkup(managedPageTree(tree, "pg_home"));
  assert.ok(
    html.indexOf("<header") < html.indexOf('data-cms-section="software"'),
  );
  assert.ok(
    html.indexOf('data-cms-section="software"') <
      html.indexOf('data-cms-section="hero"'),
  );
  assert.ok(
    html.indexOf('data-cms-section="hero"') <
      html.indexOf('data-cms-section="services"'),
  );
  assert.ok(
    html.indexOf('data-cms-section="services"') < html.indexOf("<footer"),
  );
  assert.match(html, /<ol><li>Choose<\/li><li>Review<\/li><\/ol>/);
  assert.match(html, /href="\/faq"/);
});

test("section media renders for native and composed sections, retaining alt, crop and video controls", () => {
  const home = snapshot.entries.page.find((entry) => entry.id === "pg_home");
  home.presentation = {
    sectionOrder: [],
    cursor: { text: {}, link: "" },
    sectionMedia: {
      hero: [
        {
          src: "https://assets.example.test/hero.webp",
          alt: { en: "Our studio" },
          focal: { x: 25, y: 75 },
        },
      ],
      partners: [
        {
          src: "https://assets.example.test/partners.webm",
          alt: { en: "Partner introduction" },
        },
      ],
    },
  };
  const Partners = () => h("section", null, "Partner list");
  const html = renderToStaticMarkup(
    managedPageTree(
      h(
        "main",
        null,
        h("section", { "data-cms-section": "hero" }, "Hero"),
        h(Partners, { "data-cms-section": "partners" }),
      ),
      "pg_home",
    ),
  );
  assert.match(html, /alt="Our studio"/);
  assert.match(html, /object-position:25% 75%/);
  assert.match(html, /<video[^>]*partners\.webm[^>]*controls=""/);
  assert.ok(html.indexOf("Partner list") < html.indexOf("<video"));
});

test("custom cursor uses managed text while card destinations remain authoritative", () => {
  snapshot.entries.page.find((entry) => entry.id === "pg_home").presentation = {
    sectionOrder: [],
    sectionMedia: {},
    cursor: { text: { en: "Explore this project" }, link: "/work" },
  };
  const tree = h(
    "main",
    null,
    h(
      "a",
      { href: "/work/specific-project", "data-cursor": "Old label" },
      h("span", { "data-cursor-label": "" }, "Old label"),
    ),
  );
  const html = renderToStaticMarkup(managedPageTree(tree, "pg_home"));
  assert.match(html, /href="\/work\/specific-project"/);
  assert.match(html, /data-cursor="Explore this project"/);
  assert.match(html, />Explore this project<\/span>/);
  assert.doesNotMatch(html, /Old label/);
});

test("shared attachments stay scoped and Arabic images use Arabic alternative text", () => {
  snapshot.entries.global.find(
    (entry) => entry.id === "gl_commerce",
  ).presentation = {
    sectionMedia: {
      "purchaseCart-intro": [
        {
          src: "https://assets.example.test/cart.webp",
          alt: { en: "Cart", ar: "سلة المشتريات" },
        },
      ],
      "purchaseCheckout-intro": [
        { src: "https://assets.example.test/checkout.webp" },
      ],
    },
  };
  globalThis.window = { location: { pathname: "/ar/cart" } };
  const html = renderToStaticMarkup(
    h(SharedMedia, { id: "gl_commerce", prefixes: ["purchaseCart-"] }),
  );
  assert.match(html, /alt="سلة المشتريات"/);
  assert.doesNotMatch(html, /checkout\.webp/);
  assert.equal(renderToStaticMarkup(h(SectionMedia, { items: [] })), "");
});

test("the actual Partners route applies its own order and intro/profile attachments", async () => {
  const events = new EventTarget();
  globalThis.window = { addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events), innerWidth: 1440, location: { pathname: "/legal/partners", hash: "", search: "" } };
  const partners = snapshot.entries.page.find(entry => entry.id === "pg_partners");
  partners.presentation = { sectionOrder: ["partners", "intro"], cursor: { text: {}, link: "" }, sectionMedia: {
    intro: [{ src: "https://assets.example.test/partner-intro.webp", alt: { en: "Partners introduction" } }],
    partners: [{ src: "https://assets.example.test/partner-profiles.webm", alt: { en: "Our partners" } }],
  } };
  const { default: Legal } = await server.ssrLoadModule("/src/reference/Legal.jsx");
  const html = renderToStaticMarkup(h(Legal));
  assert.ok(html.indexOf('class="partner-directory"') < html.indexOf('data-cms-section="intro"'));
  assert.match(html, /alt="Partners introduction"/);
  assert.match(html, /<video[^>]*partner-profiles\.webm[^>]*controls=""/);
  assert.match(html, /href="\/faq"/);
});

test("the actual homepage publishes the saved order and retains visible sample reviews", async () => {
  const events = new EventTarget();
  globalThis.window = { addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events), innerWidth: 1440, location: { pathname: "/", hash: "", search: "" } };
  snapshot.entries.page.find(entry => entry.id === "pg_home").presentation = { sectionOrder: ["reviews", "faqs", "hero", "two-sides", "partners", "work", "services", "software", "approach", "closing"], sectionMedia: {}, cursor: { text: {}, link: "" } };
  const { default: Home } = await server.ssrLoadModule("/src/reference/Home.jsx");
  const html = renderToStaticMarkup(h(Home));
  assert.ok(html.indexOf('id="reviews"') < html.indexOf('data-cms-section="faqs"'));
  assert.ok(html.indexOf('data-cms-section="faqs"') < html.indexOf('data-cms-section="hero"'));
  assert.match(html, /Sample review/);
  assert.match(html, /<details class="faq-item"/);
});
