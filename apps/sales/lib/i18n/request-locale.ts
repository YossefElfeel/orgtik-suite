import { getCookie } from "cookies-next";

import { NEXT_LOCALE } from "@/constants";
import { routing, type Locale } from "@/i18n/routing";

function isSupportedLocale(value: string | undefined | null): value is Locale {
  return Boolean(value && routing.locales.includes(value as Locale));
}

function getLocaleFromPathname(pathname: string): Locale | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isSupportedLocale(segment) ? segment : null;
}

export function getRequestLocale(): Locale {
  if (typeof window !== "undefined") {
    const pathnameLocale = getLocaleFromPathname(window.location.pathname);
    if (pathnameLocale) {
      return pathnameLocale;
    }
  }

  const cookieLocale = getCookie(NEXT_LOCALE);
  if (typeof cookieLocale === "string" && isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  return routing.defaultLocale;
}
