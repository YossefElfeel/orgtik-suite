import { apps } from "./config.cjs";
import { projectName } from "./projects.mjs";
export async function verifyWebsiteStaging({ protectedRequest, publicRequest }) {
  // A project-scoped protection bypass must not travel through external rewrites
  // to another project. Probe the protected website and public upstreams separately;
  // the complete shared-domain routes and sign-in are checked after promotion.
  const website = await protectedRequest("/");
  if (website.status !== 200) throw new Error(`Staged website returned ${website.status}`);
  const internal = await protectedRequest("/mock/sos/api/auth/login");
  if (internal.status !== 404) throw new Error("Internal mock acquired a public website route.");
  for (const app of apps) {
    const path = app === "sos" ? "/sos/auth/login?mode=staff&target=wm&redirect=%2Fgo%2Fwebsite_manager" : `/${app}/en/auth`;
    const response = await publicRequest(new URL(path, `https://${projectName(app)}.vercel.app`));
    if (response.status !== 200 && ![307, 308].includes(response.status)) throw new Error(`${app} public entry returned ${response.status}`);
  }
  const cms = await publicRequest(new URL("/sos/api/backend/wm/v2/public/site", `https://${projectName("sos")}.vercel.app`));
  if (cms.status !== 200) throw new Error(`Public CMS upstream returned ${cms.status}`);
  return { frontends: apps.length };
}
