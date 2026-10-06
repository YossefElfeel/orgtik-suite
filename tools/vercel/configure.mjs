// Writes the install, build and skip commands of every Vercel project into its vercel.json
// (other keys, such as the website's redirects, are kept). Run after adding a project or changing
// the commands:   node tools/vercel/configure.mjs [--check]
//
// - Install: the whole pnpm workspace with pnpm 11 (the lockfile's 9.0 format would otherwise make
//   Vercel pick an older pnpm that ignores pnpm-workspace.yaml's injected-package settings).
// - Build: pnpm builds the app and the workspace packages it depends on (@orgtik/ui first), and
//   re-copies the library into the app after its build.
// - Skip: `turbo query affected` exits 0 when nothing the project depends on changed since the
//   last deployment, which tells Vercel to skip the build; 1 (affected) or 2 (can't tell) builds.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PNPM = "npx --yes pnpm@11.3.0";
const TURBO = "npx --yes turbo@2.11.7";

export const PROJECTS = [
  { dir: "apps/sos", prebuild: true },
  { dir: "apps/tasks", prebuild: true },
  { dir: "apps/files", prebuild: true },
  { dir: "apps/sales", prebuild: true },
  { dir: "apps/hr", prebuild: true },
  { dir: "apps/marketing", prebuild: true },
  { dir: "apps/content", prebuild: true },
  { dir: "apps/chats" },
  { dir: "apps/wm" },
  { dir: "apps/admin" },
  { dir: "apps/website/landing-directions" },
  { dir: "mock", noBuild: true },
];

export function commandsFor(dir, { prebuild = false, noBuild = false } = {}) {
  const name = JSON.parse(fs.readFileSync(path.join(ROOT, dir, "package.json"), "utf8")).name;
  const up = dir.split("/").map(() => "..").join("/");
  const out = {
    installCommand: `cd ${up} && ${PNPM} install --frozen-lockfile`,
    ignoreCommand: `cd ${up} && ${TURBO} query affected --packages ${name} --exit-code --base "\${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"`,
  };
  if (!noBuild) out.buildCommand = `${prebuild ? `node ${up}/tools/vercel-prebuild.cjs && ` : ""}cd ${up} && ${PNPM} --filter "${name}..." run build`;
  return out;
}

const check = process.argv.includes("--check");
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  let stale = 0;
  for (const p of PROJECTS) {
    const file = path.join(ROOT, p.dir, "vercel.json");
    const current = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
    const next = { $schema: "https://openapi.vercel.sh/vercel.json", ...current, ...commandsFor(p.dir, p) };
    const text = JSON.stringify(next, null, 2) + "\n";
    const before = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    if (before !== text) {
      stale += 1;
      if (!check) fs.writeFileSync(file, text);
      console.log(`${check ? "stale" : "wrote"} ${p.dir}/vercel.json`);
    }
  }
  if (check && stale) process.exit(1);
  if (!stale) console.log("every vercel.json is up to date");
}
