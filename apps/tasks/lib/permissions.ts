import { useAppSelector } from "@/redux/app/hooks";
import { permissionsFor, type TaskPermissions } from "./roles";

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
  const scopes = useAppSelector((s) => s.auth.user?.scopes);
  const token = useAppSelector((s) => s.auth.token);
  const p = permissionsFor(scopes);
  const readOnlySession = readOnlyClaim(token);
  // isViewerOnly stays the person's role (what they can open); canEdit and the manager rights also
  // follow the session (what they can change now).
  return { ...p, isAdmin: p.isAdmin && !readOnlySession, isManager: p.isManager && !readOnlySession, canEdit: !p.isViewerOnly && !readOnlySession, readOnlySession };
}
