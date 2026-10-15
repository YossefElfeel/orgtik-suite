const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const cache = new Map();

function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const requireLocal = (name) => {
    const target = path.resolve(
      path.dirname(file),
      `${name}${path.extname(name) ? "" : ".ts"}`,
    );
    return target.endsWith(".json")
      ? JSON.parse(fs.readFileSync(target, "utf8"))
      : load(target);
  };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    { module, exports: module.exports, require: requireLocal },
    { filename: file },
  );
  return module.exports;
}

const {
  commerceNavigation,
  commerceCards,
  COMMERCE_PRESENTATIONS,
  ENGLISH_FIELDS,
  ENGLISH_UI,
} = load(path.join(__dirname, "commerceEditor.ts"));
const seed = require("../../../mock/apps/wm/seed/website.json").entries.find(
  (entry) => entry.id === "gl_commerce",
);
const sections = seed.layout.map((section) => ({
  value: section.key,
  path: section.key,
  node: {
    kind: "group",
    fields: Object.fromEntries(
      section.slots.map((slot) => [
        slot.key,
        {
          kind: "rich",
          label: slot.kind,
          ...(slot.fixedValues ? { fixedValues: slot.fixedValues } : {}),
        },
      ]),
    ),
  },
}));

test("every actual purchasing section and source slot has exactly one semantic destination", () => {
  const navigated = commerceNavigation(sections).flatMap((group) =>
    group.sections.map((section) => section.value),
  );
  assert.equal(new Set(navigated).size, sections.length);
  assert.deepEqual(
    [...navigated].sort(),
    sections.map((section) => section.value).sort(),
  );
  let fields = 0;
  for (const section of sections) {
    assert.ok(
      COMMERCE_PRESENTATIONS[section.value],
      `${section.value}: screen mapped`,
    );
    const cards = commerceCards(section);
    assert.ok(
      cards.every((card) => card.id !== "additional"),
      `${section.value}: current fields have specific names`,
    );
    const flattened = cards.flatMap((card) => card.keys);
    assert.equal(
      new Set(flattened).size,
      flattened.length,
      `${section.value}: duplicate field`,
    );
    assert.deepEqual(
      [...flattened].sort(),
      Object.keys(section.node.fields).sort(),
      `${section.value}: omitted field`,
    );
    for (const card of cards) {
      assert.ok(
        ENGLISH_UI.cards[card.id],
        `${section.value}.${card.id}: card name exists`,
      );
      for (const node of Object.values(card.node.fields))
        assert.ok(
          ENGLISH_FIELDS[node.label.slice("purchasing.".length)],
          `${node.label}: semantic field name exists`,
        );
    }
    fields += flattened.length;
  }
  assert.equal(sections.length, 21);
  assert.ok(
    fields > 200,
    "coverage includes the entire stored purchase journey",
  );
});

test("inactive stored copy is retained separately and cannot be mistaken for a visible website section", () => {
  const sourceDir = path.resolve(
    __dirname,
    "../../website/landing-directions/src/reference",
  );
  const source = fs
    .readdirSync(sourceDir)
    .filter((file) => /\.[jt]sx?$/.test(file))
    .map((file) => fs.readFileSync(path.join(sourceDir, file), "utf8"))
    .join("\n");
  let inactive = 0;
  for (const section of sections) {
    for (const card of commerceCards(section)) {
      for (const key of card.keys) {
        const consumed = source.includes(
          `gl_commerce|${section.value}|${key}"`,
        );
        assert.equal(
          card.id === "unused",
          !consumed,
          `${section.value}.${key}: retained copy matches the active website`,
        );
        if (!consumed) {
          inactive++;
          assert.equal(card.stateKey, "states.unused");
        }
      }
    }
  }
  assert.equal(inactive, 6);
});

test("new template sections and fields remain editable without changing original schema data", () => {
  const original = sections.find(
    (section) => section.value === "paymentDetails-intro",
  );
  const snapshot = JSON.stringify(original);
  const futureNode = {
    kind: "rich",
    label: "newPaymentNotice",
    long: true,
    fixedValues: ["kept"],
  };
  const section = {
    ...original,
    node: {
      ...original.node,
      fields: { ...original.node.fields, future: futureNode },
    },
  };
  const cards = commerceCards(section);
  assert.equal(
    cards.flatMap((card) => card.keys).filter((key) => key === "future").length,
    1,
  );
  assert.equal(cards.at(-1).node.fields.future, futureNode);
  const testInstructions = cards
    .flatMap((card) => Object.entries(card.node.fields))
    .find(([key]) => key === "p")[1];
  assert.deepEqual(
    testInstructions.fixedValues,
    original.node.fields.p.fixedValues,
  );
  assert.equal(JSON.stringify(original), snapshot);
  const newSection = {
    ...section,
    value: "newPurchaseSection",
    path: "newPurchaseSection",
  };
  assert.equal(
    commerceNavigation([...sections, newSection]).at(-1).sections[0],
    newSection,
  );
  assert.deepEqual(
    [...commerceCards(newSection)[0].keys].sort(),
    Object.keys(newSection.node.fields).sort(),
  );
});
