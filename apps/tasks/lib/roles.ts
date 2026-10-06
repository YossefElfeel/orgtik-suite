import type { IUserScope } from "@/types/user";

/** Tasks' own scope in the suite launcher. */
export const TASKS_SCOPE = "task_manager";

export type TaskRole = "super_admin" | "project_manager" | "developer" | "viewer";

/**
 * The roles a person holds in Tasks (FS-TASKS-4): the task_manager scope's roles, plus super admin
 * when they are the organisation's super admin. The flattened `user.roles` list mixed every app's
 * roles, so an admin of another app counted as one here (TASKS-018). Same rule as the API.
 */
export function taskRoles(scopes: IUserScope[] | undefined | null): TaskRole[] {
  const list = scopes ?? [];
  const own = new Set<TaskRole>((list.find((s) => s.scope === TASKS_SCOPE)?.roles ?? []) as TaskRole[]);
  if (list.find((s) => s.scope === "global")?.roles?.includes("super_admin")) own.add("super_admin");
  return [...own];
}

export type TaskPermissions = {
  roles: TaskRole[];
  /** Can open Tasks at all. */
  hasAccess: boolean;
  isAdmin: boolean;
  /** Creates and edits projects, sections, teams and their members. */
  isManager: boolean;
  /** Only reads: no create, edit, delete, drag or "+". */
  isViewerOnly: boolean;
};

export function permissionsFor(scopes: IUserScope[] | undefined | null): TaskPermissions {
  const roles = taskRoles(scopes);
  const isAdmin = roles.includes("super_admin");
  return {
    roles,
    hasAccess: roles.length > 0,
    isAdmin,
    isManager: isAdmin || roles.includes("project_manager"),
    isViewerOnly: roles.length === 0 || roles.every((r) => r === "viewer"),
  };
}
