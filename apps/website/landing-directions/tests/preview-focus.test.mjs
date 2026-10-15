import test from "node:test";
import assert from "node:assert/strict";
import {
  findPreviewSection,
  focusPreviewSection,
} from "../src/content/preview-focus.js";

const element = ({
  hidden = false,
  display = "block",
  top = 400,
  children = [],
} = {}) => ({
  children,
  style: { display, visibility: "visible" },
  closest: () => (hidden ? {} : null),
  getClientRects: () => (display === "contents" || hidden ? [] : [{}]),
  getBoundingClientRect: () => ({ top }),
});
function page(target = "cms:workspace") {
  const nodes = new Map();
  let mutation, deadline;
  const scheduled = [];
  const reports = [],
    scrolls = [];
  const view = {
    location: {
      search: `?preview&previewSection=${encodeURIComponent(target)}`,
    },
    scrollY: 200,
    document: {
      documentElement: {},
      querySelectorAll: (query) => nodes.get(query) ?? [],
      getElementById: (id) => nodes.get(`#${id}`)?.[0] ?? null,
    },
    getComputedStyle: (node) => node.style,
    scrollTo: (position) => scrolls.push(position),
    MutationObserver: class {
      constructor(callback) {
        mutation = callback;
      }
      observe() {}
      disconnect() {}
    },
    setTimeout: (callback) => {
      deadline = callback;
      return 1;
    },
    clearTimeout() {},
    requestAnimationFrame: (callback) => scheduled.push(callback),
  };
  return {
    view,
    nodes,
    reports,
    scrolls,
    report: (value) => reports.push(value),
    paint: () => scheduled.splice(0).forEach((callback) => callback()),
    mutate: () => mutation(),
    expire: () => deadline(),
  };
}

test("preview waits for the lazy page and scrolls its actual CMS section below the header", () => {
  const fixture = page();
  focusPreviewSection(fixture.view, fixture.report);
  fixture.paint();
  fixture.paint();
  assert.equal(fixture.reports.length, 0);
  fixture.nodes.set('[data-cms-section="workspace"]', [element({ top: 600 })]);
  fixture.mutate();
  fixture.paint();
  fixture.paint();
  assert.deepEqual(fixture.scrolls, [{ top: 700, behavior: "instant" }]);
  assert.deepEqual(fixture.reports, [
    { section: "cms:workspace", sectionFound: true },
  ]);
  fixture.mutate();
  fixture.paint();
  fixture.paint();
  assert.equal(
    fixture.scrolls.length,
    1,
    "ordinary later updates do not pull the visitor back",
  );
});

test("native builder anchors, class containers and display:contents groups resolve without selector injection", () => {
  const fixture = page();
  const builder = element(),
    directory = element();
  fixture.nodes.set("#svc-builder", [builder]);
  fixture.nodes.set(".partner-directory", [directory]);
  fixture.nodes.set('[data-cms-section="intro"]', [
    element({
      display: "contents",
      children: [element({ hidden: true }), directory],
    }),
  ]);
  assert.equal(
    findPreviewSection(fixture.view.document, "id:svc-builder", fixture.view),
    builder,
  );
  assert.equal(
    findPreviewSection(
      fixture.view.document,
      "class:partner-directory",
      fixture.view,
    ),
    directory,
  );
  assert.equal(
    findPreviewSection(fixture.view.document, "cms:intro", fixture.view),
    directory,
  );
  assert.equal(
    findPreviewSection(
      fixture.view.document,
      'cms:hero"] button',
      fixture.view,
    ),
    null,
  );
});

test("the requested section takes precedence over the page's native anchor restoration", () => {
  const fixture = page("id:svc-builder");
  fixture.nodes.set("#svc-builder", [element({ top: 900 })]);
  focusPreviewSection(fixture.view, fixture.report);
  fixture.view.requestAnimationFrame(() =>
    fixture.view.scrollTo({ top: 0, behavior: "instant" }),
  );
  fixture.paint();
  fixture.paint();
  assert.equal(fixture.scrolls.at(-1).top, 1000);
});

test("hidden or unavailable visitor states are reported without opening dialogs or creating purchases", () => {
  const fixture = page("class:purchase-confirmation");
  fixture.nodes.set(".purchase-confirmation", [element({ hidden: true })]);
  focusPreviewSection(fixture.view, fixture.report);
  fixture.paint();
  fixture.paint();
  fixture.expire();
  assert.deepEqual(fixture.reports, [
    { section: "class:purchase-confirmation", sectionFound: false },
  ]);
  assert.deepEqual(fixture.scrolls, []);
  assert.equal(
    fixture.view.location.search,
    "?preview&previewSection=class%3Apurchase-confirmation",
  );
});
