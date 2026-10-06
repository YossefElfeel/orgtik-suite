import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { TOKEN_COOKIE } from "./constants";

const AuthRoutes = [
  "/auth",
  "/auth/login",
  "/auth/reset-password",
  "/auth/forgot-password",
  "/auth/redirecting",
  "/auth/invite",
  "/auth/handoff",
];
export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const { pathname } = request.nextUrl;
  const isAuthRoute = AuthRoutes.includes(pathname);
  const isTokenValidationRoute = pathname === "/auth";
  const hasIncomingToken = request.nextUrl.searchParams.has("token");

  // If user is logged in and tries to access auth routes (except redirecting), redirect to home
  // Allow customers with sales scope to stay on redirecting page
  // Allow /auth?token= so cross-dashboard SSO can replace the current session,
  // /auth/handoff?code= so signing in on the website replaces it too, and the
  // reset step the website's Reset password opens, even with a session here
  if (
    token &&
    isAuthRoute &&
    pathname !== "/auth/redirecting" &&
    pathname !== "/auth/invite" &&
    pathname !== "/auth/handoff" &&
    pathname !== "/auth/reset-password" &&
    !(pathname === "/auth" && hasIncomingToken)
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If no token and not on auth route, redirect to login
  // The address they asked for comes along, so signing in takes them there (SOS-017: it was lost).
  // The sign-in page only follows paths on this site (lib/safe-redirect).
  if (!token && !isAuthRoute && !isTokenValidationRoute) {
    const login = new URL("/auth/login", request.url);
    if (pathname !== "/") login.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  // Customers land in their workspace (USR, D-011): Sales is a CRM, opened from the rail. (They used to be sent to the Sales portal on every page.)
  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
