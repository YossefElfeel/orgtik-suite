import { useAppSelector } from "@/redux/app/hooks";
import { permissionsFor, type TaskPermissions } from "./roles";
import { useSuite } from "@orgtik/ui";

export { TASKS_SCOPE, taskRoles, permissionsFor, type TaskRole, type TaskPermissions } from "./roles";

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

export function useTaskRoles(): TaskPermissions & { readOnlySession: boolean; canEdit: boolean } {
  const suite = useSuite();
  const user = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);
  const context = suite.snapshot ?? (user as (typeof user & { workspaceContext?: { actor?: { readOnly?: boolean }; tools?: { tasks?: { scope: string; roles: import("@/types/user").IUserScope["roles"]; canWrite: boolean; access: string } } } }))?.workspaceContext;
  const access = context?.tools?.tasks;
  const scopes = context ? access && !["no_access", "not_subscribed"].includes(access.access) ? [{ scope: access.scope, roles: access.roles }] : [] : user?.scopes;
  const p = permissionsFor(scopes as import("@/types/user").IUserScope[] | undefined);
  const readOnlySession = context?.actor?.readOnly === true || readOnlyClaim(token);
  const blocked = readOnlySession || Boolean(context && access?.canWrite !== true);
  // isViewerOnly stays the person's role (what they can open); canEdit and the manager rights also
  // follow the session (what they can change now).
  return { ...p, isAdmin: p.isAdmin && !blocked, isManager: p.isManager && !blocked, canEdit: !p.isViewerOnly && !blocked, readOnlySession };
}
