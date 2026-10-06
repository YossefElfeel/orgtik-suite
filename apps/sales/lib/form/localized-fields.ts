import { z } from "zod";

import { CATALOG_LANGUAGE_OPTIONS } from "@/lib/i18n/catalog-languages";
import type { CatalogLanguageOption } from "@/types/catalog-language";
import {
  CATALOG_LANGUAGES,
  DEFAULT_CATALOG_LANGUAGE,
  type CatalogLocalizedField,
  type LocalizedText,
  type SupportedLanguage,
} from "@/types/localized";

export function getLanguageCodes(
  languages: CatalogLanguageOption[] = CATALOG_LANGUAGE_OPTIONS,
): SupportedLanguage[] {
  return languages.map((language) => language.code);
}

export function getDefaultFormLanguage(
  languages: CatalogLanguageOption[] = CATALOG_LANGUAGE_OPTIONS,
): SupportedLanguage {
  const defaultLanguage = languages.find(
    (language) => language.code === DEFAULT_CATALOG_LANGUAGE,
  );

  return defaultLanguage?.code ?? languages[0]?.code ?? DEFAULT_CATALOG_LANGUAGE;
}

export function emptyLocalizedRecord(
  languages: CatalogLanguageOption[] = CATALOG_LANGUAGE_OPTIONS,
): Record<SupportedLanguage, string> {
  const record = {} as Record<SupportedLanguage, string>;

  for (const language of languages) {
    record[language.code] = "";
  }

  return record;
}

export function mapLocalizedToForm(
  value: CatalogLocalizedField | undefined | null,
  languages: CatalogLanguageOption[] = CATALOG_LANGUAGE_OPTIONS,
  fallbackLocale?: SupportedLanguage,
): Record<SupportedLanguage, string> {
  const record = emptyLocalizedRecord(languages);

  if (!value) {
    return record;
  }

  if (typeof value === "string") {
    const locale = fallbackLocale ?? getDefaultFormLanguage(languages);
    record[locale] = value;
    return record;
  }

  for (const language of languages) {
    record[language.code] = value[language.code] ?? "";
  }

  return record;
}

export function buildLocalizedPayload(
  value:
    | Record<SupportedLanguage, string>
    | Partial<Record<SupportedLanguage, string>>,
): LocalizedText {
  return Object.fromEntries(
    CATALOG_LANGUAGES.filter((code) => value[code]?.trim()).map((code) => [
      code,
      value[code]!.trim(),
    ]),
  ) as LocalizedText;
}

type LocalizedStringSchemaOptions = {
  requiredMessage?: string;
};

/**
 * Localized map schema.
 * API requires at least one non-empty language; others are optional.
 * When invalid, every empty language key gets an error so each tab shows feedback.
 */
export function localizedStringSchema(
  languages: CatalogLanguageOption[] = CATALOG_LANGUAGE_OPTIONS,
  options?: LocalizedStringSchemaOptions,
) {
  const codes = getLanguageCodes(languages);
  const shape = Object.fromEntries(
    codes.map((code) => [code, z.string()]),
  ) as Record<SupportedLanguage, z.ZodString>;

  const requiredMessage =
    options?.requiredMessage ??
    "At least one language translation is required";

  return z.object(shape).superRefine((value, context) => {
    const filledCodes = codes.filter(
      (code) => (value[code] ?? "").trim().length > 0,
    );

    if (filledCodes.length > 0) {
      return;
    }

    for (const code of codes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredMessage,
        path: [code],
      });
    }
  });
}

type LocalizedNameDescriptionPair = {
  name: Record<SupportedLanguage, string>;
  description: Record<SupportedLanguage, string>;
};

type LocalizedNameDescriptionPairOptions = {
  languages?: CatalogLanguageOption[];
  nameRequiredMessage?: string;
  descriptionRequiredMessage?: string;
};

/**
 * If a language has a name, description is required for that language (and vice versa).
 */
export function refineLocalizedNameDescriptionPair(
  data: LocalizedNameDescriptionPair,
  context: z.RefinementCtx,
  options?: LocalizedNameDescriptionPairOptions,
) {
  const codes = getLanguageCodes(options?.languages);
  const nameRequiredMessage =
    options?.nameRequiredMessage ??
    "Name is required when description is provided for this language";
  const descriptionRequiredMessage =
    options?.descriptionRequiredMessage ??
    "Description is required when name is provided for this language";

  for (const code of codes) {
    const hasName = (data.name[code] ?? "").trim().length > 0;
    const hasDescription = (data.description[code] ?? "").trim().length > 0;

    if (hasName && !hasDescription) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: descriptionRequiredMessage,
        path: ["description", code],
      });
    }

    if (hasDescription && !hasName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: nameRequiredMessage,
        path: ["name", code],
      });
    }
  }
}

/** Parent field names for step triggers (validates the whole localized object). */
export function localizedStepFieldPaths(
  field: "name" | "description",
): string[] {
  return [field];
}
