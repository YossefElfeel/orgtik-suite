// Compares two captures, capture by capture:
// - Pixels, with pixelmatch at threshold 0: any changed pixel counts, anti-aliasing included.
// - The visible text, the headings and the accessibility tree (link URLs excluded, see site.mjs).
// It exits 1 on any difference, and writes a report plus a diff image for each changed screenshot.
//
//   node diff.mjs --base pre-cms --head check
//
// Writes audits/website/parity/diff-<base>-vs-<head>.md and the images in diff-<base>-vs-<head>/.
import fs from "node:fs";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { OUT, args } from "./lib/site.mjs";

const opt = args({ base: "pre-cms", head: "check" });
const root = path.join(OUT, "parity");
const baseDir = path.join(root, String(opt.base));
const headDir = path.join(root, String(opt.head));
const name = `diff-${opt.base}-vs-${opt.head}`;
const outDir = path.join(root, name);
const relativeOutput = path.relative(path.resolve(root), path.resolve(outDir));
if (!relativeOutput || relativeOutput === '..' || relativeOutput.startsWith(`..${path.sep}`) || path.isAbsolute(relativeOutput)) throw new Error('Diff output must remain inside the website parity directory.');
for (const d of [baseDir, headDir]) if (!fs.existsSync(path.join(d, "manifest.json"))) throw new Error(`No capture at ${path.relative(OUT, d)}`);
fs.rmSync(outDir, { recursive: true, force: true });

const manifest = (d) => JSON.parse(fs.readFileSync(path.join(d, "manifest.json"), "utf8"));
const [base, head] = [manifest(baseDir), manifest(headDir)];
if (opt.exclude) {
  base.captures = base.captures.filter(c => c.route !== String(opt.exclude));
  head.captures = head.captures.filter(c => c.route !== String(opt.exclude));
}
const headNames = new Set(head.captures.map((c) => c.name));

// The first line that differs, with its line number: enough to find the change.
function firstDifference(a, b) {
  const [x, y] = [String(a).split("\n"), String(b).split("\n")];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] !== y[i]) return `line ${i + 1}: "${(x[i] ?? "(none)").slice(0, 80)}" → "${(y[i] ?? "(none)").slice(0, 80)}"`;
  }
  return "";
}

const rows = [];
for (const c of base.captures) {
  const row = { name: c.name, route: c.route, width: c.width, problems: [] };
  if (!headNames.has(c.name)) row.problems.push("missing from head");
  else if (c.failed) row.problems.push(`base capture failed: ${c.failed}`);
  else {
    const candidate = head.captures.find(item => item.name === c.name);
    const settings = (capture, source) => ({ renderer: capture.renderer || source.renderer || 'default', warmPaint: capture.warmPaint ?? source.warmPaint === true, mediaLock: capture.mediaLock === true });
    if (candidate.failed || !candidate.rendered) row.problems.push(`head capture failed: ${candidate.failed || 'never rendered'}`);
    if (JSON.stringify(settings(c, base)) !== JSON.stringify(settings(candidate, head))) row.problems.push('capture renderer/paint protocol differs');
    const [bp, hp] = [path.join(baseDir, `${c.name}.png`), path.join(headDir, `${c.name}.png`)];
    if (!fs.existsSync(bp) || !fs.existsSync(hp)) row.problems.push("screenshot missing");
    else {
      const [a, b] = [PNG.sync.read(fs.readFileSync(bp)), PNG.sync.read(fs.readFileSync(hp))];
      if (a.width !== b.width || a.height !== b.height) row.problems.push(`size ${a.width}×${a.height} → ${b.width}×${b.height}`);
      else {
        const diff = new PNG({ width: a.width, height: a.height });
        const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
        if (changed) {
          fs.mkdirSync(outDir, { recursive: true });
          fs.writeFileSync(path.join(outDir, `${c.name}.png`), PNG.sync.write(diff));
          row.problems.push(`${changed} pixels changed`);
        }
      }
    }
    const [bj, hj] = [path.join(baseDir, `${c.name}.json`), path.join(headDir, `${c.name}.json`)];
    if (fs.existsSync(bj) && fs.existsSync(hj)) {
      const [x, y] = [JSON.parse(fs.readFileSync(bj, "utf8")), JSON.parse(fs.readFileSync(hj, "utf8"))];
      if (x.text !== y.text) row.problems.push(`text, ${firstDifference(x.text, y.text)}`);
      if (x.headings.join("\n") !== y.headings.join("\n")) row.problems.push(`headings, ${firstDifference(x.headings.join("\n"), y.headings.join("\n"))}`);
      if (x.aria !== y.aria) row.problems.push(`accessibility tree, ${firstDifference(x.aria, y.aria)}`);
    }
  }
  rows.push(row);
}
const extra = head.captures.filter((c) => !base.captures.some((b) => b.name === c.name)).map((c) => c.name);

const bad = rows.filter((r) => r.problems.length);
const md = [
  `# Website parity: ${opt.base} vs ${opt.head}`,
  "",
  `- **Base:** \`${opt.base}\`, site commit ${base.commit.head}${base.commit.dirty ? " (uncommitted changes)" : ""}, captured ${base.at.slice(0, 16)}`,
  `- **Head:** \`${opt.head}\`, site commit ${head.commit.head}${head.commit.dirty ? " (uncommitted changes)" : ""}, captured ${head.at.slice(0, 16)}`,
  "",
  `**${bad.length ? `${bad.length} of ${rows.length} captures differ` : `All ${rows.length} captures are identical`}**: pixels at threshold 0, text, headings, and the accessibility tree without link URLs.`,
  "",
];
if (bad.length) {
  md.push("| Capture | Differences |", "|---|---|");
  for (const r of bad) md.push(`| \`${r.route}\` at ${r.width} | ${r.problems.join("; ").replace(/\|/g, "\\|")} |`);
  md.push("", `Diff images: \`${name}/\` (changed pixels in red).`);
}
if (extra.length) md.push("", `Captured only in head: ${extra.join(", ")}.`);
fs.writeFileSync(path.join(root, `${name}.md`), md.join("\n").trimEnd() + "\n");
console.log(md.slice(4).join("\n"));
if (bad.length) process.exitCode = 1;
