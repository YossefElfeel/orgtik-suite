// Signing in or creating an account on the website opens the OrgTik suite (2026-10-07): the
// suite's identity API checks (or creates) the account, gives a one-time code for the session,
// and SOS takes it at /auth/handoff, so no token travels in the address. The password is sent
// once and never kept here. Reset password starts the suite's own reset and opens its next step.
// The website keeps the suite session it was given (the access token, in this browser) so its
// header shows the person on every visit; Sign out forgets it here (the suite keeps its own).
// Checkout uses the same account: a paid order goes into that person's suite workspace, and an
// order paid as a guest joins the account they sign in to or create next (in the same tab).
//   VITE_SUITE_URL   the suite's home (SOS), e.g. https://orgtik-suite-sos.vercel.app
//   VITE_SUITE_API   its identity API, e.g. https://orgtik-suite-mock.vercel.app/sos/api
import {
  getPreviewCustomer,
  signInPreviewCustomer,
  subscribePreviewCustomer,
} from "./purchase-identity.js";
import {
  provisionCRM,
  loadPurchaseSession,
  savePurchaseSession,
} from "./purchase-adapter.js";

export const SUITE_URL = (
  import.meta.env?.VITE_SUITE_URL || "http://localhost:3013"
).replace(/\/$/, "");
const SUITE_API = (
  import.meta.env?.VITE_SUITE_API || "http://localhost:4000/api"
).replace(/\/$/, "");
// The platform's customer API sits beside the identity API (…/api → …/v1/app).
const PLATFORM_API = `${SUITE_API.replace(/\/api$/, "")}/v1/app`;

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
// that session for the website's header. An order this tab paid as a guest joins the account.
async function openSuite(res) {
  const { data } = await res.json();
  const token = data?.tokens?.accessToken;
  const saved = loadPurchaseSession();
  if (saved && token && !linked().includes(saved.order.reference))
    await sendOrder(saved.order, token)
      .then(() =>
        savePurchaseSession(saved.order, {
          status: "ready",
          access: "verified-existing",
        }),
      )
      .catch(() => {}); // The account still opens; the order can be linked from checkout later.
  const href = await handoffHref(token);
  writeToken(token);
  return { user: data.user, href };
}

// Orders this tab already brought into the suite (the suite also ignores repeats).
const LINKED_KEY = "orgtik.suite-orders.v1";
const linked = () => {
  try {
    return JSON.parse(sessionStorage.getItem(LINKED_KEY) || "[]");
  } catch {
    return [];
  }
};
async function sendOrder(order, token) {
  const lines = order.groups.flatMap((g) =>
    g.lines.map((l) => ({
      catalogId: l.catalogId,
      kind: l.kind || g.kind,
      name: l.name,
      months: l.months,
      total: l.total,
      autoRenew: Boolean(l.autoRenew),
    })),
  );
  const res = await fetch(`${PLATFORM_API}/website-orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      reference: order.reference,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      lines,
    }),
  }).catch(() => null);
  if (!res?.ok) throw new Error("unavailable");
  try {
    sessionStorage.setItem(
      LINKED_KEY,
      JSON.stringify([...new Set([...linked(), order.reference])]),
    );
  } catch {
    // Without storage the suite's own check stops a second copy.
  }
}

// Checkout's account setup: signed in to the suite, the paid order goes into the person's
// workspace (software on, services requested, invoice paid); a guest gets the simulated setup
// and joins an account through Sign in or Create account. Same answer shape as provisionCRM.
export async function setupInSuite(order, options = {}) {
  const token = readToken();
  if (!options.verified || !token) return provisionCRM(order, options);
  try {
    await sendOrder(order, token);
    return {
      purchaseReference: order.reference,
      destination: SUITE_URL,
      status: "ready",
      access: "verified-existing",
    };
  } catch {
    return {
      purchaseReference: order.reference,
      destination: SUITE_URL,
      status: "failed",
      access: "verified-existing",
    };
  }
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
