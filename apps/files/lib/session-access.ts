import type { SessionAccess } from "./permissions";

type ScopedUser = {
  id?: string | number | null;
  scopes?: readonly { scope: string; roles?: readonly string[] }[];
  workspaceContext?: { tools?: { files?: { roles?: readonly string[]; access: string; canWrite: boolean } } };
};

/** Only the selected workspace's Files grant controls this app's privileges. */
export function fileSessionAccess(user: ScopedUser | null | undefined): SessionAccess | null {
  if (user?.id == null) return null;
  const context = user.workspaceContext;
  const access = context?.tools?.files;
  const roles = context ? access && !["no_access", "not_subscribed"].includes(access.access) ? access.roles || [] : [] : user.scopes?.find(scope => scope.scope === "file_manager")?.roles || [];
  const isSuperAdmin = roles.includes("super_admin");
  return {
    userId: user.id, isAdmin: isSuperAdmin, isSuperAdmin,
    canWrite: context ? access?.canWrite === true : roles.some(role => role === "super_admin" || role === "file_editor"),
  };
}
