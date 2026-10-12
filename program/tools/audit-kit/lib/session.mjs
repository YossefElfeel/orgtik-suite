// Signs a browser context in to an app the way the SoSBar launcher does: get a token from
// the identity API, then open the app's /auth?token= hand-off page and let it store the session.
import { APPS, SOS_API, PASSWORD, webUrl } from "./suite.mjs";

const tokens = new Map();

export async function tokenFor(email) {
  if (tokens.has(email)) return tokens.get(email);
  const res = await fetch(`${SOS_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const json = await res.json();
  const token = json?.data?.tokens?.accessToken;
  if (!token) throw new Error(`${email} can't sign in: ${res.status} ${json?.message || ""}`);
  tokens.set(email, token);
  return token;
}

const leftAuth = (url) => {
  const p = new URL(url).pathname;
  return !/\/auth\/?$/.test(p);
};

export async function signIn(context, appKey, email) {
  const token = await tokenFor(email);
  const page = await context.newPage();
  const started = Date.now();
  try {
    await page.goto(webUrl(appKey) + APPS[appKey].auth + encodeURIComponent(token), { waitUntil: "load", timeout: 120000 });
    await page.waitForURL(leftAuth, { timeout: 60000 }).catch(() => {});
    const landed = page.url();
    const p = new URL(landed).pathname;
    const ok = leftAuth(landed) && !/not-allowed|\/login/.test(p);
    return { ok, landed, ms: Date.now() - started };
  } finally {
    await page.close();
  }
}
