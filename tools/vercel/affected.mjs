// Select changed apps and their workspace dependents without promoting unrelated root files
// (program records, workflow edits, acceptance evidence) into a suite-wide rollout.
import fs from "node:fs";
import { selectDeploymentProjects } from './deployment-policy.mjs';
import { affectedPackagesForFiles, changedFilesBetween, readWorkspacePackages } from './changed-projects.mjs';

const manifest = JSON.parse(fs.readFileSync(new URL("./projects.json", import.meta.url), "utf8"));
const requested = (process.env.DEPLOY_PROJECTS || "").split(",").map(key => key.trim()).filter(Boolean);
const changedFiles = requested.length ? [] : changedFilesBetween({
  base: process.env.TURBO_SCM_BASE || 'origin/main',
  head: process.env.TURBO_SCM_HEAD || 'HEAD',
  pullRequest: process.env.GITHUB_EVENT_NAME === 'pull_request',
});
const affectedPackages = requested.length ? [] : affectedPackagesForFiles(changedFiles, readWorkspacePackages(manifest.projects), manifest.projects);
const projects = selectDeploymentProjects(manifest.projects, { affectedPackages, requested, environment: process.env.DEPLOY_ENV, manualMain: process.env.DEPLOY_MANUAL_MAIN === '1' });
console.error(`Deployment scope: ${projects.length ? projects.map(project => project.key).join(', ') : 'no changed deployable projects'}`);
console.log(JSON.stringify(projects));
