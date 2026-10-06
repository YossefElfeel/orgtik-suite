"use client";

import { useMemo } from "react";
import { getCookie } from "cookies-next";

import { USER_COOKIE } from "@/constants";
import { UserRole } from "@/types/user";
import { getDashboardRoles, parseUserCookie } from "@/utils/user-scopes";

export const useUserRoles = () => {
  const roles = useMemo<UserRole[]>(() => {
    const userData = parseUserCookie(getCookie(USER_COOKIE));
    return getDashboardRoles(userData);
  }, []);

  const hasRole = (role: UserRole) => roles.includes(role);

  return { roles, hasRole };
};
