import type { WorkspaceContext } from "@orgtik/ui/auth";
import { safeRedirect } from "./safe-redirect";

/** Used only at successful login/handoff; an explicit Home visit stays on Home. */
export function adaptiveEntry(context: WorkspaceContext | null | undefined, redirect: string | null): string {
  if (redirect !== null) return safeRedirect(redirect);
  const tools = Object.values(context?.tools || {}).filter(tool => !["no_access", "not_subscribed"].includes(tool.access) && tool.roles.length > 0);
  return tools.length === 1 ? `/go/${encodeURIComponent(tools[0].scope)}` : "/";
}
