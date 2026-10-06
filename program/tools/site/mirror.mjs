// S5 (D-036): the website's physical directions become logical ones, so an Arabic page (dir=rtl) is
// the same design mirrored, while English (ltr) stays pixel-identical (proved by the parity harness).
//
//   node mirror.mjs [--dry]          SITE_APP=<landing-directions of a checkout> to work on another one
//
// CSS (postcss): margin/padding/border-left|right → *-inline-start|end, left|right → inset-inline-*,
// text-align/float/clear left|right → start|end / inline-start|end, the four corner radii → their
// logical names, and the 4-value shorthands (margin, padding, inset, border-radius) whose left and
// right differ → their block/inline (or corner) longhands.
// JSX (Babel): the same keys and values inside style objects (a style={…} attribute, or an object
// whose other keys are CSS properties).
// Kept physical on purpose: centring (left: 50% with translate(-50%)), which is symmetric.
// Reported, not changed: transforms with translateX, gradients "to left/right", background
// positions, box-shadow x offsets, cursors: each needs a [dir=rtl] rule written by hand.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..", "..", "..");
const APP = process.env.SITE_APP ?? path.join(ROOT, "orgtik-website", "landing-directions");
const requireApp = createRequire(path.join(APP, "package.json"));
const postcss = requireApp("postcss");
const { parse } = createRequire(path.join(ROOT, "local-dev", "package.json"))("@babel/parser");
const DRY = process.argv.includes("--dry");

const CSS_PROPS = {
  "margin-left": "margin-inline-start", "margin-right": "margin-inline-end",
  "padding-left": "padding-inline-start", "padding-right": "padding-inline-end",
  "border-left": "border-inline-start", "border-right": "border-inline-end",
  "border-left-width": "border-inline-start-width", "border-right-width": "border-inline-end-width",
  "border-left-color": "border-inline-start-color", "border-right-color": "border-inline-end-color",
  "border-left-style": "border-inline-start-style", "border-right-style": "border-inline-end-style",
  left: "inset-inline-start", right: "inset-inline-end",
  "border-top-left-radius": "border-start-start-radius", "border-top-right-radius": "border-start-end-radius",
  "border-bottom-left-radius": "border-end-start-radius", "border-bottom-right-radius": "border-end-end-radius",
  "scroll-padding-left": "scroll-padding-inline-start", "scroll-padding-right": "scroll-padding-inline-end",
  "scroll-margin-left": "scroll-margin-inline-start", "scroll-margin-right": "scroll-margin-inline-end",
};
const VALUE_PROPS = { "text-align": { left: "start", right: "end" }, float: { left: "inline-start", right: "inline-end" }, clear: { left: "inline-start", right: "inline-end" } };
const REVIEW = /translateX\(|translate\(|translate3d\(|to (left|right)|\b(left|right) (top|bottom|center)\b|background-position|box-shadow|[ew]-resize|scaleX\(-1\)/;
// Only what actually changes in RTL: a horizontal move or offset that isn't 0 or the -50% of centring.
function needsReview(text) {
  if (!REVIEW.test(text)) return false;
  for (const m of text.matchAll(/translate(?:X|3d)?\(\s*([^,)\s]+)/g)) if (!/^(0|0px|-50%)$/.test(m[1])) return true;
  if (/to (left|right)|\b(left|right) (top|bottom|center)\b|[ew]-resize|scaleX\(-1\)/.test(text)) return true;
  for (const m of text.matchAll(/box-shadow:\s*(inset\s+)?(-?[\d.]+)(px|rem|em)?\s/g)) if (Number(m[2]) !== 0) return true;
  if (/boxShadow/.test(text)) { const m = text.match(/["'](inset\s+)?(-?[\d.]+)(px)?\s/); if (m && Number(m[2]) !== 0) return true; }
  return false;
}
const centred = (decls) => decls.some((d) => /translate(X|3d)?\(\s*-50%/.test(d.value));

// Splits a shorthand value on top-level spaces (not inside calc() or var()).
function parts(v) {
  const out = []; let depth = 0, cur = "";
  for (const ch of v.trim()) {
    if (ch === "(") depth++; if (ch === ")") depth--;
    if (/\s/.test(ch) && depth === 0) { if (cur) out.push(cur); cur = ""; } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

const review = [];
let cssChanges = 0, jsxChanges = 0;

function mirrorCss(file) {
  const src = fs.readFileSync(file, "utf8");
  const root = postcss.parse(src, { from: file });
  root.walkRules((rule) => {
    const decls = rule.nodes.filter((n) => n.type === "decl");
    for (const d of decls) {
      const prop = d.prop.toLowerCase();
      if (needsReview(`${prop}: ${d.value}`) && !/^(left|right)$/.test(prop)) review.push(`${path.relative(APP, file)}:${d.source.start.line}  ${rule.selector.replace(/\s+/g, " ").slice(0, 60)} { ${prop}: ${d.value} }`);
      if ((prop === "left" || prop === "right") && d.value.trim() === "50%" && centred(decls)) continue; // centring
      if (CSS_PROPS[prop]) { d.prop = CSS_PROPS[prop]; cssChanges++; continue; }
      if (VALUE_PROPS[prop] && VALUE_PROPS[prop][d.value.trim()]) { d.value = VALUE_PROPS[prop][d.value.trim()]; cssChanges++; continue; }
      if (["margin", "padding", "inset"].includes(prop)) {
        const p = parts(d.value);
        if (p.length === 4 && p[1] !== p[3] && !p.includes("!important")) {
          const block = p[0] === p[2] ? p[0] : `${p[0]} ${p[2]}`;
          d.cloneBefore({ prop: `${prop}-block`, value: block });
          d.cloneBefore({ prop: `${prop}-inline`, value: `${p[3]} ${p[1]}` });
          d.remove();
          cssChanges++;
        }
      }
      if (prop === "border-radius" && !d.value.includes("/")) {
        const p = parts(d.value);
        if (p.length === 4 && (p[0] !== p[1] || p[3] !== p[2])) {
          [["start-start", p[0]], ["start-end", p[1]], ["end-end", p[2]], ["end-start", p[3]]].forEach(([c, v]) => d.cloneBefore({ prop: `border-${c}-radius`, value: v }));
          d.remove();
          cssChanges++;
        } else if (p.length === 3 && p[0] !== p[1]) {
          // a b c = TL, TR+BL, BR
          [["start-start", p[0]], ["start-end", p[1]], ["end-end", p[2]], ["end-start", p[1]]].forEach(([c, v]) => d.cloneBefore({ prop: `border-${c}-radius`, value: v }));
          d.remove();
          cssChanges++;
        }
      }
    }
  });
  const out = root.toString();
  if (out !== src && !DRY) fs.writeFileSync(file, out);
  return out !== src;
}

// ---- JSX style objects ----
const JS_KEYS = {
  marginLeft: "marginInlineStart", marginRight: "marginInlineEnd", paddingLeft: "paddingInlineStart", paddingRight: "paddingInlineEnd",
  borderLeft: "borderInlineStart", borderRight: "borderInlineEnd", borderLeftColor: "borderInlineStartColor", borderRightColor: "borderInlineEndColor",
  borderLeftWidth: "borderInlineStartWidth", borderRightWidth: "borderInlineEndWidth", left: "insetInlineStart", right: "insetInlineEnd",
  borderTopLeftRadius: "borderStartStartRadius", borderTopRightRadius: "borderStartEndRadius", borderBottomLeftRadius: "borderEndStartRadius", borderBottomRightRadius: "borderEndEndRadius",
};
const CSSISH = new Set(["position", "top", "bottom", "width", "height", "display", "zIndex", "transform", "background", "color", "opacity", "inset", "margin", "padding", "fontSize", "pointerEvents", "overflow", "borderRadius", "maxWidth", "minWidth", "gap", "flex", "alignItems", "justifyContent", "textAlign", "border", "boxShadow", "transition", "lineHeight", "fontWeight", "letterSpacing", "gridTemplateColumns", "objectFit", "filter", "mixBlendMode", "backgroundImage", "cursor", "visibility", "outline", "whiteSpace"]);
const keyName = (p) => (p.key.type === "Identifier" ? p.key.name : p.key.type === "StringLiteral" ? p.key.value : null);

function mirrorJsx(file) {
  const src = fs.readFileSync(file, "utf8");
  const ast = parse(src, { sourceType: "module", plugins: ["jsx"] });
  const edits = [];
  const styleObjects = new Set();
  (function mark(n, parent) {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) return n.forEach((x) => mark(x, parent));
    if (n.type === "JSXAttribute" && n.name?.name === "style" && n.value?.expression?.type === "ObjectExpression") styleObjects.add(n.value.expression);
    if (n.type === "ObjectExpression") {
      const keys = n.properties.filter((p) => p.type === "ObjectProperty").map(keyName);
      if (keys.some((k) => CSSISH.has(k) || (k && /^(margin|padding|border)[A-Z]/.test(k)))) styleObjects.add(n);
    }
    for (const [k, v] of Object.entries(n)) if (k !== "loc" && v && typeof v === "object") mark(v, n);
  })(ast.program);
  for (const obj of styleObjects) {
    const props = obj.properties.filter((p) => p.type === "ObjectProperty");
    const transform = props.find((p) => keyName(p) === "transform");
    const isCentred = transform && /translate(X|3d)?\(\s*-50%/.test(src.slice(transform.value.start, transform.value.end));
    for (const p of props) {
      const k = keyName(p);
      const valueSrc = src.slice(p.value.start, p.value.end);
      if ((k === "transform" || k === "background" || k === "backgroundImage" || k === "backgroundPosition" || k === "boxShadow") && needsReview(`${k}: ${valueSrc}`)) {
        review.push(`${path.relative(APP, file)}:${p.loc.start.line}  { ${k}: ${valueSrc.slice(0, 70)} }`);
      }
      if ((k === "left" || k === "right") && isCentred && /^["']50%["']$/.test(valueSrc)) continue;
      if (JS_KEYS[k] && !p.computed) {
        edits.push({ start: p.key.start, end: p.key.end, text: JS_KEYS[k] });
        jsxChanges++;
      }
      if (k === "textAlign" || k === "float") {
        // string literals, also inside a ternary
        (function vals(v) {
          if (!v) return;
          if (v.type === "StringLiteral" && (v.value === "left" || v.value === "right")) {
            const to = k === "textAlign" ? (v.value === "left" ? "start" : "end") : v.value === "left" ? "inline-start" : "inline-end";
            edits.push({ start: v.start, end: v.end, text: JSON.stringify(to) });
            jsxChanges++;
          } else if (v.type === "ConditionalExpression") { vals(v.consequent); vals(v.alternate); }
        })(p.value);
      }
    }
  }
  if (!edits.length) return false;
  let out = src;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  if (!DRY) fs.writeFileSync(file, out);
  return true;
}

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(path.join(APP, "src")).concat([path.join(APP, "index.html")].filter(fs.existsSync));
let cssFiles = 0, jsxFiles = 0;
for (const f of files) {
  if (f.endsWith(".css") && mirrorCss(f)) cssFiles++;
  if (/\.(jsx)$/.test(f) && mirrorJsx(f)) jsxFiles++;
}
console.log(`${DRY ? "would change" : "changed"}: CSS ${cssChanges} declarations in ${cssFiles} files, JSX ${jsxChanges} style keys/values in ${jsxFiles} files`);
console.log(`Review by hand for RTL (${review.length}):`);
for (const r of review) console.log("  " + r);
