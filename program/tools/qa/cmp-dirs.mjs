// Compares two capture folders file by file (PNG pixels at threshold 0, and the JSON text,
// headings and accessibility snapshots). For a change limited to a few routes.
//   node cmp-dirs.mjs <labelA> <labelB>
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { OUT } from "./lib/site.mjs";
const [a, b] = process.argv.slice(2).map((l) => path.join(OUT, "parity", l));
let same = 0, diff = 0;
for (const f of fs.readdirSync(a).filter((f) => f.endsWith(".png"))) {
  const A = PNG.sync.read(fs.readFileSync(path.join(a, f)));
  const B = PNG.sync.read(fs.readFileSync(path.join(b, f)));
  const px = A.width === B.width && A.height === B.height ? pixelmatch(A.data, B.data, null, A.width, A.height, { threshold: 0 }) : -1;
  const ja = JSON.parse(fs.readFileSync(path.join(a, f.replace(".png", ".json")), "utf8"));
  const jb = JSON.parse(fs.readFileSync(path.join(b, f.replace(".png", ".json")), "utf8"));
  const pick = (j) => JSON.stringify({ text: j.text, headings: j.headings, a11y: j.a11y ?? j.tree });
  const ok = px === 0 && pick(ja) === pick(jb);
  ok ? same++ : diff++;
  console.log(`${ok ? "same" : "DIFF"} ${f} pixels:${px} text:${pick(ja) === pick(jb) ? "same" : "differs"}`);
}
console.log(`${same} identical, ${diff} different`);
