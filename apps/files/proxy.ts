import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { USER_COOKIE } from "@/constants";
import { IUserRole, SOS_URL } from "@somion/sos-bar";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function hasAccessToRoute(pathname: string, userRoles: IUserRole[]): boolean {
  if (userRoles.includes("super_admin" as IUserRole)) return true;

  return userRoles.length > 0;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameWithoutLocale = pathname.replace(/^\/(en|ar|de|it|fr)(\/|$)/, "/");

  const userCookie = request.cookies.get(USER_COOKIE)?.value || "{}";
  let userRoles: IUserRole[] = [];

  try {
    const userData = JSON.parse(userCookie);
    userRoles = userData?.roles || [];
  } catch (e) {
    userRoles = [];
  }

  const isAuthenticated = userRoles.length > 0;
  const isPublicRoute =
    pathnameWithoutLocale.startsWith("/auth/not-allowed") ||
    pathnameWithoutLocale.startsWith("/share");

  if (isAuthenticated && !isPublicRoute) {
    if (!hasAccessToRoute(pathnameWithoutLocale, userRoles)) {
      const sosUrl = new URL(SOS_URL);
      sosUrl.searchParams.set("redirect", encodeURIComponent(request.url));
      sosUrl.searchParams.set("scope", pathnameWithoutLocale);

      return NextResponse.redirect(sosUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)", "/(en|ar|de|it|fr)/:path*"],
};
