// Synchronize only the source-traced editor guidance namespace, retaining every other message.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "../..");
const ts = require(path.join(root, "apps/wm/node_modules/typescript"));
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      require(name) {
        return load(path.resolve(path.dirname(file), `${name}.ts`));
      },
    },
    { filename: file },
  );
  return module.exports;
}
function nest(flat) {
  const result = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let cursor = result;
    for (const part of parts.slice(0, -1)) cursor = cursor[part] ??= {};
    cursor[parts.at(-1)] = value;
  }
  return result;
}
const modules = [
  "Discovery",
  "Support",
  "Purchasing",
  "Shared",
  "Common",
  "Records",
];
const english = {};
const translations = Object.fromEntries(
  ["ar", "de", "fr", "it"].map((lang) => [lang, {}]),
);
for (const name of modules) {
  const stem = path.join(root, `apps/wm/lib/pagePlacement${name}`);
  const exports = load(`${stem}.ts`);
  const copy = Object.entries(exports).find(([key]) =>
    key.endsWith("_COPY"),
  )?.[1];
  if (!copy) throw new Error(`${name}: no source copy`);
  const translated = JSON.parse(
    fs.readFileSync(`${stem}.messages.json`, "utf8"),
  );
  for (const key of Object.keys(copy)) {
    if (key in english) throw new Error(`Duplicate message: ${key}`);
    english[key] = copy[key];
    for (const lang of Object.keys(translations)) {
      if (
        typeof translated[lang]?.[key] !== "string" ||
        !translated[lang][key].trim()
      )
        throw new Error(`${name}/${lang}: missing ${key}`);
      translations[lang][key] = translated[lang][key];
    }
  }
  for (const [lang, copyByLanguage] of Object.entries(translated))
    for (const key of Object.keys(copyByLanguage))
      if (!(key in copy))
        throw new Error(`${name}/${lang}: orphan message ${key}`);
}
for (const [lang, copy] of Object.entries({ en: english, ...translations })) {
  const file = path.join(root, `apps/wm/messages/${lang}.json`);
  const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
  catalog.PagePlacement = nest(copy);
  fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`);
}
console.log(
  `PagePlacement: ${Object.keys(english).length} messages synchronized in five languages`,
);
