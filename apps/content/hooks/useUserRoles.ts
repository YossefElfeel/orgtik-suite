import { USER_COOKIE } from "@/constants";
import { useAppSelector } from "@/redux/app/hooks";
import { UserRole } from "@/types/user";
import { getDashboardRoles } from "@/utils/user-scopes";
import { useMemo } from "react";

export const useUserRoles = () => {
  const user = useAppSelector((state) => state.auth.user);

  const roles = useMemo<UserRole[]>(() => getDashboardRoles(user), [user]);

  const hasRole = (role: UserRole) => roles.includes(role);

  return { roles, hasRole };
};
