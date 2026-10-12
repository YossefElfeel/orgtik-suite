// Deployment scope is based on source paths, not Turbo's repository-wide task scope.
// In particular, program records, CI workflows and acceptance evidence are not app sources.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const ROOT = path.resolve(import.meta.dirname, "../..");
const GLOBAL_BUILD_FILES = new Set([
  "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", ".npmrc",
  "turbo.json", "turbo.jsonc", "tools/vercel/projects.json",
]);
const MOCK_BUILD_FILES = new Set([
  "tools/vercel/copy-mock-runtime.mjs", "tools/vercel/workspace-runtime.mjs",
]);
const LAUNCHER_PROJECTS = new Set(["sos", "tasks", "files", "sales", "hr", "marketing", "content"]);

export function readWorkspacePackages(projects, root = ROOT) {
  const dirs = new Set(Object.values(projects).filter(project => !project.retired).map(project => project.dir));
  const shared = path.join(root, "packages");
  if (fs.existsSync(shared)) {
    for (const entry of fs.readdirSync(shared, { withFileTypes: true })) {
      if (entry.isDirectory() && fs.existsSync(path.join(shared, entry.name, "package.json"))) dirs.add(`packages/${entry.name}`);
    }
  }
  return [...dirs].map(dir => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, dir, "package.json"), "utf8"));
    return { dir, name: pkg.name, dependencies: Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies, ...pkg.peerDependencies }) };
  });
}

export function affectedPackagesForFiles(changedFiles, packages, projects) {
  const affected = new Set();
  for (const file of changedFiles) {
    // Dependency/toolchain changes can alter every build. Keep these conservative.
    if (GLOBAL_BUILD_FILES.has(file) || file.startsWith("patches/")) return packages.map(pkg => pkg.name);
    for (const pkg of packages) {
      if (file.startsWith(`${pkg.dir}/`)) affected.add(pkg.name);
    }
    if (MOCK_BUILD_FILES.has(file) && projects.mock && !projects.mock.retired) affected.add(projects.mock.package);
    if (file === "tools/vercel-prebuild.cjs") {
      for (const [key, project] of Object.entries(projects)) {
        if (LAUNCHER_PROJECTS.has(key) && !project.retired) affected.add(project.package);
      }
    }
  }
  // Walk reverse workspace dependencies: a shared package change rebuilds its consumers,
  // while an API change deploys just the API (runtime consumers are checked separately).
  let previousSize;
  do {
    previousSize = affected.size;
    for (const pkg of packages) {
      if (pkg.dependencies.some(name => affected.has(name))) affected.add(pkg.name);
    }
  } while (affected.size !== previousSize);
  return [...affected];
}

export function changedFilesBetween({ base, head = "HEAD", pullRequest = false, root = ROOT } = {}) {
  if (!base || /^0+$/.test(base)) throw new Error("A valid deployment base revision is required; refusing to deploy the whole suite as a fallback");
  const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 16 * 1024 * 1024 }).trim();
  // Resolve to commits before constructing the diff; missing history fails the workflow.
  const baseSha = git(["rev-parse", "--verify", "--end-of-options", `${base}^{commit}`]);
  const headSha = git(["rev-parse", "--verify", "--end-of-options", `${head}^{commit}`]);
  const comparisonBase = pullRequest ? git(["merge-base", baseSha, headSha]) : baseSha;
  // No rename detection: both sides of a cross-app move must enter the deployment matrix.
  return git(["diff", "--name-only", "--no-renames", "-z", comparisonBase, headSha, "--"]).split("\0").filter(Boolean);
}
