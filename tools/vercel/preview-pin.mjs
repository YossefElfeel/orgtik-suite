// Verification uses a recorded deployment under the workflow's shared preview lock.
// Restore the prior alias afterwards, including when acceptance fails.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { verifyPreviewRevisions } from "./verify-preview-revisions.mjs";

const teamId = "team_Ypx8oiLDZi3PBNi8ht8fYPsm";
const projectId = "prj_O5Xp99VEPyKOb6ImpcQEEoRN0Np2";
const alias = "orgtik-suite-mock-preview.vercel.app";
const stateFile = path.resolve(".preview-alias-state.json");
const hostname = value => {
  const url = new URL(value.startsWith("https://") ? value : `https://${value}`);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash || !/^orgtik-suite-mock-preview-[a-z0-9]+-yossef-elfeels-projects\.vercel\.app$/.test(url.hostname)) throw new Error("Expected an existing immutable mock-preview deployment");
  return url.hostname;
};

export async function withPreviewPin(mode, { request = globalThis.fetch, token = process.env.VERCEL_TOKEN, statePath = stateFile, manifest, verify = verifyPreviewRevisions } = {}) {
  if (!token) throw new Error("Preview verification requires the approved Vercel credential");
  const api = async (pathname, body) => {
    const response = await request(`https://api.vercel.com${pathname}${pathname.includes("?") ? "&" : "?"}teamId=${teamId}`, {
      method: body ? "POST" : "GET", redirect: "error", signal: AbortSignal.timeout(60000),
      headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`Preview alias operation answered ${response.status}`);
    return response.json();
  };
  const current = async () => {
    const value = await api(`/v4/aliases/${alias}?projectId=${projectId}`);
    if (value.projectId !== projectId || value.alias !== alias) throw new Error("Preview alias belongs to another project");
    return hostname(value.deployment?.url || "");
  };
  const assign = async target => {
    await api(`/v2/deployments/${encodeURIComponent(hostname(target))}/aliases`, { alias });
    if (await current() !== target) throw new Error("Preview alias did not select the expected deployment");
  };
  if (mode === "pin") {
    verify(manifest);
    const pinned = hostname(manifest.projects.mock.deploymentUrl);
    const deployment = await api(`/v13/deployments/${encodeURIComponent(pinned)}`);
    if (deployment.projectId !== projectId || deployment.readyState !== "READY" || deployment.target === "production") throw new Error("Recorded mock deployment is not a ready preview in the expected project");
    const previous = await current();
    fs.writeFileSync(statePath, JSON.stringify({ previous, pinned }), { mode: 0o600 });
    await assign(pinned);
    console.log("Existing recorded mock preview selected for verification");
  } else if (mode === "restore") {
    if (!fs.existsSync(statePath)) return;
    const { previous: rawPrevious, pinned: rawPinned } = JSON.parse(fs.readFileSync(statePath, "utf8"));
    const previous = hostname(rawPrevious), pinned = hostname(rawPinned), active = await current();
    if (active !== previous) {
      if (active !== pinned) throw new Error("Preview alias changed externally; refusing to overwrite its new target");
      await assign(previous);
    }
    fs.rmSync(statePath);
    console.log("Previous mock preview alias restored");
  } else throw new Error("Expected pin or restore");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await withPreviewPin(process.argv[2], {
  manifest: JSON.parse(fs.readFileSync(new URL("./preview-revisions.json", import.meta.url), "utf8")),
});
