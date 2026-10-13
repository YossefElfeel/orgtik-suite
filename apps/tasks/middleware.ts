import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Localize the route. WorkspaceSessionGate decides admission from a validated tab session,
 * and each API request verifies current membership, entitlement and selected-workspace role.
 */
export function middleware(request: NextRequest) {
  // Mutable cross-tab cookies are hints only. The client gate validates this tab's bound token;
  // the API enforces current membership/tool access before any project data is fetched.
  return intlMiddleware(request);
}

// Next 15.5 drops a matcher with a dot pattern in its lookahead (next-intl's "/((?!api|_next|_vercel|.*\..*).*)")
// without a word, and the middleware stops running; this one is the app's original.
export const config = {
  runtime: "nodejs",
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public|icons|images).*)"],
};
