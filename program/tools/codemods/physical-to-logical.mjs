// Tailwind physical-direction classes -> logical ones, so layouts mirror in Arabic (RTL).
//
//   node physical-to-logical.mjs <app dir> [--check]
//
// ml-4 -> ms-4, pr-2 -> pe-2, left-0 -> start-0, text-right -> text-end, border-l -> border-s,
// rounded-tr-lg -> rounded-se-lg, scroll-ml -> scroll-ms… Variants and the important/negative
// prefixes are kept (hover:ml-2, !pl-3, -mr-1). Only class-looking tokens inside string literals
// and template strings are touched. Things that need a person (translate-x, rotate, background
// positions, absolute layouts drawn in px) are listed, not changed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAP = [
  [/^(-?)m([lr])-/, (m, neg, side) => `${neg}m${side === "l" ? "s" : "e"}-`],
  [/^p([lr])-/, (m, side) => `p${side === "l" ? "s" : "e"}-`],
  [/^(-?)(left|right)-/, (m, neg, side) => `${neg}${side === "left" ? "start" : "end"}-`],
  [/^text-(left|right)$/, (m, side) => `text-${side === "left" ? "start" : "end"}`],
  [/^float-(left|right)$/, (m, side) => `float-${side === "left" ? "start" : "end"}`],
  [/^clear-(left|right)$/, (m, side) => `clear-${side === "left" ? "start" : "end"}`],
  [/^border-([lr])(-|$)/, (m, side, rest) => `border-${side === "l" ? "s" : "e"}${rest}`],
  [/^rounded-([lr])(-|$)/, (m, side, rest) => `rounded-${side === "l" ? "s" : "e"}${rest}`],
  [/^rounded-(t|b)([lr])(-|$)/, (m, tb, side, rest) => `rounded-${tb === "t" ? "s" : "e"}${side === "l" ? "s" : "e"}${rest}`],
  [/^scroll-m([lr])-/, (m, side) => `scroll-m${side === "l" ? "s" : "e"}-`],
  [/^scroll-p([lr])-/, (m, side) => `scroll-p${side === "l" ? "s" : "e"}-`],
];
const REVIEW = /(^|:)-?(translate-x|space-x-reverse|bg-(left|right)|origin-(left|right)|justify-self-(left|right))/;

export function convertToken(token) {
  // variants (hover:, md:, rtl:, [&_svg]:) and the ! / - prefixes
  const m = token.match(/^((?:[^:\s]+:)*)(!?)(.*)$/);
  if (!m) return token;
  const [, variants, bang, core] = m;
  if (/(^|:)(rtl|ltr):/.test(variants)) return token; // already direction-aware
  // Base UI side=left|right is physical (inline-start|end is the logical pair), so those stay physical.
  if (/\[side=(left|right)\]/.test(variants)) return token;
  for (const [re, fn] of MAP) if (re.test(core)) return `${variants}${bang}${core.replace(re, fn)}`;
  return token;
}

function convertClassString(s) {
  return s.split(/(\s+)/).map((t) => (/\s/.test(t) || !t ? t : convertToken(t))).join("");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = path.resolve(process.argv[2] ?? ".");
  const check = process.argv.includes("--check");
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return /node_modules|\.next|\.git/.test(e.name) ? [] : walk(p);
    return /\.(tsx|ts|jsx|js)$/.test(e.name) ? [p] : [];
  });
  const files = ["app", "components", "lib", "constants"].map((d) => path.join(root, d)).filter(fs.existsSync).flatMap(walk);
  let changed = 0, tokens = 0;
  const review = [];
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    // String literals and template-literal chunks that look like class lists.
    // "…" (JSX attributes) and `…` may span lines; '…' stays on one line, since an apostrophe in JSX
    // text would otherwise open a "string" across code.
    const out = src.replace(/"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`|'((?:[^'\\\n]|\\.)*)'/g, (lit, dq, bt, sq) => {
      const q = dq != null ? '"' : bt != null ? "`" : "'";
      const body = dq ?? bt ?? sq;
      if (!/(^|\s|:)!?-?(m[lr]|p[lr]|left|right|text-(left|right)|border-[lr]|rounded-([lr]|[tb][lr])|float-|scroll-[mp][lr])\b/.test(body)) return lit;
      if (/import |from |https?:/.test(body)) return lit;
      if (/^[A-Z][a-z]+ |[a-z]\.$/.test(body)) return lit; // prose, not a class list
      const next = convertClassString(body);
      if (next !== body) tokens += body.split(/\s+/).filter((t, i) => t !== next.split(/\s+/)[i]).length;
      return `${q}${next}${q}`;
    });
    for (const [i, line] of src.split("\n").entries()) if (REVIEW.test(line) && /className|cn\(|clsx/.test(line)) review.push(`${path.relative(root, f)}:${i + 1}`);
    if (out !== src) {
      changed++;
      if (!check) fs.writeFileSync(f, out);
    }
  }
  console.log(`${check ? "would change" : "changed"} ${changed} files, ~${tokens} classes`);
  if (review.length) console.log(`Review by hand (${review.length}):\n  ${review.slice(0, 60).join("\n  ")}`);
}
