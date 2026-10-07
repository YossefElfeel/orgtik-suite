import { useUserRoles } from "./useUserRoles";

type RoleType = "super_admin" | "hr" | "employee" | "manager";

export const useGetRole = () => {
  const access = useUserRoles();
  const roles = access.roles as RoleType[];

  return {
    roles,
    role: roles[0] || null,
    isAdmin: roles.includes("super_admin"),
    isHR: roles.includes("hr"),
    isEmployee: roles.includes("employee"),
    isManager: roles.includes("manager"),
    canWrite: access.canWrite,
    readOnly: access.readOnly,
  };
};
