"use client";

import { useAppSelector } from "@/redux/app/hooks";
import { salesRoleFrom, type AppRole } from "@/types/role";

/**
 * True for a "View as" session (D-017): the token says readOnly, and the API refuses every change.
 * The screens hide their changes too, so the person isn't offered buttons that can only fail.
 */
function readOnlyClaim(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const part = token.split(".")[1];
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return json?.readOnly === true;
  } catch {
    return false;
  }
}

/**
 * The signed-in person and their Sales role (FS-SAL-4).
 * - The role comes from the `sales` scope, read from the session the server loaded from the
 *   cookies. It no longer comes from the global userType, where unknown types fell back to admin
 *   (SAL-005).
 * - It is no longer fetched again by each of the ~70 components that ask: every call fired its
 *   own /auth/me request.
 * - The proxy only lets people with the scope in, so `hasAccess` is false only in edge cases (an
 *   expired session); `role` then falls back to the least privileged one.
 */
export function useRole() {
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user) as (Record<string, unknown> & { firstName?: string; lastName?: string; username?: string; scopes?: unknown }) | null;
  const found = salesRoleFrom(user?.scopes);
  const role: AppRole = found ?? "customer";
  const readOnlySession = readOnlyClaim(token);
  const fullName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || (user.username as string) || null : null;

  return {
    role,
    hasAccess: found !== null,
    isReady: Boolean(user),
    user,
    fullName,
    isAdmin: role === "admin",
    isManager: role === "manager",
    isSalesman: role === "salesman",
    isCustomer: role === "customer",
    /** A View as session: everything is read-only. */
    readOnlySession,
    /** May change anything at all now (not a View as session). Each screen still checks the role. */
    canEdit: !readOnlySession,
  };
}
