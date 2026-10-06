import { getCookie } from "cookies-next";

import { USER_COOKIE } from "@/constants";
import { UserRole } from "@/types/user";
import { getDashboardRoles, parseUserCookie } from "@/utils/user-scopes";

type RoleType = "super_admin" | "hr" | "employee" | "manager";

export const useGetRole = () => {
  const user = parseUserCookie(getCookie(USER_COOKIE));
  const roles = getDashboardRoles(user) as RoleType[];

  return {
    roles,
    role: roles[0] || null,
    isAdmin: roles.includes("super_admin"),
    isHR: roles.includes("hr"),
    isEmployee: roles.includes("employee"),
    isManager: roles.includes("manager"),
  };
};
