import type { SupportedLanguage } from "@/types/localized";

export type CatalogLanguageDirection = "ltr" | "rtl";

export type CatalogLanguageOption = {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: CatalogLanguageDirection;
};
