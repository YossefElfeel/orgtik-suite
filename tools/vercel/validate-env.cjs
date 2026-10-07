// Validate values before Vercel builds bake them into client bundles. App APIs have different
// conventions: SOS/HR/Sales/Marketing include /api; Tasks and Files append it themselves.
const fs = require("node:fs");
const path = require("node:path");

const requirements = {
  sos: { NEXT_PUBLIC_API_URL: "/sos/api", SUITE_SOS_URL: "", SUITE_SOS_API: "/sos/api" },
  tasks: { NEXT_PUBLIC_API_URL: "/tasks", NEXT_PUBLIC_SOS_API_URL: "/sos", SUITE_SOS_URL: "", SUITE_SOS_API: "/sos/api" },
  files: { NEXT_PUBLIC_API_URL: "/files", NEXT_PUBLIC_SOS_API_URL: "/sos", SUITE_SOS_URL: "", SUITE_SOS_API: "/sos/api" },
  sales: { NEXT_PUBLIC_API_URL: "/sales/api", NEXT_PUBLIC_AUTH_API_URL: "/sos/api", SUITE_SOS_URL: "", SUITE_SOS_API: "/sos/api" },
  hr: { NEXT_PUBLIC_API_URL: "/hr/api", NEXT_PUBLIC_SOS_API_URL: "/sos/api", SUITE_SOS_URL: "", SUITE_SOS_API: "/sos/api" },
  marketing: { NEXT_PUBLIC_API_URL: "/marketing/api", NEXT_PUBLIC_SOS_API_URL: "/sos", SUITE_SOS_URL: "", SUITE_SOS_API: "/sos/api" },
  content: { NEXT_PUBLIC_API_URL: "/content/api", SUITE_SOS_URL: "", SUITE_SOS_API: "/sos/api" },
  chats: { NEXT_PUBLIC_SOS_API_URL: "/sos/api", NEXT_PUBLIC_SOS_URL: "" },
  wm: { NEXT_PUBLIC_WM_API_URL: "/wm", NEXT_PUBLIC_SOS_API_URL: "/sos", NEXT_PUBLIC_SOS_URL: "", NEXT_PUBLIC_WEBSITE_URL: "" },
  admin: { NEXT_PUBLIC_ADMIN_API_URL: "/admin", NEXT_PUBLIC_SOS_API_URL: "/sos", NEXT_PUBLIC_SOS_URL: "", NEXT_PUBLIC_WM_URL: "" },
  website: { VITE_SUITE_API: "/sos/api", VITE_SUITE_URL: "", VITE_CRM_PORTAL_URL: "", VITE_CMS_API: "/wm/v2", VITE_WM_ORIGIN: "" },
};

function validate(project, env = process.env) {
  if (!env.VERCEL) return;
  const errors = [];
  const check = (name, suffix) => {
    let url;
    try { url = new URL(env[name]); } catch { errors.push(`${name} is missing or invalid`); return; }
    if (url.protocol !== "https:" || /^(localhost|127\..*|0\.0\.0\.0|\[::1\])$/i.test(url.hostname) || url.username || url.password || url.search || url.hash) errors.push(`${name} must be a public HTTPS URL without credentials or query parameters`);
    if (url.pathname.replace(/\/$/, "") !== suffix) errors.push(`${name} must use the path ${suffix || "/"}`);
  };
  if (project === "mock") {
    check("MOCK_PUBLIC_URL", "");
    let urls;
    try { urls = JSON.parse(env.SUITE_WEB_URLS); } catch { errors.push("SUITE_WEB_URLS must contain the suite web origins"); }
    for (const key of Object.keys(requirements)) {
      const value = urls?.[key];
      try { const url = new URL(value); if (url.protocol !== "https:" || url.pathname !== "/" || /localhost|127\./i.test(url.hostname)) throw new Error(); }
      catch { errors.push(`SUITE_WEB_URLS.${key} must be a public HTTPS origin`); }
    }
    if (!(env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL) || !(env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN)) errors.push("Connect the Upstash account/journal store before deploying the mock");
  } else {
    if (!requirements[project]) throw new Error(`Unknown Vercel project: ${project}`);
    for (const [name, suffix] of Object.entries(requirements[project])) check(name, suffix);
  }
  if (errors.length) throw new Error(`Vercel configuration for ${project}:\n${errors.map(error => `  - ${error}`).join("\n")}`);
  console.log(`[env] ${project}: hosted configuration is valid`);
}

if (require.main === module) {
  const dir = process.cwd();
  const project = process.argv[2] || (fs.existsSync(path.join(dir, "src/reference/suite-session.js")) ? "website" : path.basename(dir));
  validate(project);
}

module.exports = { validate, requirements };
