import type { CatalogLanguageOption } from "@/types/catalog-language";
import type { SupportedLanguage } from "@/types/localized";

export const CATALOG_LANGUAGE_OPTIONS: CatalogLanguageOption[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    direction: "ltr",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    direction: "rtl",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    direction: "ltr",
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    direction: "ltr",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    direction: "ltr",
  },
];

type CatalogLanguageDisplay = {
  /** Iconify Flagpack icon suffix, e.g. `gb-ukm`, `de` */
  flagCode: string;
};

const FLAG_CODES: Record<SupportedLanguage, string> = {
  en: "gb-ukm",
  ar: "sa",
  de: "de",
  it: "it",
  fr: "fr",
};

export function getCatalogLanguageDisplay(
  code: SupportedLanguage,
): CatalogLanguageDisplay {
  return {
    flagCode: FLAG_CODES[code] ?? code.toLowerCase(),
  };
}
