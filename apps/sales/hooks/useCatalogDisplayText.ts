"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import {
  displayCatalogText,
  toSupportedLanguage,
  type CatalogLocalizedField,
} from "@/types/localized";

export function useCatalogDisplayText() {
  const locale = useLocale();
  const preferredLanguage = toSupportedLanguage(locale);

  return useCallback(
    (value: CatalogLocalizedField | undefined | null) =>
      displayCatalogText(value, preferredLanguage),
    [preferredLanguage],
  );
}
