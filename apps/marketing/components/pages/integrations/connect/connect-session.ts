"use client";

// What the connect wizard keeps between page loads, in this tab only (sessionStorage).
//
// 1. Before leaving for the provider, the single-use `state` of this connect, bound to the platform,
//    the project and the reader's language. The return is accepted only when its state matches, and
//    the record is spent on the first try (MKT-018). The old wizard exchanged any code and state it
//    found in its address.
// 2. After the exchange, the connect session: the temp data id the server gave, the resources to
//    pick from, the picks and the preflight answer. The URL carries the temp data id, so a refresh
//    on step 2 or 3 picks up where it was, and never sends the used code again (MKT-020).
//
// Nothing secret is kept: no code and no token reach this storage.
import type { IIntegrationCallbackResponse, IWizardSelection } from "@/types/integrations";

const PENDING_KEY = "mk.connect.pending";
const SESSION_PREFIX = "mk.connect.session.";
/** How long a started connect may take at the provider before its state is refused. */
const PENDING_MAX_AGE = 15 * 60 * 1000;
/** How long a connect session is kept for resuming. The server's temp data expires on its own. */
const SESSION_MAX_AGE = 60 * 60 * 1000;

export type PendingConnect = { state: string; platform: string; projectId: string; locale: string; createdAt: number };

export type ConnectSession = {
  tempDataId: string;
  platform: string;
  projectId: string;
  /** The callback's answer: profile, scopes and the resource groups. */
  data: IIntegrationCallbackResponse;
  /** The picks, by capability. */
  selections: IWizardSelection[];
  /** Preflight's answer, once step 2 is done. */
  review: IIntegrationCallbackResponse | null;
  createdAt: number;
};

function read<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the wizard still works until a refresh.
  }
}
function remove(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // nothing to do
  }
}

export function savePending(p: Omit<PendingConnect, "createdAt">) {
  write(PENDING_KEY, { ...p, createdAt: Date.now() });
}

export type PendingCheck = { ok: true; pending: PendingConnect } | { ok: false; reason: "missing" | "mismatch" | "expired" };

/**
 * Checks a provider's return against the connect this tab started, and spends the record: the same
 * state is never accepted twice.
 */
export function takePending(state: string | null, platform: string): PendingCheck {
  const p = read<PendingConnect>(PENDING_KEY);
  remove(PENDING_KEY);
  if (!p) return { ok: false, reason: "missing" };
  if (!state || p.state !== state || p.platform.toUpperCase() !== platform.toUpperCase()) return { ok: false, reason: "mismatch" };
  if (Date.now() - p.createdAt > PENDING_MAX_AGE) return { ok: false, reason: "expired" };
  return { ok: true, pending: p };
}

export function saveSession(s: Omit<ConnectSession, "createdAt"> & { createdAt?: number }) {
  write(SESSION_PREFIX + s.tempDataId, { ...s, createdAt: s.createdAt ?? Date.now() });
}

export function loadSession(tempDataId: string | null, platform: string): ConnectSession | null {
  if (!tempDataId) return null;
  const s = read<ConnectSession>(SESSION_PREFIX + tempDataId);
  if (!s || s.platform.toUpperCase() !== platform.toUpperCase()) return null;
  if (Date.now() - s.createdAt > SESSION_MAX_AGE) {
    remove(SESSION_PREFIX + tempDataId);
    return null;
  }
  return s;
}

export function updateSession(tempDataId: string, patch: Partial<ConnectSession>) {
  const s = read<ConnectSession>(SESSION_PREFIX + tempDataId);
  if (s) write(SESSION_PREFIX + tempDataId, { ...s, ...patch });
}

export function clearSession(tempDataId: string | null | undefined) {
  if (tempDataId) remove(SESSION_PREFIX + tempDataId);
}

/** The picks the server made (or the person kept), as the API's selections. */
export function selectionsFrom(data: IIntegrationCallbackResponse): IWizardSelection[] {
  return Object.values(data.resourceSelection?.groups ?? {})
    .map((g) => ({ capability: g.resources[0]?.capability ?? "", resourceIds: g.resources.filter((r) => r.isSelected).map((r) => r.id) }))
    .filter((s) => s.capability && s.resourceIds.length > 0);
}

/** A provider address is followed only when it is a web address (no javascript:, data: …). */
export function isSafeAuthUrl(url: string | undefined | null): url is string {
  if (!url) return false;
  try {
    const u = new URL(url, window.location.href);
    return u.protocol === "https:" || (u.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname));
  } catch {
    return false;
  }
}
