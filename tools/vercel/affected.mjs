// Map Turborepo's affected package graph (including @orgtik/ui dependents) onto Vercel projects.
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const manifest = JSON.parse(fs.readFileSync(new URL("./projects.json", import.meta.url), "utf8"));
const windows = process.platform === "win32";
const dry = JSON.parse(execFileSync(windows ? "pnpm.cmd" : "pnpm", ["exec", "turbo", "run", "build", "--affected", "--dry=json"], { encoding: "utf8", shell: windows, maxBuffer: 16 * 1024 * 1024 }));
if (!Array.isArray(dry.packages)) throw new Error("Turborepo did not return affected packages");
const affected = new Set(dry.packages);
const projects = Object.entries(manifest.projects).filter(([, project]) => affected.has(project.package)).map(([key, project]) => ({ key, ...project }));
console.log(JSON.stringify(projects));
