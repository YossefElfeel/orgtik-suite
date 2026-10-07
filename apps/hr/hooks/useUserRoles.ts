"use client";

import { getCookie } from "cookies-next";

import { USER_COOKIE } from "@/constants";
import { UserRole } from "@/types/user";
import { getDashboardRoles, parseUserCookie } from "@/utils/user-scopes";
import { useClientSession, toolAccess } from "@orgtik/ui/auth";

export const useUserRoles = () => {
  const session = useClientSession();
  const cookie = parseUserCookie(getCookie(USER_COOKIE));
  const access = toolAccess(session?.workspaceContext || cookie?.workspaceContext, "hr", session?.scopes || cookie?.scopes);
  const roles: UserRole[] = session ? access.roles : getDashboardRoles(cookie);

  const hasRole = (role: UserRole) => roles.includes(role);

  return { roles, hasRole, hasAccess: access.hasAccess, canWrite: access.canWrite, readOnly: access.readOnly };
};
