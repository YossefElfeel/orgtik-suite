// Raw colours -> @orgtik/ui semantic tokens, so a screen follows the theme (light/dark) and the brand.
//
//   node colors-to-tokens.mjs <app dir> [--check] [--report]
//
// Converts, inside class-looking string literals:
//   - Tailwind default palette:  text-gray-500 -> text-fg-subtle, bg-red-50 -> bg-danger-subtle,
//     bg-emerald-500 -> bg-success-solid, border-blue-200 -> border-info/30, bg-white -> bg-raised
//   - arbitrary hex:             text-[#596375] -> text-fg-muted, bg-[#ecfdf5] -> bg-success-subtle
// Neutrals go by lightness (ink: fg / fg-muted / fg-subtle; surfaces: raised / sunken; lines: line /
// line-strong). Hues go by family to a status tone (success, danger, warning, info) or the brand.
// Variants, !, and /alpha are kept. Raw hex outside classes (style objects, chart configs, SVG) is
// only listed (--report): those need a person.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHADE_L = { 50: 0.97, 100: 0.94, 200: 0.89, 300: 0.82, 400: 0.7, 500: 0.6, 600: 0.5, 700: 0.42, 800: 0.33, 900: 0.25, 950: 0.17 };
const NEUTRAL = new Set(["slate", "gray", "zinc", "neutral", "stone"]);
const FAMILY_TONE = {
  red: "danger", rose: "danger", pink: "danger",
  orange: "warning", amber: "warning", yellow: "warning",
  lime: "success", green: "success", emerald: "success", teal: "success",
  cyan: "info", sky: "info", blue: "info", indigo: "info",
  violet: "brand", purple: "brand", fuchsia: "brand",
};

function hexToHsl(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l, c: 0 };
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: hue * 60, s, l, c: d };
}
// Greys, including the cool blue-greys these apps use for ink, lines and surfaces (#596375, #E0E4EE,
// #F7F9FB). Light tints with a real hue (mint #ECFDF5, cream #FFF8ED, lavender #F5F1FF) keep their tone.
function isNeutral(h, s, l, c) {
  if (s < 0.12 || c < 0.035 || l > 0.985 || l < 0.03) return true;
  if (l < 0.85 && c < 0.22 && s < 0.4) return true; // mid greys; light tints go by hue below
  return h >= 195 && h <= 240 && c < 0.1;
}
function toneOfHue(h) {
  if (h >= 345 || h < 15) return "danger";
  if (h < 65) return "warning";
  if (h < 175) return "success";
  if (h < 250) return "info";
  if (h < 320) return "brand";
  return "danger";
}

// One colour (tone or neutral, with a lightness) for one property -> the token utility's colour name.
function tokenFor(prop, tone, l) {
  const kind = prop === "bg" || prop === "from" || prop === "to" || prop === "via" ? "bg"
    : prop === "text" || prop === "placeholder" || prop === "decoration" || prop === "caret" ? "text"
    : "line"; // border*, ring, outline, divide, fill, stroke, accent
  if (tone === "neutral") {
    if (kind === "text") return l < 0.36 ? "fg" : l < 0.55 ? "fg-muted" : "fg-subtle";
    if (kind === "bg") return l >= 0.995 ? "raised" : l >= 0.93 ? "sunken" : l >= 0.85 ? "line" : l >= 0.55 ? "line-strong" : "fg";
    return l >= 0.85 ? "line" : "line-strong";
  }
  if (tone === "brand") {
    if (kind === "text") return "fg-brand";
    if (kind === "bg") return l >= 0.88 ? "brand-subtle" : "action-primary";
    return l >= 0.85 ? "fg-brand/30" : "fg-brand";
  }
  if (kind === "text") return tone;
  if (kind === "bg") return l >= 0.88 ? `${tone}-subtle` : `${tone}-solid`;
  return l >= 0.85 ? `${tone}/30` : tone;
}

const PROPS = "bg|text|border(?:-[trblxyse])?|ring|outline|divide|fill|stroke|from|to|via|placeholder|decoration|caret|accent";
const PALETTE_RE = new RegExp(`^(${PROPS})-(${[...NEUTRAL, ...Object.keys(FAMILY_TONE)].join("|")})-(\\d{2,3})(/\\d+)?$`);
const HEX_RE = new RegExp(`^(${PROPS})-\\[(#[0-9a-fA-F]{3,8})\\](/\\d+)?$`);
const BW_RE = /^(bg|text|border)-(white|black)(\/\d+)?$/;

function propBase(p) { return p.startsWith("border") ? p : p; }
function withAlpha(name, alpha) {
  if (!alpha) return name;
  return name.includes("/") ? name : `${name}${alpha}`; // a mapped subtle line already carries one
}

export function convertToken(token) {
  const m = token.match(/^((?:[^:\s]+:)*)(!?)(.*)$/);
  if (!m) return token;
  const [, variants, bang, core] = m;
  if (/(^|:)dark:/.test(variants)) return token; // already themed by hand
  let out = null;
  let p;
  if ((p = core.match(PALETTE_RE))) {
    const [, prop, family, shade, alpha] = p;
    const l = SHADE_L[shade];
    if (l == null) return token;
    const tone = NEUTRAL.has(family) ? "neutral" : FAMILY_TONE[family];
    out = `${propBase(prop)}-${withAlpha(tokenFor(prop, tone, l), alpha)}`;
  } else if ((p = core.match(HEX_RE))) {
    const [, prop, hex, alpha] = p;
    const { h, s, l, c } = hexToHsl(hex);
    // A hex alpha (#rrggbbaa) is dropped: the token's own colour stands.
    const tone = isNeutral(h, s, l, c) ? "neutral" : toneOfHue(h);
    out = `${propBase(prop)}-${withAlpha(tokenFor(prop, tone, l), alpha)}`;
  } else if ((p = core.match(BW_RE))) {
    const [, prop, bw, alpha] = p;
    // White text sits on solid fills (buttons, chips): leave it. White surfaces and black ink follow the theme.
    if (prop === "text" && bw === "white") return token;
    if (prop === "bg" && bw === "black") return token; // overlays and scrims: by hand
    const name = prop === "bg" ? "raised" : prop === "text" ? "fg" : bw === "white" ? "raised" : "fg";
    out = `${prop}-${withAlpha(name, alpha)}`;
  }
  return out ? `${variants}${bang}${out}` : token;
}

function convertClassString(s) {
  return s.split(/(\s+)/).map((t) => (/\s/.test(t) || !t ? t : convertToken(t))).join("");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = path.resolve(process.argv[2] ?? ".");
  const check = process.argv.includes("--check");
  const report = process.argv.includes("--report");
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return /node_modules|\.next|\.git|\.yalc/.test(e.name) ? [] : walk(p);
    return /\.(tsx|ts|jsx|js)$/.test(e.name) ? [p] : [];
  });
  const files = ["app", "components", "lib", "hooks", "constants", "utils"].map((d) => path.join(root, d)).filter(fs.existsSync).flatMap(walk);
  let changed = 0, count = 0;
  const pairs = new Map();
  const leftovers = [];
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    // "…" (JSX attributes) and `…` may span lines; '…' stays on one line, since an apostrophe in JSX
    // text would otherwise open a "string" across code.
    const out = src.replace(/"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`|'((?:[^'\\\n]|\\.)*)'/g, (lit, dq, bt, sq) => {
      const q = dq != null ? '"' : bt != null ? "`" : "'";
      const body = dq ?? bt ?? sq;
      if (!/(^|[\s:!])(?:[a-z-]+-(?:\[#|(?:slate|gray|zinc|neutral|stone|red|rose|pink|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia)-\d)|(?:bg|text|border)-(?:white|black))/.test(body)) return lit;
      if (/import |from |https?:/.test(body)) return lit;
      const next = convertClassString(body);
      if (next !== body) {
        const a = body.split(/(\s+)/), b = next.split(/(\s+)/);
        a.forEach((t, i) => { if (t !== b[i]) { count++; const k = `${t.replace(/^(?:[^:\s]+:)*!?/, "")} -> ${b[i].replace(/^(?:[^:\s]+:)*!?/, "")}`; pairs.set(k, (pairs.get(k) ?? 0) + 1); } });
      }
      return `${q}${next}${q}`;
    });
    if (report) for (const [i, line] of out.split("\n").entries()) if (/#[0-9a-fA-F]{3,8}\b/.test(line) && !/^\s*(\/\/|\*)/.test(line)) leftovers.push(`${path.relative(root, f)}:${i + 1}  ${line.trim().slice(0, 140)}`);
    if (out !== src) { changed++; if (!check) fs.writeFileSync(f, out); }
  }
  console.log(`${check ? "would change" : "changed"} ${changed} files, ${count} classes`);
  if (check) console.log([...pairs].sort((a, b) => b[1] - a[1]).map(([k, n]) => `  ${String(n).padStart(3)}  ${k}`).join("\n"));
  if (report) console.log(`Raw hex left (${leftovers.length}):\n  ${leftovers.join("\n  ")}`);
}
