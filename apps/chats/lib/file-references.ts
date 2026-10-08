"use client";

import { readClientSession, refreshClientSession, subscribeClientSession } from "@orgtik/ui/auth";
import { useSyncExternalStore } from "react";
import { SOS_API_URL } from "@/lib/suite-session";
const ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "").replace(/\/api$/, "");
const SOS_API = SOS_API_URL;

export type FileReference = { workspaceId: string; fileId: string; versionId: string };
export type FilePickerItem = FileReference & { name: string; mimetype: string; size: number; version: number };
export type FilePickerPage = { items: FilePickerItem[]; meta: { page: number; limit: number; total: number; totalPages: number } };
export type FileAttempt = { key: string; scope: string; path: string; method: "POST" | "PATCH" | "DELETE"; body?: unknown; uncertain?: boolean };
export class FileRequestError extends Error {
  constructor(public code: string, public status = 0, public uncertain = false) { super(code); }
}
const context = () => readClientSession()?.workspaceContext;
export function fileScope(): string {
  const c = context();
  return c ? JSON.stringify([c.realm, c.workspace.id, c.actor.userId, c.actor.effectiveUserId, c.actor.impersonatedBy ?? null]) : "";
}
export function fileAuthority(): string {
  const c = context();
  const grant = (g: { scope: string; roles: string[]; access: string; canWrite: boolean } | undefined) => g ? [g.scope, g.roles, g.access, g.canWrite] : null;
  return c ? JSON.stringify([fileScope(), c.workspace.state, c.member.id, c.member.role, c.member.revision, c.member.accessEpoch, c.actor.readOnly, grant(c.tools.chat), grant(c.tools.files)]) : "";
}
export const useFileAuthority = () => useSyncExternalStore(subscribeClientSession, fileAuthority, () => "");
function assertCurrent(scope: string, signature: string) {
  if (!scope || scope !== fileScope() || !signature || signature !== fileAuthority()) throw new FileRequestError("workspace_changed", 409, true);
}
function tokenFor(scope: string, signature: string) {
  assertCurrent(scope, signature);
  const session = readClientSession();
  if (!session?.tokens.accessToken) throw new FileRequestError("access_denied", 401);
  return session.tokens.accessToken;
}
function safePath(path: string) {
  if (!path.startsWith("/api/") || path.includes("\\") || path.includes("#")) throw new FileRequestError("invalid_reference", 400);
  return ORIGIN + path;
}
async function send(path: string, scope: string, signature: string, init: RequestInit) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${tokenFor(scope, signature)}`);
  headers.set("X-Workspace", context()!.workspace.id);
  try {
    const response = await fetch(safePath(path), { ...init, headers, cache: "no-store" });
    assertCurrent(scope, signature);
    return response;
  } catch (error) {
    if (error instanceof FileRequestError) throw error;
    throw new FileRequestError("transport_unavailable", 0, true);
  }
}
export async function fileRequest<T>(path: string, options: { attempt?: FileAttempt; signal?: AbortSignal; binary?: boolean } = {}): Promise<T> {
  const scope = options.attempt?.scope ?? fileScope(), signature = fileAuthority();
  assertCurrent(scope, signature);
  const attempt = options.attempt;
  const headers = new Headers();
  if (attempt) { headers.set("Idempotency-Key", attempt.key); headers.set("Content-Type", "application/json"); }
  const init: RequestInit = { method: attempt?.method ?? "GET", headers, signal: options.signal, ...(attempt?.body !== undefined ? { body: JSON.stringify(attempt.body) } : {}) };
  if (attempt && attempt.path !== path) throw new FileRequestError("invalid_reference", 400);
  let response = await send(path, scope, signature, init);
  if (response.status === 401) {
    assertCurrent(scope, signature);
    try { await refreshClientSession(SOS_API); }
    catch { assertCurrent(scope, signature); throw new FileRequestError("session_unavailable", 503, Boolean(attempt)); }
    assertCurrent(scope, signature);
    response = await send(path, scope, signature, init);
  }
  if (options.binary && response.ok) {
    const blob = await response.blob(); assertCurrent(scope, signature); return blob as T;
  }
  let envelope: { success?: boolean; data?: T; code?: string; error?: { code?: string } };
  try { envelope = await response.json() as typeof envelope; }
  catch { assertCurrent(scope, signature); throw new FileRequestError("transport_unavailable", response.status, Boolean(attempt)); }
  assertCurrent(scope, signature);
  if (response.ok && envelope.success !== true) throw new FileRequestError("invalid_response", response.status, Boolean(attempt));
  if (!response.ok) throw new FileRequestError(envelope.code || envelope.error?.code || (response.status === 401 || response.status === 403 ? "access_denied" : "request_failed"), response.status, response.status >= 500 && Boolean(attempt));
  if (envelope.data === undefined && attempt?.method === "DELETE") return undefined as T;
  if (envelope.data === undefined) throw new FileRequestError("invalid_response", 0, Boolean(attempt));
  return envelope.data;
}
export function newFileAttempt(path: string, method: FileAttempt["method"], body?: unknown): FileAttempt {
  return { key: crypto.randomUUID(), scope: fileScope(), path, method, ...(body !== undefined ? { body: structuredClone(body) } : {}) };
}
export async function downloadReference(path: string, name: string) {
  const signature = fileAuthority();
  const blob = await fileRequest<Blob>(path, { binary: true });
  if (signature !== fileAuthority()) throw new FileRequestError("workspace_changed", 409);
  const url = URL.createObjectURL(blob), anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
}
export function rememberAttempt(storageKey: string, attempt: FileAttempt | null) {
  try { if (attempt) sessionStorage.setItem(storageKey, JSON.stringify(attempt)); else sessionStorage.removeItem(storageKey); } catch { /* The exact attempt remains in memory. */ }
}
export function recalledAttempt(storageKey: string): FileAttempt | null {
  try {
    const a = JSON.parse(sessionStorage.getItem(storageKey) || "null") as FileAttempt | null;
    return a && typeof a.key === "string" && typeof a.scope === "string" && typeof a.path === "string" && ["POST", "PATCH", "DELETE"].includes(a.method) ? { ...a, uncertain: true } : null;
  } catch { return null; }
}
