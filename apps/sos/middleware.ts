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
  // Services use the validated tab session and signed API admission. Cookie
  // hints are unreliable across the shared-domain proxy; the dashboard's client
  // gate handles guests while every API still validates current access.
  if (request.nextUrl.basePath === "/sos") return NextResponse.next();
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const { pathname } = request.nextUrl;
  const isAuthRoute = AuthRoutes.includes(pathname);
  const isTokenValidationRoute = pathname === "/auth";
  const isWorkspaceInvitation = /^\/invite\/[^/]+$/.test(pathname);
  const hasIncomingHandoff = request.nextUrl.searchParams.has("code");
  const staffLogin = pathname === "/auth/login" && request.nextUrl.searchParams.get("mode") === "staff" && ["admin", "wm"].includes(request.nextUrl.searchParams.get("target") || "");

  // If user is logged in and tries to access auth routes (except redirecting), redirect to home
  // Allow customers with sales scope to stay on redirecting page
  // Allow /auth?code= so a scoped cross-domain handoff can replace the current tab,
  // /auth/handoff?code= so signing in on the website replaces it too, and the
  // reset step the website's Reset password opens, even with a session here
  if (
    token &&
    isAuthRoute &&
    pathname !== "/auth/redirecting" &&
    pathname !== "/auth/invite" &&
    pathname !== "/auth/handoff" &&
    pathname !== "/auth/reset-password" &&
    !(pathname === "/auth/login" && request.nextUrl.searchParams.get("switch") === "1") &&
    !staffLogin &&
    !(pathname === "/auth" && hasIncomingHandoff)
  ) {
    return NextResponse.redirect(new URL(`${request.nextUrl.basePath}/`, request.url));
  }

  // If no token and not on auth route, redirect to login
  // The address they asked for comes along, so signing in takes them there (SOS-017: it was lost).
  // The sign-in page only follows paths on this site (lib/safe-redirect).
  if (!token && !isAuthRoute && !isTokenValidationRoute && !isWorkspaceInvitation) {
    const login = new URL(`${request.nextUrl.basePath}/auth/login`, request.url);
    if (pathname !== "/") login.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  // Customers land in their workspace (USR, D-011): Sales is a CRM, opened from the rail. (They used to be sent to the Sales portal on every page.)
  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
