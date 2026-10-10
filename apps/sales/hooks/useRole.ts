"use client";

import { useAppSelector } from "@/redux/app/hooks";
import { salesRoleFrom, type AppRole } from "@/types/role";
import { useClientSession, toolAccess } from "@orgtik/ui/auth";
import { useSuite } from "@orgtik/ui";
import type { IUser } from "@somion/sos-bar";

/**
 * True for a "View as" session (D-017): the token says readOnly, and the API refuses every change.
 * The screens hide their changes too, so the person isn't offered buttons that can only fail.
 */

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
  const session = useClientSession<IUser>();
  const snapshot = useSuite().snapshot || session?.workspaceContext;
  const storedUser = useAppSelector((state) => state.auth.user) as (Record<string, unknown> & { firstName?: string; lastName?: string; username?: string; scopes?: unknown }) | null;
  const user = session?.user || storedUser;
  const access = toolAccess(snapshot, "crm", session?.scopes || storedUser?.scopes);
  const found = salesRoleFrom(session?.scopes || storedUser?.scopes, snapshot);
  const role: AppRole = found ?? "customer";
  const readOnlySession = access.readOnly;
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
    canEdit: access.canWrite && !readOnlySession,
  };
}
