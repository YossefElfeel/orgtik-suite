import { NextRequest, NextResponse } from "next/server";
import {
  DASHBOARD_SCOPE,
  NEXT_LOCALE,
  TOKEN_COOKIE,
  USER_COOKIE,
} from "@/constants";
import createMiddleware from "next-intl/middleware";
import { Locale, routing } from "./i18n/routing";
import { getUnauthorizedRedirectUrl } from "./lib/get-unauthorized-redirect-url";
import { hasScope, parseUserCookie } from "./utils/user-scopes";

// Define protected auth routes
const authRoutes = ["/auth"];

const intlMiddleware = createMiddleware(routing);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const locale = req.cookies.get(NEXT_LOCALE)?.value || "en";
  const token = req.cookies.get(TOKEN_COOKIE)?.value;

  // Remove the locale prefix from pathname (e.g., /en/auth -> /auth)
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");

  const isAuthRoute = authRoutes.some((route) =>
    pathWithoutLocale.startsWith(route)
  );

  // Case 1: Accessing a protected route (not /auth) without a token
  if (!isAuthRoute && !token) {
    return NextResponse.redirect(new URL(getUnauthorizedRedirectUrl(locale as Locale), req.url));
  }

  // Case 1b: Authenticated but missing dashboard scope
  if (!isAuthRoute && token) {
    const user = parseUserCookie(req.cookies.get(USER_COOKIE)?.value);
    if (user && !hasScope(user.scopes, DASHBOARD_SCOPE)) {
      return NextResponse.redirect(
        new URL(getUnauthorizedRedirectUrl(locale as Locale), req.url)
      );
    }
  }

  // A new handoff must validate its incoming token even when an older session
  // exists, then show the shared confirmation. Bare /auth keeps its usual landing.
  const hasIncomingToken = pathWithoutLocale === "/auth" && Boolean(req.nextUrl.searchParams.get("token"));
  if (isAuthRoute && token && !hasIncomingToken) {
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  // Case 3: Block access to /auth/not-allowed if it's not the configured redirect URL
  if (pathWithoutLocale === "/auth/not-allowed" && !getUnauthorizedRedirectUrl(locale as Locale).includes("/auth/not-allowed")) {
    return NextResponse.redirect(new URL(getUnauthorizedRedirectUrl(locale as Locale), req.url));
  }

  // Otherwise, continue with intl middleware
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
