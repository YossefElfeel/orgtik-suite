// Read-only application checks plus temporary sign-in/handoff sessions in the
// isolated Services dataset. Never resets or mutates business records.
import { execFileSync } from "node:child_process";
import nodePath from "node:path";
import { apps } from "./config.cjs";
import { verifyWebsiteStaging } from "./website-staging.mjs";
const base = process.argv[2];
if (!base || !/^https?:\/\//.test(base)) throw new Error("Provide the Services deployment URL.");
const viaCli = process.argv.includes("--via-cli");
const selectedService = process.argv[process.argv.indexOf("--service") + 1];
const service = process.argv.includes("--service") ? selectedService : null;
if (service && !apps.includes(service)) throw new Error("Unknown frontend service.");
const websiteStaging = process.argv.includes("--website-staging");
if (websiteStaging && (!viaCli || service)) throw new Error("Website staging requires its protected CLI check without a frontend selection.");
async function request(path, init = {}) {
  if (!viaCli) return fetch(new URL(path, base), { ...init, redirect: "manual", signal: AbortSignal.timeout(60000) });
  if (init.method || init.headers || init.body) throw new Error("Protected staging checks use GET routes only.");
  // CLI 63's curl parser forwards global flags to system curl. Use its standard
  // XDG credential directory and a full URL, which resolves the owning project
  // for protected access without --scope or --local-config arguments.
  const authDirectory = process.env.ORGTIK_VERCEL_CONFIG;
  if (!authDirectory || nodePath.basename(authDirectory) !== "com.vercel.cli") throw new Error("The reviewed staging credential directory is required.");
  const argv = ["curl", new URL(path, base).href, "--", "--silent", "--show-error", "--max-time", "60", "--write-out", "\n%{http_code}"];
  const raw = execFileSync("vercel", argv, { encoding: "utf8", maxBuffer: 5 * 1024 * 1024, env: { ...process.env, XDG_DATA_HOME: nodePath.dirname(authDirectory) } });
  const split = raw.lastIndexOf("\n"), status = Number(raw.slice(split + 1));
  return new Response(raw.slice(0, split), { status });
}
function check(condition, message) { if (!condition) throw new Error(message); }
if (websiteStaging) {
  const result = await verifyWebsiteStaging({ protectedRequest: request, publicRequest: url => fetch(url, { redirect: "manual", signal: AbortSignal.timeout(60000) }) });
  console.log(`Protected website and ${result.frontends} public frontend upstreams verified; shared-domain routes and sign-in run after promotion.`);
} else {
for (const app of service ? [service] : apps) {
  if (!viaCli) {
    for (const basePath of [`/${app}`, `/${app}/`]) {
      const entry = await request(basePath);
      check(entry.status === 200 || [307, 308].includes(entry.status), `${app} base ${basePath} returned ${entry.status}`);
      if (!service && [307, 308].includes(entry.status)) {
        const location = entry.headers.get("location");
        check(location && new URL(location, base).origin === new URL(base).origin, `${app} base redirect left the shared domain`);
      }
    }
  }
  const path = app === "sos" ? "/sos/auth/login?mode=staff&target=wm&redirect=%2Fgo%2Fwebsite_manager" : `/${app}/en/auth`;
  const response = await request(path);
  check(response.status === 200 || [307, 308].includes(response.status), `${app} entry returned ${response.status}`);
  console.log(`${app}: entry route ${response.status}`);
}
if (!service) {
  const website = await request("/");
  check(website.status === 200, `Website returned ${website.status}`);
}
const direct = await request("/mock/sos/api/auth/login");
// Vite's development server can return the website shell for unknown paths.
check(direct.status === 404 || (!base.startsWith("https:") && (await direct.text()).includes("<html")), "Internal mock acquired an unexpected public route");
const publicCms = await request(`/${service || "sos"}/api/backend/wm/v2/public/site`);
check(publicCms.status === 200, `CMS gateway unavailable (${publicCms.status})`);
if (viaCli || service) {
  console.log("Protected staged service routing verified; production sign-in runs after promotion.");
} else {
  const api = "/sos/api/backend/sos/api";
  const post = async (path, body, token) => {
    const response = await request(`${api}${path}`, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
    const parsed = await response.json();
    check(response.ok, `Identity ${path} returned ${response.status}`);
    return parsed.data;
  };
  const staff = await post("/auth/login", { email: "mona.adel@orgtik.test", password: "Local@2026", mode: "staff", target: "wm" });
  check(staff?.tokens?.accessToken && staff.staffAccess?.apps?.includes("wm"), "Staff sign-in did not return WM access");
  const handoff = await post("/auth/handoff", { audience: "staff:wm" }, staff.tokens.accessToken);
  const exchanged = await post("/auth/handoff/exchange", { audience: "staff:wm", code: handoff.code });
  check(exchanged?.tokens?.accessToken, "WM handoff did not return a session");
  const wm = await request("/wm/api/backend/wm/v2/admin/me", { headers: { authorization: `Bearer ${exchanged.tokens.accessToken}` } });
  check(wm.status === 200, `WM session verification returned ${wm.status}`);
  const customer = await post("/auth/workspace", { mode: "workspace", workspaceId: "ws_orgtik" }, exchanged.tokens.accessToken);
  check(customer?.tokens?.accessToken, "Mona workspace admission did not return a session");
  for (const path of ["/account/bootstrap", "/activity", "/notifications"]) {
    const response = await request(`${api}/suite${path}`, { headers: { authorization: `Bearer ${customer.tokens.accessToken}`, "x-workspace": "ws_orgtik" } });
    check(response.status === 200, `Mona account ${path} returned ${response.status}`);
    const value = (await response.json()).data;
    check(path === "/account/bootstrap" ? value?.permissions?.owner && value?.permissions?.admin : Array.isArray(value), `Mona account ${path} returned incomplete data`);
  }
  await post("/auth/logout", {}, customer.tokens.accessToken);
  const cleanup = await request(`${api}/auth/logout`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${exchanged.tokens.accessToken}` }, body: "{}" });
  check([200, 401].includes(cleanup.status), `Staff session cleanup returned ${cleanup.status}`);
  console.log("Staff sign-in, Website Manager handoff, Mona owner admission, account bootstrap and cross-app feeds verified.");
}
}
