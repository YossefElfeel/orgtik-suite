export type SupportedLanguage = "en" | "ar" | "de" | "it" | "fr";

export type LocalizedText = Partial<Record<SupportedLanguage, string>>;

/** API field that is a resolved string for non-admin users or a map for admin users. */
export type CatalogLocalizedField = string | LocalizedText;

export const CATALOG_LANGUAGES: SupportedLanguage[] = [
  "en",
  "ar",
  "de",
  "it",
  "fr",
];

export const CATALOG_LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  ar: "العربية",
  de: "Deutsch",
  it: "Italiano",
  fr: "Français",
};

export const DEFAULT_CATALOG_LANGUAGE: SupportedLanguage = "en";

export function toSupportedLanguage(
  locale: string | undefined,
): SupportedLanguage {
  if (
    locale === "ar" ||
    locale === "de" ||
    locale === "it" ||
    locale === "fr"
  ) {
    return locale;
  }

  return DEFAULT_CATALOG_LANGUAGE;
}

export function displayCatalogText(
  value: CatalogLocalizedField | undefined | null,
  preferredLanguage: SupportedLanguage = DEFAULT_CATALOG_LANGUAGE,
): string {
  if (!value) return "—";
  if (typeof value === "string") return value.trim() || "—";

  const preferred = value[preferredLanguage]?.trim();
  if (preferred) return preferred;

  const english = value.en?.trim();
  if (english) return english;

  const first = Object.values(value).find((item) => item?.trim());
  return first?.trim() || "—";
}
