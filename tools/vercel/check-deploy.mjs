// Non-destructive hosted checks. Business resets and account creation belong to preview flows.
import fs from "node:fs";
const [file] = process.argv.slice(2);
const { key, url } = JSON.parse(fs.readFileSync(file, "utf8"));
const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(60000) });
if (!response.ok) throw new Error(`${key}: deployed page answered ${response.status}`);
if (key === "mock") {
  const login = await fetch(`${url}/sos/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "mona.adel@orgtik.test", password: "Local@2026" }), signal: AbortSignal.timeout(60000) });
  if (!login.ok) throw new Error(`mock: demo sign-in answered ${login.status}`);
  const token = (await login.json()).data.tokens.accessToken;
  for (const path of ["/sos/api/auth/me", "/sos/api/auth/my-scopes", "/tasks/api/analytics/dashboard"]) {
    const checked = await fetch(url + path, { headers: { authorization: `Bearer ${token}` } });
    if (!checked.ok) throw new Error(`mock: ${path} answered ${checked.status}`);
  }
}
console.log(`${key}: hosted smoke passed`);
