// Map Turborepo's affected package graph (including @orgtik/ui dependents) onto Vercel projects.
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const manifest = JSON.parse(fs.readFileSync(new URL("./projects.json", import.meta.url), "utf8"));
const windows = process.platform === "win32";
const dry = JSON.parse(execFileSync(windows ? "pnpm.cmd" : "pnpm", ["exec", "turbo", "run", "build", "--affected", "--dry=json"], { encoding: "utf8", shell: windows, maxBuffer: 16 * 1024 * 1024 }));
if (!Array.isArray(dry.packages)) throw new Error("Turborepo did not return affected packages");
const affected = new Set(dry.packages);
const requested = (process.env.DEPLOY_PROJECTS || "").split(",").map(key => key.trim()).filter(Boolean);
for (const key of requested) if (!manifest.projects[key]) throw new Error(`Unknown requested deployment project: ${key}`);
if (requested.length && process.env.DEPLOY_ENV !== "preview" && process.env.DEPLOY_MANUAL_MAIN !== "1") throw new Error("A limited project selection is only allowed for previews");
const priority = ["mock", "sos", "website"];
const projects = Object.entries(manifest.projects)
  .filter(([key, project]) => requested.length ? requested.includes(key) : affected.has(project.package))
  .map(([key, project]) => ({ key, ...project }))
  .sort((a, b) => (priority.indexOf(a.key) < 0 ? priority.length : priority.indexOf(a.key)) - (priority.indexOf(b.key) < 0 ? priority.length : priority.indexOf(b.key)));
console.log(JSON.stringify(projects));
