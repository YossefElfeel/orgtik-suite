import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { affectedPackagesForFiles, changedFilesBetween, readWorkspacePackages } from "./changed-projects.mjs";
import { selectDeploymentProjects } from "./deployment-policy.mjs";

const projects = JSON.parse(fs.readFileSync(new URL("./projects.json", import.meta.url), "utf8")).projects;
const packages = readWorkspacePackages(projects);
const keysFor = files => selectDeploymentProjects(projects, {
  affectedPackages: affectedPackagesForFiles(files, packages, projects), environment: "production",
}).map(project => project.key).sort();

test("each changed dashboard selects just that dashboard, even alongside program and workflow changes", () => {
  for (const [key, project] of Object.entries(projects).filter(([, project]) => !project.retired)) {
    assert.deepEqual(keysFor([
      `${project.dir}/src/changed.tsx`, "program/plan-v2.md", "README.md",
      "program/audits/wm/preview.json", ".github/workflows/deploy.yml",
    ]), [key], key);
  }
  assert.deepEqual(keysFor(["apps/wm/page.tsx", "apps/admin/page.tsx"]), ["admin", "wm"]);
});

test("records, acceptance tooling, non-deployed workspaces and workflow changes deploy nothing", () => {
  assert.deepEqual(keysFor([
    "README.md", ".gitignore", ".github/workflows/deploy.yml", "program/plan-v2.md",
    "program/audits/wm/screenshot.png", "program/tools/audit-kit/wm.mjs",
    "apps/docs/stories/button.tsx", "tests/next-smoke-16/app/page.tsx",
    "tools/vercel/preview-checks.mjs", "tools/vercel/affected.mjs",
    "tools/vercel/preview-revisions.json", "tools/vercel/changed-projects.test.mjs",
  ]), []);
  assert.deepEqual(keysFor(["apps/content/src/retired.tsx"]), []);
});

test("shared UI changes deploy its actual consumers and leave API/public website untouched", () => {
  const expected = ["admin", "chats", "files", "hr", "marketing", "sales", "sos", "tasks", "wm"];
  assert.deepEqual(keysFor(["packages/ui/src/Button.tsx"]), expected);
});

test("reverse workspace dependency traversal includes transitive consumers", () => {
  const graph = [
    { name: "tokens", dir: "packages/tokens", dependencies: [] },
    { name: "ui", dir: "packages/ui", dependencies: ["tokens"] },
    { name: "app", dir: "apps/app", dependencies: ["ui"] },
    { name: "other", dir: "apps/other", dependencies: [] },
  ];
  assert.deepEqual(affectedPackagesForFiles(["packages/tokens/color.json"], graph, {}).sort(), ["app", "tokens", "ui"]);
});

test("shared build and dependency configuration preserves conservative active-project rollouts", () => {
  const all = Object.entries(projects).filter(([, project]) => !project.retired).map(([key]) => key).sort();
  for (const file of ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "turbo.json", ".npmrc", "patches/react.patch", "tools/vercel/projects.json"]) {
    assert.deepEqual(keysFor([file]), all, file);
  }
  assert.deepEqual(keysFor(["tools/vercel-prebuild.cjs"]), ["files", "hr", "marketing", "sales", "sos", "tasks"]);
  assert.deepEqual(keysFor(["tools/vercel/copy-mock-runtime.mjs"]), ["mock"]);
  assert.deepEqual(keysFor(["tools/vercel/workspace-runtime.mjs"]), ["mock"]);
});

test("the deployment CLI emits a clean matrix and preserves explicit manual scopes", () => {
  const run = overrides => JSON.parse(execFileSync(process.execPath, [path.join(import.meta.dirname, "affected.mjs")], {
    cwd: path.resolve(import.meta.dirname, "../.."), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, TURBO_SCM_BASE: "HEAD", TURBO_SCM_HEAD: "HEAD", GITHUB_EVENT_NAME: "push", DEPLOY_ENV: "production", DEPLOY_PROJECTS: "", DEPLOY_MANUAL_MAIN: "0", ...overrides },
  }));
  assert.deepEqual(run(), []);
  assert.deepEqual(run({ DEPLOY_PROJECTS: "wm", DEPLOY_ENV: "preview", TURBO_SCM_BASE: "missing-revision" }).map(project => project.key), ["wm"]);
  assert.deepEqual(run({ DEPLOY_PROJECTS: "tasks,mock", DEPLOY_MANUAL_MAIN: "1" }).map(project => project.key), ["mock", "tasks"]);
  assert.throws(() => run({ DEPLOY_PROJECTS: "content", DEPLOY_ENV: "preview" }));
  assert.throws(() => run({ TURBO_SCM_BASE: "missing-revision" }));
});

test("Git selection handles exact push ranges, PR merge bases, cross-app moves and missing history", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "orgtik-changed-projects-"));
  const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  };
  const commit = message => {
    git(["add", "."]);
    git(["-c", "user.name=Deployment test", "-c", "user.email=deployment-test@example.test", "commit", "-m", message]);
    return git(["rev-parse", "HEAD"]);
  };
  try {
    git(["init", "--initial-branch=main"]);
    write("apps/wm/old page.tsx", "initial\n");
    const initial = commit("Initial revision");
    git(["checkout", "-b", "feature"]);
    write("apps/wm/old page.tsx", "changed\n");
    const feature = commit("Change Website Manager");
    git(["checkout", "main"]);
    write("apps/admin/page.tsx", "unrelated main change\n");
    const main = commit("Unrelated admin change");
    assert.deepEqual(changedFilesBetween({ root, base: main, head: feature, pullRequest: true }), ["apps/wm/old page.tsx"]);
    assert.deepEqual(changedFilesBetween({ root, base: initial, head: main }), ["apps/admin/page.tsx"]);
    assert.deepEqual(changedFilesBetween({ root, base: main, head: main }), []);
    git(["checkout", "feature"]);
    fs.mkdirSync(path.join(root, "apps/tasks"), { recursive: true });
    git(["mv", "apps/wm/old page.tsx", "apps/tasks/new page.tsx"]);
    const moved = commit("Move source across apps");
    const changed = changedFilesBetween({ root, base: feature, head: moved });
    assert.deepEqual(changed.sort(), ["apps/tasks/new page.tsx", "apps/wm/old page.tsx"]);
    assert.deepEqual(keysFor(changed), ["tasks", "wm"]);
    assert.throws(() => changedFilesBetween({ root, base: "missing-revision", head: moved }));
    assert.throws(() => changedFilesBetween({ root, base: "0".repeat(40) }), /valid deployment base/);
    assert.throws(() => changedFilesBetween({ root }), /valid deployment base/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
