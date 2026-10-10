import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = 'program/audits/website/parity';
const beforeLabel = 'v3-catalog-final-before', afterLabel = 'v3-catalog-final-after';
const before = JSON.parse(fs.readFileSync(path.join(root, beforeLabel, 'manifest.json'), 'utf8'));
const after = JSON.parse(fs.readFileSync(path.join(root, afterLabel, 'manifest.json'), 'utf8'));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const source = 'apps/website/landing-directions/src/reference/purchase-catalog.js';
const original = spawnSync('git', ['show', `eaea1e5:${source}`]);
if (original.status !== 0) throw Error('Missing exact adapter reference');
if (before.captures.length !== 168 || after.captures.length !== 168) throw Error('Unexpected capture total');
const captures = before.captures.map(b => {
  const a = after.captures.find(c => c.name === b.name);
  if (!a || b.failed || a.failed || !b.rendered || !a.rendered || b.errors || a.errors) throw Error(`Unaccepted ${b.name}`);
  const beforeBytes = fs.readFileSync(path.join(root, beforeLabel, `${b.name}.png`));
  const afterBytes = fs.readFileSync(path.join(root, afterLabel, `${b.name}.png`));
  if (!beforeBytes.equals(afterBytes)) throw Error(`Image bytes changed: ${b.name}`);
  const x = JSON.parse(fs.readFileSync(path.join(root, beforeLabel, `${b.name}.json`), 'utf8'));
  const y = JSON.parse(fs.readFileSync(path.join(root, afterLabel, `${b.name}.json`), 'utf8'));
  if (x.text !== y.text || x.aria !== y.aria || JSON.stringify(x.headings) !== JSON.stringify(y.headings)) throw Error(`Content changed: ${b.name}`);
  for (const key of ['renderer', 'warmPaint', 'mediaLock']) if (b[key] !== a[key]) throw Error(`Capture protocol changed: ${b.name}`);
  return { name: b.name, route: b.route, width: b.width, beforeSHA256: digest(beforeBytes), afterSHA256: digest(afterBytes) };
});
const result = {
  scope: 'Equal-fixture website source/data parity, 56 logical routes at390/768/1440',
  before: { label: beforeLabel, adapterReference: `eaea1e5:${source}`, adapterBlobSHA256: digest(original.stdout) },
  after: { label: afterLabel, adapterSHA256: digest(fs.readFileSync(source)) },
  result: { comparisons: 168, changedPixels: 0, textEqual: true, headingsEqual: true, accessibilityWithoutLinkURLsEqual: true },
  protocol: 'Matching per-capture software renderer/media lock; Home warm paint at each width. Existing video frame held at time0; decoded completed images settled. No CSS/source visual edits, hidden elements, masks or tolerance changes.',
  history: 'First default comparison166/168 exact: Home one-channel pixel and Services autoplay video. Matched final protocol passes168. One cold /software/crm after failure recovered at all three widths. Initial reports retained.',
  report: `diff-${beforeLabel}-vs-${afterLabel}.md`,
  captures,
};
fs.writeFileSync('program/audits/v3-p3/catalog-parity-review.json', JSON.stringify(result, null, 2) + '\n');
console.log(`Recorded ${captures.length} accepted image hash pairs; ${captures.filter(c => c.beforeSHA256 === c.afterSHA256).length} identical PNG byte pairs`);
