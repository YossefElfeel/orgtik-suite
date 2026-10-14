import fs from "node:fs";
import path from "node:path";

// The adapter may rename index.js to index.cjs and rewrite its imports. Once
// original runtime files are restored, restore the declared entry too so it
// imports those files rather than stale compiled aliases.
export function restoreRuntimeEntry(runtime, entry, folder) {
  const target = path.resolve(entry), relative = path.relative(path.resolve(folder), target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative) || !/\.(?:js|cjs)$/.test(target)) throw new Error("Unexpected mock entry path.");
  fs.copyFileSync(path.join(runtime, "index.js"), target);
}
