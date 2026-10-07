// API consumers need checks even when Turborepo finds no build-time dependency or deployment.
import { execFileSync } from "node:child_process";
import { projectManifest, selectRuntimeConsumers } from "../vercel/runtime-dependencies.mjs";

const base = process.env.TURBO_SCM_BASE || "origin/main";
const changedFiles = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
const { consumers } = selectRuntimeConsumers({ changedFiles });
const packages = [...new Set(consumers.map(key => projectManifest.projects[key].package))];
if (packages.length) {
  console.log(`Runtime consumer checks: ${consumers.join(", ")}`);
  execFileSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["exec", "turbo", "run", "typecheck", "i18n:check", "test", ...packages.map(name => `--filter=${name}`), "--continue"], { stdio: "inherit", shell: process.platform === "win32" });
} else console.log("No additional runtime consumer checks required.");
