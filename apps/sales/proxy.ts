import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { TOKEN_COOKIE, signInAgainUrl } from "@/constants";
import { routing } from "./i18n/routing";
import { readRoleFromRequest } from "@/lib/role-access";

const intlMiddleware = createMiddleware(routing);
const LOCALE = /^\/(en|ar|de|fr|it)(?=\/|$)/;

/**
 * Who may enter (FS-SAL-3, FS-SAL-4):
 * - Not signed in → the suite's sign-in, coming back to this page afterwards. The page used to be
 *   lost.
 * - Signed in without the `sales` scope → this app's own "no access" page, in their language.
 *   Anyone signed in to the suite used to become a Sales admin (SAL-005).
 * - Signed in with Sales → in. Each page decides what the role may do there, and shows a
 *   no-permission state for the rest, instead of bouncing to the dashboard without a word.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const locale = LOCALE.exec(pathname)?.[1] ?? routing.defaultLocale;
  const path = pathname.replace(LOCALE, "") || "/";

  if (path === "/auth" || path === "/auth/not-allowed") return intlMiddleware(req);

  const signedIn = Boolean(req.cookies.get(TOKEN_COOKIE)?.value);
  if (!signedIn) return NextResponse.redirect(new URL(signInAgainUrl(pathname + req.nextUrl.search)));
  if (!readRoleFromRequest(req)) return NextResponse.redirect(new URL(`/${locale}/auth/not-allowed`, req.url));

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
