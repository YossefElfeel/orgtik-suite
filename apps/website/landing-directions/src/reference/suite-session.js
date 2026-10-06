// Signing in or creating an account on the website opens the OrgTik suite (2026-10-07): the
// suite's identity API checks (or creates) the account, gives a one-time code for the session,
// and SOS takes it at /auth/handoff, so no token travels in the address. The password is sent
// once and never kept here. Reset password starts the suite's own reset and opens its next step.
// The website keeps the suite session it was given (the access token, in this browser) so its
// header shows the person on every visit; Sign out forgets it here (the suite keeps its own).
//   VITE_SUITE_URL   the suite's home (SOS), e.g. https://orgtik-suite-sos.vercel.app
//   VITE_SUITE_API   its identity API, e.g. https://orgtik-suite-mock.vercel.app/sos/api
export const SUITE_URL = (
  import.meta.env?.VITE_SUITE_URL || "http://localhost:3013"
).replace(/\/$/, "");
const SUITE_API = (
  import.meta.env?.VITE_SUITE_API || "http://localhost:4000/api"
).replace(/\/$/, "");

import {
  getPreviewCustomer,
  signInPreviewCustomer,
  subscribePreviewCustomer,
} from "./purchase-identity.js";

const SESSION_KEY = "orgtik.suite-session.v1";
const readToken = () => {
  try {
    return (
      JSON.parse(localStorage.getItem(SESSION_KEY) || "null")?.token || null
    );
  } catch {
    return null;
  }
};
const writeToken = (token) => {
  try {
    if (token) localStorage.setItem(SESSION_KEY, JSON.stringify({ token }));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked: the person stays signed in until the page is left.
  }
};
export const hasSuiteSession = () => Boolean(readToken());

const post = (path, body, token) =>
  fetch(`${SUITE_API}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

// The address that opens the suite signed in with `token`, through a one-time code.
async function handoffHref(token) {
  const handoff = token
    ? await post("/auth/handoff", null, token).catch(() => null)
    : null;
  if (!handoff?.ok) throw new Error("unavailable");
  const code = (await handoff.json())?.data?.code;
  if (!code) throw new Error("unavailable");
  return `${SUITE_URL}/auth/handoff?code=${encodeURIComponent(code)}`;
}

// Opens the suite signed in with the session in `res` (a login or sign-up response), and keeps
// that session for the website's header.
async function openSuite(res) {
  const { data } = await res.json();
  const token = data?.tokens?.accessToken;
  const href = await handoffHref(token);
  writeToken(token);
  return { user: data.user, href };
}

// My account: the suite, signed in with the kept session (its home if that fails).
export async function suiteAccountHref() {
  try {
    return await handoffHref(readToken());
  } catch {
    return SUITE_URL;
  }
}

// On each visit: show the person whose session the website kept, if the suite still knows them.
export async function restoreSuiteSession() {
  const token = readToken();
  if (!token || getPreviewCustomer()) return;
  let res;
  try {
    res = await fetch(`${SUITE_API}/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
    });
  } catch {
    return; // The suite is unreachable: keep the session for the next visit.
  }
  if (!res.ok) return writeToken(null);
  const user = (await res.json())?.data?.user;
  if (!user?.email) return writeToken(null);
  signInPreviewCustomer({
    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
    email: user.email,
    company: "",
  });
}

// Signing out on the website (header or checkout) forgets the kept session.
subscribePreviewCustomer(() => {
  if (!getPreviewCustomer()) writeToken(null);
});

const send = (path, body) =>
  post(path, body).catch(() => {
    throw new Error("unavailable");
  });

// Resolves to { user, href } (href opens the suite signed in), or rejects with
// Error("credentials") for a wrong email or password and Error("unavailable") otherwise.
export async function signInToSuite(email, password) {
  const res = await send("/auth/login", { email, password });
  if (res.status === 401 || res.status === 403) throw new Error("credentials");
  if (!res.ok) throw new Error("unavailable");
  return openSuite(res);
}

// Creates a customer account in the suite (with its own workspace) and resolves like
// signInToSuite. Rejects with Error("exists") when the email already has an account.
export async function signUpToSuite({ name, email, password }) {
  const res = await send("/auth/register", { name, email, password });
  if (res.status === 409) throw new Error("exists");
  if (!res.ok) throw new Error("unavailable");
  return openSuite(res);
}

// Starts a password reset in the suite (it emails a code) and resolves to the suite page where
// the code and a new password are entered. The suite answers the same for unknown emails, so
// this never reveals whether an account exists. Rejects with Error("unavailable").
export async function resetInSuite(email) {
  const res = await send("/auth/forgot-password", { email });
  if (!res.ok) throw new Error("unavailable");
  return `${SUITE_URL}/auth/reset-password`;
}
