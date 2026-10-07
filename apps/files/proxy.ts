import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
const intlMiddleware = createMiddleware(routing);
// Cookies from another tab cannot decide this tab's workspace permissions.
// The dashboard gate validates the bound tool session; shares use their own resource grant.
export function proxy(request: NextRequest) { return intlMiddleware(request); }
export const config = { matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/(en|ar|de|it|fr)/:path*'] };
