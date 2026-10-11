// Ephemeral project OIDC access, scoped to the suite's known preview origins. Nothing is saved
// to a file, URL, trace or artifact, and Vercel protection settings remain unchanged.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const manifest = JSON.parse(fs.readFileSync(new URL("./projects.json", import.meta.url), "utf8"));
export const HEADER = "x-vercel-trusted-oidc-idp-token";
const allowed = new Set(Object.values(manifest.projects).map(project => new URL(project.previewUrl).origin));

// Customer tool homepages can redirect an unsigned visitor to SOS. Their local
// sign-in shell proves availability without sending preview access to that origin.
export function previewShellPath(key) {
  if (!manifest.projects[key]) throw new Error(`Unknown protected preview project: ${key}`);
  return ["mock", "website"].includes(key) ? "/" : key === "sos" ? "/auth" : "/en/auth";
}

export function mintPreviewTokens(keys, run = execFileSync) {
  if (!process.env.VERCEL_TOKEN) throw new Error("The approved VERCEL_TOKEN is required for protected preview checks");
  if (!/^[A-Za-z0-9_=-]+$/.test(process.env.VERCEL_TOKEN)) throw new Error("Vercel credential has an unexpected format");
  const tokens = {};
  for (const key of new Set(keys)) {
    const project = manifest.projects[key];
    if (!project) throw new Error(`Unknown protected preview project: ${key}`);
    const name = key === "mock" ? "orgtik-suite-mock-preview" : project.name;
    let value;
    try {
      const raw = run(process.platform === "win32" ? "vercel.cmd" : "vercel", ["project", "token", name, "--scope", "yossef-elfeels-projects", "--token", process.env.VERCEL_TOKEN, "--format=json"], {
        encoding: "utf8", shell: process.platform === "win32", stdio: ["ignore", "pipe", "pipe"],
      });
      value = JSON.parse(raw).token;
    } catch { throw new Error(`${key}: could not obtain ephemeral preview access`); }
    if (typeof value !== "string" || value.split(".").length !== 3) throw new Error(`${key}: Vercel returned invalid preview access`);
    if (process.env.GITHUB_ACTIONS) console.log(`::add-mask::${value}`);
    tokens[new URL(project.previewUrl).origin] = value;
  }
  return tokens;
}

export function protectedFetch(tokens, nativeFetch = globalThis.fetch) {
  return async (input, init = {}) => {
    let url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
    const token = tokens[url.origin];
    if (!token) return nativeFetch(input, init);
    const origin = url.origin;
    let current = input;
    let options = { ...init, redirect: "manual", headers: new Headers(init.headers || (input instanceof Request ? input.headers : undefined)) };
    options.headers.set(HEADER, token);
    for (let i = 0; i < 20; i++) {
      let response;
      try { response = await nativeFetch(current, options); }
      catch { throw new Error("Protected preview request failed"); }
      if (![301, 302, 303, 307, 308].includes(response.status) || !response.headers.get("location") || init.redirect === "manual") return response;
      const next = new URL(response.headers.get("location"), url);
      if (next.origin !== origin) throw new Error("Protected preview redirected away from its authorized origin");
      if (response.status === 303 || ([301, 302].includes(response.status) && options.method?.toUpperCase() === "POST")) {
        options = { ...options, method: "GET", body: undefined };
        options.headers.delete("content-type");
      }
      url = next;
      current = url;
    }
    throw new Error("Protected preview redirected too many times");
  };
}

const tokens = JSON.parse(process.env.VERCEL_PREVIEW_TOKENS || "{}");
for (const origin of Object.keys(tokens)) if (!allowed.has(origin)) throw new Error("Preview access was supplied for an unapproved origin");
if (Object.keys(tokens).length) {
  globalThis.fetch = protectedFetch(tokens);
  const load = createRequire(path.resolve(import.meta.dirname, "../../program/tools/audit-kit/package.json"));
  const { chromium } = load("playwright");
  const launch = chromium.launch.bind(chromium);
  chromium.launch = async options => {
    const browser = await launch(options);
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async settings => {
      const context = await newContext(settings);
      await context.route("**/*", async route => {
        const request = route.request();
        const token = tokens[new URL(request.url()).origin];
        const headers = { ...request.headers() };
        delete headers[HEADER];
        if (!token) return route.continue({ headers });
        headers[HEADER] = token;
        // Fetch one response internally and fulfill it. The browser never receives the secret
        // header, so a subsequent redirect or outside asset cannot inherit it.
        try {
          const response = await route.fetch({ headers, maxRedirects: 0, timeout: 60000 });
          await route.fulfill({ response });
        } catch {
          // Playwright's raw fetch error can include its request headers. Abort without exposing
          // them; the browser acceptance test reports the failed page or API call instead.
          await route.abort();
        }
      });
      return context;
    };
    return browser;
  };
}
