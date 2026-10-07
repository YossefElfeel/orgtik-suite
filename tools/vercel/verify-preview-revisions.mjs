// Verification-only runs are allowed only when the hosted application sources still match
// their successful deployments. Test/docs changes can be checked without consuming deploys.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function verifyPreviewRevisions(manifest, run = execFileSync) {
  if (manifest.profile !== "readiness" || !manifest.projects || Object.keys(manifest.projects).sort().join() !== "mock,sos,website") throw new Error("Readiness verification needs the three known deployed projects");
  for (const [key, record] of Object.entries(manifest.projects)) {
    if (!/^[a-f0-9]{40}$/.test(record.sha) || !Array.isArray(record.paths) || !record.paths.length) throw new Error(`${key}: missing deployment source provenance`);
    const changed = run("git", ["diff", "--name-only", "-z", record.sha, "HEAD", "--"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).split("\0").filter(Boolean);
    const unsafe = changed.filter(file => record.paths.some(path => path.endsWith("/") ? file.startsWith(path) : file === path));
    if (unsafe.length) throw new Error(`${key}: current application sources differ from the hosted preview; deploy before verification (${unsafe.join(", ")})`);
    console.log(`${key}: application source matches successful preview revision ${record.sha.slice(0, 7)}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) verifyPreviewRevisions(JSON.parse(fs.readFileSync(new URL("./preview-revisions.json", import.meta.url))));
