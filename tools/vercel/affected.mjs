// Map Turborepo's affected package graph (including @orgtik/ui dependents) onto Vercel projects.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { selectDeploymentProjects } from './deployment-policy.mjs';

const manifest = JSON.parse(fs.readFileSync(new URL("./projects.json", import.meta.url), "utf8"));
const windows = process.platform === "win32";
const dry = JSON.parse(execFileSync(windows ? "pnpm.cmd" : "pnpm", ["exec", "turbo", "run", "build", "--affected", "--dry=json"], { encoding: "utf8", shell: windows, maxBuffer: 16 * 1024 * 1024 }));
if (!Array.isArray(dry.packages)) throw new Error("Turborepo did not return affected packages");
const requested = (process.env.DEPLOY_PROJECTS || "").split(",").map(key => key.trim()).filter(Boolean);
const projects = selectDeploymentProjects(manifest.projects, { affectedPackages: dry.packages, requested, environment: process.env.DEPLOY_ENV, manualMain: process.env.DEPLOY_MANUAL_MAIN === '1' });
console.log(JSON.stringify(projects));
