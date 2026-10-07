// Many program tools (program/tools/**) still address the apps by their pre-monorepo folder names
// next to the program (local-dev, somion-hr-dashboard-main, orgtik-website, ...). This creates
// those names at the repo root as links to the monorepo folders, so the tools run unchanged.
// The links are git-ignored. Remove them with --remove.
//   node tools/dev/old-layout-links.mjs [--remove]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const OLD_NAMES = {
  "local-dev": "mock",
  "orgtik-program": "program",
  "somion-sos-frontend-main": "apps/sos",
  "task-manager-front-main": "apps/tasks",
  "file-manager-dashboard-main": "apps/files",
  "sales-dashboardv2-main": "apps/sales",
  "somion-hr-dashboard-main": "apps/hr",
  "digital-marketing-frontend-main": "apps/marketing",
  "content-dashboard-somion-main": "apps/content",
  "somion-hq": "apps/chats",
  "orgtik-website-manager": "apps/wm",
  "orgtik-admin": "apps/admin",
  "orgtik-website": "apps/website",
};

const remove = process.argv.includes("--remove");
for (const [name, target] of Object.entries(OLD_NAMES)) {
  const link = path.join(ROOT, name);
  const exists = fs.existsSync(link) || (() => { try { fs.lstatSync(link); return true; } catch { return false; } })();
  if (exists) {
    if (!fs.lstatSync(link).isSymbolicLink()) {
      console.log(`skip ${name}: a real folder or file is there`);
      continue;
    }
    if (remove) fs.rmSync(link);
    else continue;
  }
  if (remove) continue;
  // A junction on Windows needs no special rights; elsewhere a directory symlink.
  fs.symlinkSync(path.join(ROOT, target), link, process.platform === "win32" ? "junction" : "dir");
  console.log(`${name} -> ${target}`);
}
