import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_COOKIE, USER_COOKIE, signInAgainUrl } from "@/constants";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { permissionsFor } from "@/lib/roles";
import type { IUserScope } from "@/types/user";

const intlMiddleware = createMiddleware(routing);
const LOCALE = /^\/(en|ar|de|fr|it)(?=\/|$)/;

/**
 * Who may enter (FS-TASKS-4):
 * - Not signed in → the suite's sign-in (SOS).
 * - Signed in without Tasks among their apps → this app's own "no access" page, in their language.
 *   They used to be bounced to the launcher with no word (TASKS-020).
 * - Signed in with Tasks → in. Each page decides what the person's role may do there, and shows a
 *   no-permission state when it's nothing. The old table of routes per role sent every project
 *   manager away from the team pages it forgot to list (TASKS-004).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = LOCALE.exec(pathname)?.[1] ?? routing.defaultLocale;
  const path = pathname.replace(LOCALE, "") || "/";

  if (path === "/auth" || path === "/auth/not-allowed") return intlMiddleware(request);

  let scopes: IUserScope[] = [];
  try {
    const parsed = JSON.parse(request.cookies.get(USER_COOKIE)?.value || "null");
    scopes = Array.isArray(parsed?.scopes) ? parsed.scopes : [];
  } catch {
    scopes = [];
  }
  const signedIn = Boolean(request.cookies.get(TOKEN_COOKIE)?.value) && scopes.length > 0;
  // Signed out: sign in through the suite and come back to this page (TASKS-021).
  if (!signedIn) return NextResponse.redirect(new URL(signInAgainUrl(pathname + request.nextUrl.search)));
  if (!permissionsFor(scopes).hasAccess) return NextResponse.redirect(new URL(`/${locale}/auth/not-allowed`, request.url));

  return intlMiddleware(request);
}

// Next 15.5 drops a matcher with a dot pattern in its lookahead (next-intl's "/((?!api|_next|_vercel|.*\..*).*)")
// without a word, and the middleware stops running; this one is the app's original.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public|icons|images).*)"],
};
