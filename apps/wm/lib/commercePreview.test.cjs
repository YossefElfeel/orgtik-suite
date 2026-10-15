const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const cache = new Map();
function load(name) {
  const file = path.resolve(__dirname, name);
  if (cache.has(file)) return cache.get(file);
  const loaded = { exports: {} };
  cache.set(file, loaded.exports);
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    {
      module: loaded,
      exports: loaded.exports,
      require: (source) =>
        source.endsWith(".json")
          ? require(path.resolve(path.dirname(file), source))
          : load(`${source}.ts`),
      URL,
      URLSearchParams,
      Set,
    },
    { filename: file },
  );
  return loaded.exports;
}
const { commercePreviewHref, commercePreviewTarget, commercePreviewState } =
  load("commercePreview.ts");
const { COMMERCE_PRESENTATIONS } = load("commerceEditor.ts");
const { makeStore } = require("../../../mock/apps/wm/content");
const commerce = makeStore(() => "2026-10-15T00:00:00.000Z").entries.get(
  "gl_commerce",
).live;
const root = path.resolve(__dirname, "../../../");
const reference = path.join(
  root,
  "apps/website/landing-directions/src/reference",
);
const website = [
  "CommerceLayout.jsx",
  "PurchaseUI.jsx",
  "PurchaseControls.jsx",
  "PurchasePlans.jsx",
  "PurchaseCart.jsx",
  "PurchaseCheckout.jsx",
  "PaymentDetails.jsx",
  "SiteHeader.jsx",
  "AccountControl.jsx",
]
  .map((name) => fs.readFileSync(path.join(reference, name), "utf8"))
  .join("\n");

test("every supported canonical Purchasing preview opens a real commerce page, never the unrelated Home page", () => {
  assert.equal(commerce.layout.length, 21);
  for (const section of commerce.layout) {
    if (section.key === "purchaseUI-plans-section") {
      assert.equal(commercePreviewHref(section.key, "fr"), undefined);
      continue;
    }
    const url = new URL(
      commercePreviewHref(section.key, "fr"),
      "https://wm.test",
    );
    assert.equal(url.pathname, "/preview");
    assert.match(
      url.searchParams.get("path"),
      /^\/fr\/(?:services|plans|cart|checkout)$/,
    );
    assert.equal(url.searchParams.get("lang"), "fr");
    assert.match(
      url.searchParams.get("section"),
      /^(?:id|class):[A-Za-z0-9_-]+$/,
    );
    assert.deepEqual(
      [...url.searchParams.keys()].filter(
        (key) => !["path", "lang", "section", "detail"].includes(key),
      ),
      [],
      "previews must not manufacture orders, add selections, or pass credentials",
    );
  }
  assert.equal(commercePreviewHref("unrecognized-source", "en"), undefined);
});

test("section targets correspond to current website containers and native anchors", () => {
  for (const section of commerce.layout) {
    const target = commercePreviewTarget(section.key);
    const [kind, name] = target.split(":");
    if (name === "service-bundles") {
      assert.ok(website.includes("id={`${kind}-bundles`}"));
    } else if (name === "svc-builder") {
      assert.ok(
        website.includes(
          'id={kind === "software" ? "plan-builder" : "svc-builder"}',
        ),
      );
    } else {
      assert.ok(
        website.includes(name),
        `${section.key}: ${kind}:${name} was removed from the website`,
      );
    }
  }
});

test("shared builder controls retain distinct Services and Software destinations", () => {
  for (const [section, expected] of [
    ["purchaseUI-intro", "id:plan-builder"],
    ["purchaseUI-section-1", "id:plan-builder"],
    ["purchaseUI-hero", "id:software-bundles"],
    ["purchaseControls-intro", "id:plan-builder"],
  ]) {
    const url = new URL(
      commercePreviewHref(section, "ar", undefined, "software"),
      "https://wm.test",
    );
    assert.equal(url.searchParams.get("path"), "/ar/software");
    assert.equal(url.searchParams.get("section"), expected);
  }
});

test("detail variants have no direct preview when the address picker cannot guarantee a matching record kind", () => {
  for (const context of ["service", "software"]) {
    for (const card of [undefined, "hosting", "department", "packageGuidance"])
      assert.equal(
        commercePreviewHref("purchaseUI-plans-section", "de", card, context),
        undefined,
        `${context}/${card ?? "section header"} must not open a different branch`,
      );
  }
  assert.equal(commercePreviewState("purchaseUI-plans-section"), "detail");
});

test("conditional copy is identified without making cart, payment, account, or dialog state", () => {
  assert.equal(commercePreviewState("purchaseControls-hero"), "dialog");
  assert.equal(commercePreviewState("purchaseControls-section-1"), "dialog");
  assert.equal(commercePreviewState("purchaseCart-header"), "cart");
  assert.equal(commercePreviewState("purchaseCheckout-section-2"), "cart");
  assert.equal(commercePreviewState("purchaseCheckout-hero"), "completed");
  assert.equal(commercePreviewState("purchaseCheckout-section-1"), "completed");
  assert.equal(commercePreviewState("paymentDetails-intro"), "card-payment");
  assert.equal(commercePreviewState("commerceLayout-footer"), "always");
});

test("semantic cards preview their component, while unsupported dialog and older-copy cards have no misleading link", () => {
  for (const [section, definition] of Object.entries(COMMERCE_PRESENTATIONS)) {
    for (const card of definition.groups) {
      const href = commercePreviewHref(section, "it", card.id);
      if (
        section === "purchaseUI-plans-section" ||
        card.id === "unused" ||
        ["durationDialog", "accountDialog", "clearDialog", "hosting"].includes(
          card.id,
        )
      ) {
        assert.equal(href, undefined, `${section}/${card.id}`);
      } else {
        assert.ok(href, `${section}/${card.id}`);
        const target = commercePreviewTarget(section, card.id);
        const name = target.split(":")[1];
        assert.ok(
          ["service-bundles", "svc-builder"].includes(name) ||
            website.includes(name),
          `${section}/${card.id}: ${target} has no website container`,
        );
      }
    }
  }
  assert.equal(
    commercePreviewTarget("purchasePlans-intro", "filters"),
    "class:purchase-browse-toolbar",
  );
  assert.equal(
    commercePreviewTarget("purchaseUI-intro", "summary"),
    "class:purchase-summary",
  );
  assert.equal(
    commercePreviewTarget("purchaseControls-intro", "toast"),
    "class:purchase-toast",
  );
});
