/**
 * CHATS - SUITE SESSION (Chats wave, FS-CHT-4)
 *
 * Chats is opened from the OrgTik suite. SOS's launcher sends a one-time code (/{locale}/auth?code=),
 * which the auth page exchanges for the session; the address never carries a token. The session is
 * kept here for this browser until the person signs out, and signing out of Chats signs out of the
 * suite. "View as" sessions (D-017) are read-only: the token says so, and Chats refuses changes.
 *
 * Without NEXT_PUBLIC_SOS_API_URL none of this runs and Chats stays the standalone prototype.
 */

export const SOS_API_URL = process.env.NEXT_PUBLIC_SOS_API_URL || "";
export const SOS_URL = process.env.NEXT_PUBLIC_SOS_URL || "";

const KEY = "somion-hq.suite-session";

export type SuiteUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userType?: string;
  jobTitle?: string | null;
};
export type SuiteSession = {
  token: string;
  user: SuiteUser;
  /** A "View as" session: looking only, changes refused (D-017). */
  readOnly?: boolean;
  /** Who is viewing, for the banner. */
  viewingBy?: string;
};

/** The suite is configured: Chats needs a suite session, and has no demo sign-in. */
export const inSuite = (): boolean => Boolean(SOS_API_URL);

export function readSuiteSession(): SuiteSession | null {
  if (!SOS_API_URL || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SuiteSession) : null;
  } catch {
    return null;
  }
}

export function writeSuiteSession(session: SuiteSession) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* Private windows can refuse storage; the next visit goes through the launcher again. */
  }
}

export function clearSuiteSession() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing stored */
  }
}

type Claims = { readOnly?: boolean; impersonatedBy?: { firstName?: string; lastName?: string; email?: string } };

function claimsOf(token: string): Claims {
  try {
    const part = token.split(".")[1] ?? "";
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as Claims;
  } catch {
    return {};
  }
}

/** Checks a session token with the suite's identity API and returns the session to keep. */
export async function sessionFor(token: string): Promise<SuiteSession> {
  const res = await fetch(`${SOS_API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`/auth/me answered ${res.status}`);
  const user = ((await res.json()) as { data: { user: SuiteUser } }).data.user;
  const claims = claimsOf(token);
  const by = claims.impersonatedBy;
  return {
    token,
    user,
    readOnly: Boolean(claims.readOnly),
    viewingBy: by ? `${by.firstName ?? ""} ${by.lastName ?? ""}`.trim() || by.email : undefined,
  };
}

/** Exchanges SOS's one-time code for the session's access token. A code works once, for 60 s. */
export async function exchangeCode(code: string): Promise<string> {
  const res = await fetch(`${SOS_API_URL}/auth/handoff/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(`exchange answered ${res.status}`);
  const token = ((await res.json()) as { data?: { accessToken?: string } }).data?.accessToken;
  if (!token) throw new Error("no token in the exchange");
  return token;
}

/** Where to go without a session: SOS opens Chats again with a fresh code (signing in first if needed). */
export const suiteEntryUrl = (): string => {
  // The page the person asked for comes back with them (SOS passes it on with the code).
  const here = typeof window === "undefined" ? "" : `${window.location.pathname}${window.location.search}`;
  return here && here !== "/" ? `${SOS_URL}/go/hq?redirect=${encodeURIComponent(here)}` : `${SOS_URL}/go/hq`;
};

/** Signs out of the suite, not only out of Chats, and goes to the suite's sign-in. */
export async function signOutOfSuite(): Promise<void> {
  const session = readSuiteSession();
  clearSuiteSession();
  if (session) {
    await fetch(`${SOS_API_URL}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${session.token}` } }).catch(() => {});
  }
  window.location.assign(`${SOS_URL}/auth/login`);
}

/** Leaves "View as": the server returns the viewer's own session (nothing was kept in the browser). */
export async function stopViewing(): Promise<void> {
  const session = readSuiteSession();
  if (!session) return;
  const res = await fetch(`${SOS_API_URL}/auth/exit-impersonation`, { method: "POST", headers: { Authorization: `Bearer ${session.token}` } });
  if (!res.ok) throw new Error(`exit answered ${res.status}`);
  const token = ((await res.json()) as { data?: { tokens?: { accessToken?: string } } }).data?.tokens?.accessToken;
  if (!token) throw new Error("no token on exit");
  writeSuiteSession(await sessionFor(token));
  window.location.assign("/hq/office");
}
