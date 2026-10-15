import type { AuthEnvelope } from "@orgtik/ui/auth";

/** A launcher grant is not an active staff session. Validate the server profile. */
export function staffSessionAllowed(session: Pick<AuthEnvelope, "user" | "scopes" | "workspaceContext" | "staffAccess">, target: "admin" | "wm", permission?: string) {
  const scope = target === "admin" ? "platform_admin" : "website_manager";
  return Boolean(!session.workspaceContext && session.staffAccess?.actorUserId === session.user.id &&
    session.staffAccess.apps.includes(target) && session.scopes.some(item => item.scope === scope && item.roles.length > 0) &&
    (!permission || session.staffAccess.permissions[target]?.includes(permission)));
}

/** Keep the central-management handoff within its own protected pages. */
export function staffRedirect(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/people";
  try {
    const url = new URL(value, "https://suite.invalid");
    return /^\/(people|systems)(?:\/[\w-]+)*\/?$/.test(url.pathname) ? url.pathname + url.search : "/people";
  } catch { return "/people"; }
}
