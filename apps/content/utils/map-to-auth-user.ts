import { DASHBOARD_SCOPE } from "@/constants";
import { IAuthUser } from "@/types/auth";
import { IUserScope, UserRole } from "@/types/user";
import { normalizeScopes } from "@/utils/user-scopes";
import { IUser } from "@somion/sos-bar";

interface IApiScope {
  scope: string;
  roles: UserRole[];
}

type MapToAuthUserInput = Omit<IUser, "scopes" | "roles"> & {
  userRoles?: { role?: { name: string } }[];
  permissions?: unknown;
  scopes?: IApiScope[] | IUserScope[] | string[];
  roles?: UserRole[];
};

function mapLegacyUserRoles(
  userRoles?: { role?: { name: string } }[]
): UserRole[] {
  return (
    userRoles
      ?.map((userRole) => userRole.role?.name)
      .filter((name): name is UserRole => !!name) ?? []
  );
}

function dedupeRoles(roles: UserRole[]): UserRole[] {
  return Array.from(new Set(roles));
}

export function mapToAuthUser(apiUser: MapToAuthUserInput): IAuthUser {
  const {
    userRoles,
    permissions: _permissions,
    scopes,
    roles: flatRoles,
    ...rest
  } = apiUser;

  const mappedScopes: IUserScope[] = Array.isArray(scopes)
    ? normalizeScopes(scopes)
    : [];

  const dashboardRoles = mappedScopes.find(
    (entry) => entry.scope === DASHBOARD_SCOPE
  )?.roles;

  const roles = dedupeRoles(
    dashboardRoles?.length
      ? dashboardRoles
      : flatRoles?.length
        ? flatRoles
        : mappedScopes.flatMap((entry) => entry.roles).length
          ? mappedScopes.flatMap((entry) => entry.roles)
          : mapLegacyUserRoles(userRoles)
  );

  return {
    ...rest,
    scopes: mappedScopes,
    roles,
  };
}
