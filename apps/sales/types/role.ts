import { toolAccess, type WorkspaceContext } from "@orgtik/ui/auth";

/** A person's role in Sales: from the `sales` scope's roles (FS-SAL-4), never the global userType. */
export type AppRole = "admin" | "manager" | "salesman" | "customer";
/** @deprecated The role no longer comes from userType; kept for the frozen screens' imports. */
export type UserType = AppRole;

/** The suite scope this app's roles come from. */
export const SALES_SCOPE = "sales";

export const APP_ROLES: readonly { value: AppRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "salesman", label: "Sales Man" },
  { value: "customer", label: "Customer" },
] as const;

export function isAppRole(value: unknown): value is AppRole {
  return value === "admin" || value === "manager" || value === "salesman" || value === "customer";
}

type ScopeEntry = { scope?: unknown; roles?: unknown };

/**
 * The person's current workspace Sales role, or the exact `sales` scope compatibility projection.
 * Global identity grants do not confer access. Null means Sales isn't one of their apps. Unknown types used to fall
 * back to admin, so anyone signed in to the suite got the whole of Sales (SAL-005).
 */
export function salesRoleFrom(scopes: unknown, context?: WorkspaceContext | null): AppRole | null {
  const list = Array.isArray(scopes) ? (scopes as ScopeEntry[]) : [];
  const rolesOf = (name: string) => {
    const s = list.find((x) => x && x.scope === name);
    return Array.isArray(s?.roles) ? (s!.roles as unknown[]).map(String) : [];
  };
  const own = context ? toolAccess(context, "crm").roles : rolesOf(SALES_SCOPE);
  for (const r of ["admin", "manager", "salesman", "customer"] as const) if (own.includes(r)) return r;
  return null;
}
