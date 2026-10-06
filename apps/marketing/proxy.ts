import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { TOKEN_COOKIE, USER_COOKIE, signInAgainUrl } from "@/constants";
import { routing } from "./i18n/routing";
import { permissionsFor } from "@/lib/roles";
import type { IUserScope } from "@/types/user";

const intlMiddleware = createMiddleware(routing);
const LOCALE = /^\/(en|ar|de|fr|it)(?=\/|$)/;

/**
 * Who may enter (FS-MKT-4):
 * - Not signed in → the suite's sign-in, coming back to this page afterwards (MKT-030).
 * - Signed in without Marketing among their apps → this app's own "no access" page, in their
 *   language. Any SOS user used to get the whole app (MKT-004).
 * - Signed in with Marketing → in. Each page decides what the person's role may do there.
 * The integrations wizard is no longer open to signed-out visitors (MKT-018).
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const locale = LOCALE.exec(pathname)?.[1] ?? routing.defaultLocale;
  const path = pathname.replace(LOCALE, "") || "/";

  if (path === "/auth" || path === "/auth/not-allowed") return intlMiddleware(req);

  let scopes: IUserScope[] = [];
  try {
    const parsed = JSON.parse(req.cookies.get(USER_COOKIE)?.value || "null");
    scopes = Array.isArray(parsed?.scopes) ? parsed.scopes : [];
  } catch {
    scopes = [];
  }
  const signedIn = Boolean(req.cookies.get(TOKEN_COOKIE)?.value) && scopes.length > 0;
  if (!signedIn) return NextResponse.redirect(new URL(signInAgainUrl(pathname + req.nextUrl.search)));
  if (!permissionsFor(scopes).hasAccess) return NextResponse.redirect(new URL(`/${locale}/auth/not-allowed`, req.url));

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|media|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
