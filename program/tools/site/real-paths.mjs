// S3 on the website (D-035): the pages keep routing by their own view hashes, but the browser
// shows real addresses. Reads of location.hash become routeHash() (the view the address shows),
// writes become setRoute(…) (the view's real address, then the same hashchange the page listens
// to), and Legal's silent history.replaceState(…"#/"+k) becomes setRoute(…, { silent: true }).
//
//   node real-paths.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..", "..", "..");
const REF = path.join(process.env.SITE_APP ?? path.join(ROOT, "orgtik-website", "landing-directions"), "src", "reference");
const { parse } = createRequire(path.join(ROOT, "local-dev", "package.json"))("@babel/parser");

const isHash = (n) =>
  n?.type === "MemberExpression" &&
  !n.computed &&
  n.property.name === "hash" &&
  ((n.object.type === "Identifier" && n.object.name === "location") ||
    (n.object.type === "MemberExpression" && n.object.object.name === "window" && n.object.property.name === "location"));

for (const file of fs.readdirSync(REF).filter((f) => f.endsWith(".jsx") && f !== "ReferencePage.jsx")) {
  const full = path.join(REF, file);
  const src = fs.readFileSync(full, "utf8");
  const ast = parse(src, { sourceType: "module", plugins: ["jsx"] });
  const edits = [];
  (function walk(n, parent) {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) return n.forEach((x) => walk(x, parent));
    if (n.type === "AssignmentExpression" && n.operator === "=" && isHash(n.left)) {
      edits.push({ start: n.start, end: n.end, text: `setRoute(${src.slice(n.right.start, n.right.end)})` });
      return;
    }
    // history.replaceState(null, "", "#/" + k): the page already updated itself.
    if (n.type === "CallExpression" && n.callee.type === "MemberExpression" && n.callee.object.name === "history" && n.callee.property.name === "replaceState") {
      const arg = n.arguments[2];
      const text = arg && src.slice(arg.start, arg.end);
      if (text && text.startsWith('"#/"')) {
        edits.push({ start: n.start, end: n.end, text: `setRoute(${text}, { silent: true })` });
        return;
      }
    }
    if (isHash(n)) {
      edits.push({ start: n.start, end: n.end, text: "routeHash()" });
      return;
    }
    for (const [k, v] of Object.entries(n)) if (k !== "loc" && v && typeof v === "object") walk(v, n);
  })(ast.program);
  if (!edits.length) continue;
  let out = src;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  // The helpers come from ./navigation, next to toSiteHref.
  if (/import \{ toSiteHref \} from "\.\/navigation";/.test(out)) out = out.replace('import { toSiteHref } from "./navigation";', 'import { routeHash, setRoute, toSiteHref } from "./navigation";');
  else {
    const imports = [...out.matchAll(/^import .*;$/gm)];
    const last = imports[imports.length - 1];
    out = out.slice(0, last.index + last[0].length) + '\nimport { routeHash, setRoute } from "./navigation";' + out.slice(last.index + last[0].length);
  }
  fs.writeFileSync(full, out);
  console.log(`${file}: ${edits.length} changes`);
}
