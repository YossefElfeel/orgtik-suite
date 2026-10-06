"use client";

import { USER_COOKIE } from "@/constants";
import { UserRole } from "@/types/user";
import { getDashboardRoles, parseUserCookie } from "@/utils/user-scopes";
import { getCookie } from "cookies-next";
import { ReactNode, useEffect, useState } from "react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Array<
    "super_admin" | "hr" | "employee" | "manager" | "finance_manager"
  >;
}

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = parseUserCookie(getCookie(USER_COOKIE));
    setUserRoles(getDashboardRoles(userData));
    setIsLoading(false);
  }, []);

  if (isLoading) return null;

  const hasAccess = userRoles.some((role) =>
    allowedRoles.includes(role as RoleGuardProps["allowedRoles"][number])
  );

  if (hasAccess) return <>{children}</>;

  return null;
};
