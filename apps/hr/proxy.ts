import { NextRequest, NextResponse } from "next/server";
import { NEXT_LOCALE, TOKEN_COOKIE } from "@/constants";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { suiteSignIn } from "./lib/suite-return";

const intlMiddleware = createMiddleware(routing);

/*
 * Sessions (HR wave, FS-HR-2):
 * - No session on an HR page: through SOS, which opens HR again with a one-time code and brings the
 *   person back to the page they asked for (/go/hr_system?redirect=…, SOS 9a8b34e).
 * - The hand-off page always runs when it carries a code, even over an older session:
 *   that is how a different person (or "View as") arrives.
 * - Nothing about the session is logged.
 */
export function proxy(req: NextRequest) {
  const { pathname, search, searchParams } = req.nextUrl;
  const locale = req.cookies.get(NEXT_LOCALE)?.value || "en";
  const token = req.cookies.get(TOKEN_COOKIE)?.value;

  // Remove the locale prefix (e.g. /en/auth -> /auth).
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");
  const isAuthRoute = pathWithoutLocale === "/auth" || pathWithoutLocale.startsWith("/auth/");
  const handingOver = pathWithoutLocale === "/auth" && searchParams.has("code");

  if (!isAuthRoute && !token) {
    return NextResponse.redirect(suiteSignIn(`${pathWithoutLocale}${search}`));
  }

  if (isAuthRoute && token && !handingOver && pathWithoutLocale !== "/auth/not-allowed") {
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
