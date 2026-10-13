"use client";
import { readClientSession } from "../auth/session.js";
/** Stable across token refresh; separate for each issuer, actor and workspace. No token is stored. */
export function retainedDraftKey(name: string): string | null {
  const session = readClientSession();
  if (!session) return null;
  let issuer = "";
  try { issuer = String(JSON.parse(atob(session.tokens.accessToken.split(".")[1]!.replaceAll("-", "+").replaceAll("_", "/"))).iss || ""); } catch { return null; }
  const context = session.workspaceContext;
  return `orgtik:draft:${JSON.stringify([issuer, session.user.id, context?.workspace.id || "staff", context?.actor.effectiveUserId || session.user.id, name])}`;
}
export function readRetainedDraft(key: string | null): unknown {
  if (!key || typeof localStorage === "undefined") return undefined;
  try { return JSON.parse(localStorage.getItem(key) || "null")?.value; } catch { return undefined; }
}
export function writeRetainedDraft(key: string | null, value: unknown): boolean {
  if (!key || typeof localStorage === "undefined") return false;
  try { localStorage.setItem(key, JSON.stringify({ value })); return true; } catch { return false; }
}
export function clearRetainedDraft(key: string | null) {
  try { if (key && typeof localStorage !== "undefined") localStorage.removeItem(key); } catch { /* Private storage may be unavailable. */ }
}
