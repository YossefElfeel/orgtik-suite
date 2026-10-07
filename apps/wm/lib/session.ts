"use client";
import { clearClientSession, readClientSession, setClientSession, signOutSession, SessionRequestError, type AuthEnvelope } from "@orgtik/ui/auth";
import { SOS_API, SOS_URL } from "./env";
export const STAFF_TARGET = "wm" as const;
export function getToken(): string | null {
  const session = readClientSession();
  return session && !session.workspaceContext && session.staffAccess?.apps.includes(STAFF_TARGET) ? session.tokens.accessToken : null;
}
export function setStaffSession(session: AuthEnvelope) {
  if (session.workspaceContext || !session.staffAccess?.apps.includes(STAFF_TARGET)) throw new SessionRequestError(403, "staff_access_required");
  setClientSession(session);
}
export function clearToken() {
  clearClientSession();
  if (typeof document !== "undefined") document.cookie = "wm.token=; path=/; max-age=0; SameSite=Lax";
}
export async function signOutStaff() {
  const token = getToken();
  if (token) await signOutSession(SOS_API, token);
  clearToken();
}
export const staffSignInHref = () => {
  const url = new URL("/auth/login", SOS_URL);
  url.searchParams.set("mode", "staff"); url.searchParams.set("target", STAFF_TARGET);
  url.searchParams.set("redirect", "/go/website_manager");
  return url.toString();
};
