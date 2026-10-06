/**
 * Chats' languages (Chats wave, FS-CHT-3). Chats keeps its addresses - guest and message links stay
 * language-free - so, like SOS, the language is the person's choice in the suite's NEXT_LOCALE cookie,
 * else their browser's language, else English. Server and client both import this file.
 */

export const LOCALES = ["en", "ar", "de", "fr", "it"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Each language named in itself, for the language menus. */
export const LOCALE_NAMES: Record<AppLocale, string> = {
  en: "English",
  ar: "العربية",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
};

export const isLocale = (v: unknown): v is AppLocale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

/** The best of our languages for an Accept-Language header, or null. */
export function fromAcceptLanguage(header: string | null): AppLocale | null {
  if (!header) return null;
  const wanted = header
    .split(",")
    .map((part) => {
      const [tag = "", q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of wanted) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}
