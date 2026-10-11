// Signs a browser context in through the launcher's current, single-use code handoff.
import { APPS, SOS_API, PASSWORD, webUrl, redact } from "./suite.mjs";
import { createAppHandoff, selectAppSession } from "./handoff.mjs";
export { createAppHandoff } from "./handoff.mjs";

const tokens = new Map();

export async function tokenFor(email, appKey = "sos") {
  if (appKey !== "sos") {
    const key = `${appKey}:${email}`;
    if (!tokens.has(key)) tokens.set(key, await selectAppSession(SOS_API, appKey, await tokenFor(email)));
    return tokens.get(key);
  }
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
  const code = await createAppHandoff(SOS_API, appKey, token);
  const page = await context.newPage();
  const started = Date.now();
  try {
    await page.goto(webUrl(appKey) + APPS[appKey].auth + encodeURIComponent(code), { waitUntil: "load", timeout: 120000 });
    await page.waitForURL(leftAuth, { timeout: 60000 }).catch(() => {});
    const landed = page.url();
    const p = new URL(landed).pathname;
    const ok = leftAuth(landed) && !/not-allowed|\/login/.test(p);
    return { ok, landed: redact(landed), ms: Date.now() - started };
  } finally {
    await page.close();
  }
}
