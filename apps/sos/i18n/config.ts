// SOS languages (VS-1). SOS keeps its URLs, which the suite launcher and every app's hand-off
// point to, so the language lives in a cookie instead of the path; see i18n/request.ts.
export const LOCALES = ["en", "ar", "de", "fr", "it"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const isLocale = (v: unknown): v is AppLocale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

/** The best of our languages for an Accept-Language header, or null. */
export function fromAcceptLanguage(header: string | null): AppLocale | null {
  if (!header) return null;
  const wanted = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of wanted) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}
