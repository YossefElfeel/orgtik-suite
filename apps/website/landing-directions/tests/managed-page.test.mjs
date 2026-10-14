import { after, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

// Vite loads the same JSX, CSS and JSON modules used by the published website.
const server = await createServer({
  configFile: false,
  esbuild: { jsx: "automatic" },
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
const { ArticleBlocks } = await server.ssrLoadModule(
  "/src/reference/ArticleBlocks.jsx",
);
const { Testimonials, reviewsFor } = await server.ssrLoadModule(
  "/src/reference/Testimonials.jsx",
);
const baseline = structuredClone(snapshot.entries);
afterEach(() => {
  snapshot.entries = structuredClone(baseline);
  delete globalThis.window;
  delete globalThis.location;
});
after(() => server.close());

test("testimonials retain published ordering, related badges, portraits, media and sample disclosure", () => {
  snapshot.entries.review = [
    {
      id: "last",
      position: 2,
      relatedEntry: "sm_01",
      sample: false,
      image: {
        src: "brand-cards.webp",
        alt: { en: "Portrait" },
        focal: { x: 20, y: 80 },
      },
      locales: {
        en: {
          name: "Author",
          quote: "Managed quote",
          role: "Lead",
          company: "Company",
        },
      },
      presentation: {
        sectionMedia: { details: [{ src: "cinematic-desktop.mp4" }] },
      },
    },
    {
      id: "first",
      position: 1,
      sample: true,
      locales: { en: { name: "Sample author", quote: "Sample quote" } },
    },
  ];
  const html = renderToStaticMarkup(
    h(Testimonials, { "data-cms-section": "reviews" }),
  );
  assert.ok(
    html.indexOf('data-review-id="first"') <
      html.indexOf('data-review-id="last"'),
  );
  assert.match(html, /testimonials__track/);
  assert.match(html, /Software/);
  assert.match(html, /Sample review/);
  assert.match(html, /Five-star design preview; not a client rating/);
  assert.equal(
    (html.match(/ph-star/g) ?? []).length,
    5,
    "actual reviews do not acquire fabricated ratings",
  );
  assert.match(html, /src="\/assets\/brand-cards.webp" alt="Portrait"/);
  assert.match(html, /object-position:20% 80%/);
  assert.match(html, /<video[^>]*cinematic-desktop\.mp4[^>]*controls=""/);
  assert.match(html, /aria-label="Previous testimonials"/);
  assert.match(html, /aria-controls=/);
  assert.ok(!html.includes(' scope="') && !html.includes(' project="'));
});

test("testimonials show only the requested related content without losing unassigned reviews", () => {
  snapshot.entries.review = [
    { id: "software", relatedEntry: "sm_01", order: 3, locales: { en: {} } },
    { id: "service", relatedEntry: "sf_01", order: 2, locales: { en: {} } },
    { id: "general", order: 1, locales: { en: {} } },
  ];
  assert.deepEqual(
    reviewsFor("services").map((row) => row.id),
    ["general", "service"],
  );
  assert.deepEqual(
    reviewsFor("software").map((row) => row.id),
    ["general", "software"],
  );
  assert.equal(reviewsFor("general").length, 3);
  snapshot.entries.review = [];
  assert.equal(renderToStaticMarkup(h(Testimonials)), "");
});

test("testimonials use translated copy and an RTL carousel without replacing CMS words", () => {
  globalThis.window = { location: { pathname: "/ar" } };
  snapshot.entries.review = [
    {
      id: "arabic",
      category: "software",
      order: 1,
      sample: true,
      locales: {
        en: { quote: "English", name: "English author" },
        ar: { quote: "رأي العميل", name: "العميل" },
      },
    },
  ];
  const html = renderToStaticMarkup(h(Testimonials, { scope: "software" }));
  assert.match(html, /dir="rtl"/);
  assert.match(html, /رأي العميل/);
  assert.match(html, /تقييم تجريبي/);
  assert.match(html, /آراء عملاء البرمجيات/);
  assert.match(html, /testimonials__tag--software[^>]*>البرمجيات<\/span>/);
  assert.ok(!html.includes("English author"));
});

test("the selected review category controls its badge and overview placement without a related entry", () => {
  snapshot.entries.review = [
    { id: "services", category: "services", relatedEntry: "sm_01", order: 1, locales: { en: { name: "Service author", quote: "Service feedback" } } },
    { id: "software", category: "software", order: 2, locales: { en: { name: "Software author", quote: "Software feedback" } } },
    { id: "legacy", order: 3, locales: { en: { name: "Legacy author", quote: "Existing feedback" } } },
  ];
  assert.deepEqual(reviewsFor("services").map(row => row.id), ["services", "legacy"]);
  assert.deepEqual(reviewsFor("software").map(row => row.id), ["software", "legacy"]);
  const html = renderToStaticMarkup(h(Testimonials));
  assert.match(html, /class="testimonials__tag">Services<\/span>/);
  assert.match(html, /testimonials__tag--software[^>]*>Software<\/span>/);
  assert.equal(reviewsFor("general").length, 3);
});

test("a review appears on every selected detail page, keeps its badge, and does not leak to other detail pages", () => {
  const family = snapshot.entries.serviceFamily[0];
  const service = snapshot.entries.service.find(row => row.parent === family.id);
  const software = snapshot.entries.softwareModule[0];
  const paths = [`/services/${family.slug.en}`, `/services/${family.slug.en}/${service.slug.en}`, `/software/${software.slug.en}`];
  snapshot.entries.review = [
    { id: "selected", category: "services", relatedEntries: [family.id, service.id, software.id], position: 1, locales: { en: { name: "Client", quote: "Shared page feedback" } } },
    { id: "legacy", relatedEntry: software.id, position: 2, locales: { en: { name: "Legacy", quote: "Legacy feedback" } } },
    { id: "cleared", relatedEntries: [], relatedEntry: software.id, position: 3, locales: { en: {} } },
    { id: "unlinked", position: 4, locales: { en: {} } },
  ];
  for (const path of paths) {
    assert.ok(reviewsFor("software", path).some(row => row.id === "selected"));
    const html = renderToStaticMarkup(h(Testimonials, { scope: "software", pagePath: path }));
    assert.match(html, /Shared page feedback/);
    assert.match(html, /class="testimonials__tag">Services<\/span>/);
    assert.ok(!html.includes('data-review-id="cleared"') && !html.includes('data-review-id="unlinked"'));
    assert.ok(!html.includes(' pagePath="'));
  }
  assert.deepEqual(reviewsFor("software", paths[2]).map(row => row.id), ["selected", "legacy"]);
  assert.deepEqual(reviewsFor("services", "/services/missing"), []);
  const otherSoftware = snapshot.entries.softwareModule[1];
  assert.deepEqual(reviewsFor("software", `/software/${otherSoftware.slug.en}`), []);
  assert.equal(reviewsFor("general").length, 4);
});

test("the actual service and software detail routes render their selected reviews", async () => {
  const events = new EventTarget();
  const family = snapshot.entries.serviceFamily.find(row => row.slug.en === "design");
  const service = snapshot.entries.service.find(row => row.parent === family.id && row.slug.en === "web-and-app-design");
  const software = snapshot.entries.softwareModule.find(row => row.slug.en === "hr");
  snapshot.entries.review = [{ id: "multi-page", relatedEntries: [family.id, service.id, software.id], locales: { en: { name: "Client", quote: "Selected page quote" } } }];
  for (const [module, path] of [["Services", "/services/design"], ["Services", "/services/design/web-and-app-design"], ["Software", "/software/hr"]]) {
    globalThis.window = { addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events), innerWidth: 1440, location: { pathname: path, hash: "", search: "" } };
    globalThis.location = window.location = new URL(path, "https://orgtik.ch");
    const { default: Page } = await server.ssrLoadModule(`/src/reference/${module}.jsx`);
    const html = renderToStaticMarkup(h(Page));
    assert.match(html, /data-review-id="multi-page"/);
    assert.match(html, /Selected page quote/);
  }
});

test("article blocks render images and videos in managed order, with captions and safe sources", () => {
  const html = renderToStaticMarkup(
    h(ArticleBlocks, {
      blocks: [
        { id: "first", kind: "text", text: "Before media <script>" },
        {
          id: "image",
          kind: "image",
          src: "brand-cards.webp",
          alt: "Cards",
          caption: "Image caption",
        },
        { id: "middle", kind: "text", text: "Between the media" },
        {
          id: "video",
          kind: "video",
          src: "https://cdn.example.test/movie.mp4",
          alt: "A movie",
          caption: "Video caption",
        },
        { id: "last", kind: "text", text: "After media" },
        { id: "unsafe", kind: "image", src: "javascript:alert(1)" },
      ],
    }),
  );
  assert.ok(html.indexOf("Before media") < html.indexOf("<img"));
  assert.ok(html.indexOf("<img") < html.indexOf("Between the media"));
  assert.ok(html.indexOf("Between the media") < html.indexOf("<video"));
  assert.ok(html.indexOf("<video") < html.indexOf("After media"));
  assert.match(html, /src="\/assets\/brand-cards.webp" alt="Cards"/);
  assert.match(html, /<figcaption[^>]*>Image caption<\/figcaption>/);
  assert.match(html, /controls="" preload="metadata"/);
  assert.match(html, /&lt;script&gt;/);
  assert.ok(!html.includes("javascript:"));
});

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

test("new legal documents render their own URL and appear in the document navigation", async () => {
  snapshot.entries.legalDocument.push({id:"lg_new",slug:{en:"additional-policy"},locales:{en:{name:"Additional policy",summary:"Managed legal introduction",sections:[{heading:"Additional scope",body:"Managed legal wording"}]}},seo:{en:{}}});
  globalThis.window = {innerWidth:1440,location:{pathname:"/legal/additional-policy",hash:"",search:""}};
  const {default:Legal}=await server.ssrLoadModule("/src/reference/Legal.jsx");
  const {viewToPath}=await server.ssrLoadModule("/src/reference/navigation.js");
  const html=renderToStaticMarkup(h(Legal));
  assert.match(html,/Additional policy/);assert.match(html,/Managed legal introduction/);assert.match(html,/Managed legal wording/);
  assert.equal(viewToPath("/legal","#/additional-policy"),"/legal/additional-policy");
  const page=new Legal({});assert.equal(page.parseRoute("#/additional-policy").view,"additional-policy");
  assert.ok(page.renderVals().tabs.some(tab=>tab.label==="Additional policy"&&tab.sel==="true"));
  assert.equal(page.parseRoute("#/unknown-policy").view,"index");
});

test("the actual Partners route applies its own order and intro/profile attachments", async () => {
  const events = new EventTarget();
  globalThis.window = {
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
    innerWidth: 1440,
    location: { pathname: "/legal/partners", hash: "", search: "" },
  };
  const partners = snapshot.entries.page.find(
    (entry) => entry.id === "pg_partners",
  );
  partners.presentation = {
    sectionOrder: ["partners", "intro"],
    cursor: { text: {}, link: "" },
    sectionMedia: {
      intro: [
        {
          src: "https://assets.example.test/partner-intro.webp",
          alt: { en: "Partners introduction" },
        },
      ],
      partners: [
        {
          src: "https://assets.example.test/partner-profiles.webm",
          alt: { en: "Our partners" },
        },
      ],
    },
  };
  const { default: Legal } = await server.ssrLoadModule(
    "/src/reference/Legal.jsx",
  );
  const html = renderToStaticMarkup(h(Legal));
  assert.ok(
    html.indexOf('class="partner-directory"') <
      html.indexOf('data-cms-section="intro"'),
  );
  assert.match(html, /alt="Partners introduction"/);
  assert.match(html, /<video[^>]*partner-profiles\.webm[^>]*controls=""/);
  assert.match(html, /href="\/faq"/);
});

test("the actual homepage publishes the saved order and retains visible sample reviews", async () => {
  const events = new EventTarget();
  globalThis.window = {
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
    innerWidth: 1440,
    location: { pathname: "/", hash: "", search: "" },
  };
  snapshot.entries.page.find((entry) => entry.id === "pg_home").presentation = {
    sectionOrder: [
      "reviews",
      "faqs",
      "hero",
      "two-sides",
      "partners",
      "work",
      "services",
      "software",
      "approach",
      "closing",
    ],
    sectionMedia: {},
    cursor: { text: {}, link: "" },
  };
  const { default: Home } = await server.ssrLoadModule(
    "/src/reference/Home.jsx",
  );
  const html = renderToStaticMarkup(h(Home));
  assert.ok(
    html.indexOf('id="reviews"') < html.indexOf('data-cms-section="faqs"'),
  );
  assert.ok(
    html.indexOf('data-cms-section="faqs"') <
      html.indexOf('data-cms-section="hero"'),
  );
  assert.match(html, /Sample review/);
  assert.match(html, /<details class="faq-item"/);
});

test("the actual Insights route renders managed sections and media in order", async () => {
  const events = new EventTarget();
  const article = snapshot.entries.article.find(
    (entry) => entry.id === "ar_02",
  );
  article.locales.en.sections = [
    {
      id: "section",
      heading: "Managed article heading",
      blocks: [
        { id: "before", kind: "text", text: "Managed paragraph before media" },
        {
          id: "image",
          kind: "image",
          src: "brand-tablet.webp",
          alt: "Managed article image",
          caption: "Managed caption",
        },
        { id: "after", kind: "text", text: "Managed paragraph after media" },
      ],
    },
  ];
  globalThis.window = {
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
    innerWidth: 1440,
    location: {
      pathname: `/insights/${article.slug.en}`,
      hash: "",
      search: "",
    },
  };
  const { default: Insights } = await server.ssrLoadModule(
    "/src/reference/Insights.jsx",
  );
  const html = renderToStaticMarkup(h(Insights));
  assert.match(html, /Managed article heading/);
  assert.ok(
    html.indexOf("Managed paragraph before media") <
      html.indexOf('alt="Managed article image"'),
  );
  assert.ok(
    html.indexOf('alt="Managed article image"') <
      html.indexOf("Managed paragraph after media"),
  );
  assert.match(html, /Managed caption/);
  assert.match(html, /href="\/faq"/);
});
