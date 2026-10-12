// Non-destructive hosted checks. Business resets and account creation belong to preview flows.
import fs from "node:fs";
import { mintPreviewTokens, protectedFetch, previewShellPath } from "./preview-protection.mjs";
const [file] = process.argv.slice(2);
const { key, url } = JSON.parse(fs.readFileSync(file, "utf8"));
const preview = new URL(url).hostname.endsWith("-preview.vercel.app");
const request = preview ? protectedFetch(mintPreviewTokens([key])) : fetch;
// Tool homepages may intentionally hand off to SOS. Check their own sign-in shell.
const shellPath = previewShellPath(key);
const response = await request(url + shellPath, { redirect: "follow", signal: AbortSignal.timeout(60000) });
if (!response.ok) throw new Error(`${key}: deployed page answered ${response.status}`);
if (new URL(response.url).origin !== new URL(url).origin) throw new Error(`${key}: hosted smoke was redirected away from the deployment (check preview protection credentials)`);
if (key === "mock") {
  const login = await request(`${url}/sos/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "mona.adel@orgtik.test", password: "Local@2026" }), signal: AbortSignal.timeout(60000) });
  if (!login.ok) throw new Error(`mock: demo sign-in answered ${login.status}`);
  const token = (await login.json()).data.tokens.accessToken;
  for (const path of ["/sos/api/auth/me", "/sos/api/auth/my-scopes"]) {
    const checked = await request(url + path, { headers: { authorization: `Bearer ${token}` } });
    if (!checked.ok) throw new Error(`mock: ${path} answered ${checked.status}`);
  }
  const selected = await request(`${url}/sos/api/auth/workspace`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ workspaceId: "ws_orgtik", target: "tasks" }), signal: AbortSignal.timeout(60000) });
  if (!selected.ok) throw new Error(`mock: Tasks workspace handoff answered ${selected.status}`);
  const tasksToken = (await selected.json()).data.tokens.accessToken;
  const tasks = await request(`${url}/tasks/api/analytics/dashboard`, { headers: { authorization: `Bearer ${tasksToken}` }, signal: AbortSignal.timeout(60000) });
  if (!tasks.ok) throw new Error(`mock: Tasks dashboard answered ${tasks.status}`);
}
console.log(`${key}: hosted smoke passed`);
