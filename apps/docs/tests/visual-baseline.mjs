import fs from "node:fs";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

// Missing references fail ordinary checks. Creating/replacing one requires explicit --update;
// never make a CI gate green by silently writing an unreviewed image into the baseline folder.
export function compareVisualBaseline(shot, basePath, { update = false } = {}) {
  if (update) {
    fs.writeFileSync(basePath, PNG.sync.write(shot));
    return { visual: "updated", changed: 0 };
  }
  if (!fs.existsSync(basePath)) return { visual: "missing baseline", changed: 0 };
  const base = PNG.sync.read(fs.readFileSync(basePath));
  if (base.width !== shot.width || base.height !== shot.height) {
    return { visual: `size ${base.width}×${base.height} → ${shot.width}×${shot.height}`, changed: 0 };
  }
  const diff = new PNG({ width: base.width, height: base.height });
  const changed = pixelmatch(base.data, shot.data, diff.data, base.width, base.height, { threshold: 0.1 });
  return { visual: changed ? `${changed} px` : "same", changed, diff };
}
