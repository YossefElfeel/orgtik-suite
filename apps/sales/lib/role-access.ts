import type { NextRequest } from "next/server";
import { USER_COOKIE } from "@/constants";
import { routing } from "@/i18n/routing";
import { NAV_ITEMS } from "@/lib/navigation";
import { salesRoleFrom, type AppRole } from "@/types/role";
import type {
  NavItemConfig,
  RouteAccessConfig,
  SidebarNavItem,
} from "@/types/navigation";

const ALL_ROLES: AppRole[] = ["admin", "manager", "salesman", "customer"];

const EXTRA_ROUTE_ACCESS: RouteAccessConfig[] = [
  ...(process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1" ? [{ path: "/presentation", roles: ALL_ROLES, matchPrefix: true }] : []),
  {
    path: "/profile",
    roles: ALL_ROLES,
    matchPrefix: true,
  },
  {
    path: "/demo",
    roles: ["admin"],
    matchPrefix: true,
  },
  // Customer may browse plans + plan detail only (not admin CRUD sections).
  {
    path: "/plan-management/departments",
    roles: ["admin", "manager"],
    matchPrefix: true,
  },
  {
    path: "/plan-management/categories",
    roles: ["admin", "manager"],
    matchPrefix: true,
  },
  {
    path: "/plan-management/features",
    roles: ["admin", "manager"],
    matchPrefix: true,
  },
  {
    path: "/plan-management/duration",
    roles: ["admin", "manager"],
    matchPrefix: true,
  },
  {
    path: "/plan-management/zones",
    roles: ["admin", "manager"],
    matchPrefix: true,
  },
];

function navItemToRouteAccess(item: NavItemConfig): RouteAccessConfig {
  return {
    path: item.path,
    roles: item.roles,
    matchPrefix: item.path !== "/",
  };
}

function getRouteAccessConfigs(): RouteAccessConfig[] {
  return [
    ...NAV_ITEMS.map(navItemToRouteAccess),
    ...EXTRA_ROUTE_ACCESS,
  ];
}

/** Strip locale prefix from pathname (e.g. /en/projects → /projects). */
export function normalizePathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  const [first, ...rest] = segments;

  if (routing.locales.includes(first as (typeof routing.locales)[number])) {
    return rest.length > 0 ? `/${rest.join("/")}` : "/";
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function getNavLabel(item: NavItemConfig, role: AppRole): string {
  return item.labelsByRole?.[role] ?? item.label;
}

export function getSidebarItemsForRole(role: AppRole): SidebarNavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role)).map(
    (item) => ({
      label: getNavLabel(item, role),
      icon: item.icon,
      path: item.path,
    }),
  );
}

function matchesRouteAccess(
  path: string,
  config: RouteAccessConfig,
): boolean {
  if (config.path === "/") {
    return path === "/";
  }

  if (path === config.path) {
    return true;
  }

  if (config.matchPrefix && path.startsWith(`${config.path}/`)) {
    return true;
  }

  return false;
}

export function canAccessRoute(role: AppRole, pathname: string): boolean {
  const path = normalizePathname(pathname);
  const configs = getRouteAccessConfigs();

  const matchingConfig = configs
    .filter((config) => matchesRouteAccess(path, config))
    .sort((a, b) => b.path.length - a.path.length)[0];

  if (!matchingConfig) {
    return false;
  }

  return matchingConfig.roles.includes(role);
}

export function getDefaultRouteForRole(_role: AppRole): string {
  return "/";
}

export function getLocaleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (routing.locales.includes(first as (typeof routing.locales)[number])) {
    return first;
  }

  return routing.defaultLocale;
}

export function buildLocalizedPath(pathname: string, path: string): string {
  const locale = getLocaleFromPathname(pathname);

  if (path === "/") {
    return `/${locale}`;
  }

  return `/${locale}${path}`;
}

/** The person's Sales role from the user cookie's scopes, or null when Sales isn't theirs (SAL-005). */
export function readRoleFromRequest(request: NextRequest): AppRole | null {
  const userCookie = request.cookies.get(USER_COOKIE)?.value;
  if (!userCookie) return null;
  try {
    const user = JSON.parse(userCookie) as { scopes?: unknown };
    return salesRoleFrom(user.scopes);
  } catch {
    return null;
  }
}
