import type { UserRole } from "@/types/user";

/**
 * Who may open which part of HR (FS-HR-3, HR-011): one table for the sidebar and for the pages, so a
 * link someone can't see can't be opened by typing it either. A route's sub-pages follow the longest
 * matching prefix. Not listed: open to everyone signed in to HR (attendance, tickets).
 */
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/calendar": ["hr", "manager", "super_admin", "employee", "finance_manager"],
  "/employees": ["hr", "super_admin"],
  "/projects": ["hr", "super_admin"],
  "/department": ["hr", "super_admin"],
  // The page also serves employees their own requests (its own guard says so).
  "/time-off": ["hr", "manager", "super_admin", "employee"],
  "/payroll": ["hr", "super_admin"],
  // A loan's page is part of loans, which finance managers handle too.
  "/payroll/loans": ["hr", "super_admin", "finance_manager"],
  "/my-payslips": ["employee", "hr", "manager", "finance_manager"],
  "/loans": ["hr", "super_admin", "finance_manager"],
  "/hiring": ["hr", "super_admin"],
  "/candidates": ["hr", "super_admin"],
  "/rejected": ["hr", "super_admin"],
  "/configuration": ["hr", "super_admin"],
  "/finance-queue": ["finance_manager", "super_admin"],
};

/** The roles a path needs (longest matching prefix), or null when any HR role may open it. */
export function rolesFor(path: string): UserRole[] | null {
  let best: string | null = null;
  for (const prefix of Object.keys(ROUTE_ROLES)) {
    if ((path === prefix || path.startsWith(`${prefix}/`)) && (!best || prefix.length > best.length)) best = prefix;
  }
  return best ? ROUTE_ROLES[best] ?? null : null;
}
