import { DASHBOARD_SCOPE } from "@/constants";
import { IUserScope, UserRole } from "@/types/user";
import { CookieValueTypes } from "cookies-next";
import { toolAccess, type WorkspaceContext } from "@orgtik/ui/auth";

function isLegacyScopes(scopes: IUserScope[] | string[]): scopes is string[] {
  return scopes.length > 0 && typeof scopes[0] === "string";
}

export function normalizeScopes(
  scopes: IUserScope[] | string[] | undefined
): IUserScope[] {
  if (!scopes?.length) return [];

  if (isLegacyScopes(scopes)) {
    return scopes.map((scope) => ({ scope, roles: [] }));
  }

  return scopes;
}

export function hasScope(
  scopes: IUserScope[] | string[] | undefined,
  scopeName: string
): boolean {
  return normalizeScopes(scopes).some((entry) => entry.scope === scopeName);
}

export function getRolesForScope(
  scopes: IUserScope[] | string[] | undefined,
  scopeName: string
): UserRole[] {
  return (
    normalizeScopes(scopes).find((entry) => entry.scope === scopeName)?.roles ??
    []
  );
}

interface IUserCookieDataLike {
  scopes?: IUserScope[] | string[];
  roles?: UserRole[];
  workspaceContext?: WorkspaceContext | null;
}

export function getDashboardRoles(
  user: IUserCookieDataLike | null | undefined,
  scopeName: string = DASHBOARD_SCOPE
): UserRole[] {
  if (!user) return [];

  if (scopeName === DASHBOARD_SCOPE && user.workspaceContext) return toolAccess(user.workspaceContext, "hr").roles;
  return getRolesForScope(normalizeScopes(user.scopes), scopeName);
}

export function parseUserCookie(
  cookie: CookieValueTypes | Promise<CookieValueTypes> | undefined | null
): IUserCookieDataLike | null {
  if (!cookie || typeof cookie !== "string") return null;

  try {
    const decodedCookie = decodeURIComponent(String(cookie));
    return JSON.parse(decodedCookie) as IUserCookieDataLike;
  } catch {
    return null;
  }
}
