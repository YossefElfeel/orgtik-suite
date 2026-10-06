import { z } from "zod";

import {
  emptyLocalizedRecord,
  localizedStringSchema,
} from "@/lib/form/localized-fields";
import type {
  CreateFeatureDTO,
  Feature,
  FeatureTranslation,
  FeatureTranslationInput,
  FeatureZonePriceInput,
} from "@/types/features";
import type { Zone } from "@/types/zones";
import {
  CATALOG_LANGUAGES,
  toSupportedLanguage,
  type SupportedLanguage,
} from "@/types/localized";

export const DEFAULT_FEATURE_LANGUAGE_CODE = "en";

export const featureZoneOverrideSchema = z.object({
  countryCode: z.string().min(1),
  countryName: z.string().min(1),
  price: z.coerce.number().min(0),
});

export const featureZoneSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  price: z.coerce.number().min(0),
  overrides: z.array(featureZoneOverrideSchema),
});

export const featureFormSchema = z.object({
  name: localizedStringSchema(undefined, {
    requiredMessage: "Feature name is required in at least one language",
  }),
  description: localizedStringSchema(undefined, {
    requiredMessage: "Description is required in at least one language",
  }),
  categoryId: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  visibility: z.enum(["public", "internal"], {
    required_error: "Visibility is required",
  }),
  isActive: z.boolean(),
  paymentType: z.enum(["installment", "full_payment"], {
    required_error: "Payment type is required",
  }),
  zones: z.array(featureZoneSchema),
});

export type FeatureFormValues = z.infer<typeof featureFormSchema>;

function parseNumericValue(value: string | null | undefined) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

export function createFeatureDefaultValues(
  availableZones: Zone[] = [],
): FeatureFormValues {
  return {
    name: emptyLocalizedRecord(),
    description: emptyLocalizedRecord(),
    categoryId: "",
    price: 0,
    visibility: "public",
    isActive: true,
    paymentType: "full_payment",
    zones: availableZones.map((zone) => ({
      id: zone.id,
      enabled: true,
      price: 0,
      overrides: [],
    })),
  };
}

export function mapFeatureTranslationsToForm(
  translations: FeatureTranslation[],
  fallback: { name: string; description: string },
): Pick<FeatureFormValues, "name" | "description"> {
  const name = emptyLocalizedRecord();
  const description = emptyLocalizedRecord();

  for (const item of translations) {
    const code = toSupportedLanguage(item.languageCode);
    name[code] = item.name;
    description[code] = item.description;
  }

  const defaultCode = toSupportedLanguage(DEFAULT_FEATURE_LANGUAGE_CODE);

  if (!CATALOG_LANGUAGES.some((code) => name[code]?.trim())) {
    name[defaultCode] = fallback.name;
  }

  if (!CATALOG_LANGUAGES.some((code) => description[code]?.trim())) {
    description[defaultCode] = fallback.description;
  }

  return { name, description };
}

export function buildFeatureTranslationsPayload(
  name: Partial<Record<SupportedLanguage, string>>,
  description: Partial<Record<SupportedLanguage, string>>,
): FeatureTranslationInput[] {
  return CATALOG_LANGUAGES.map((code) => ({
    languageCode: code,
    name: name[code]?.trim() ?? "",
    description: description[code]?.trim() ?? "",
  })).filter(
    (entry) => entry.name.length > 0 || entry.description.length > 0,
  );
}

/** API Matches /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/ — send whole numbers only. */
function toWholePriceString(value: number) {
  return String(Math.round(value));
}

export function toFeatureZonePricesPayload(
  zones: FeatureFormValues["zones"],
): FeatureZonePriceInput[] {
  return zones
    .filter((zone) => zone.enabled)
    .map((zone) => ({
      zoneId: zone.id,
      // 0 leaves the feature explicitly unpriced in that zone.
      basePrice: toWholePriceString(zone.price),
      countryOverrides: zone.overrides
        .filter((override) => override.price !== zone.price)
        .map((override) => ({
          countryCode: override.countryCode,
          price: toWholePriceString(override.price),
        })),
    }));
}

export function toCreateFeatureDTO(values: FeatureFormValues): CreateFeatureDTO {
  return {
    categoryId: values.categoryId,
    defaultLanguageCode: DEFAULT_FEATURE_LANGUAGE_CODE,
    translations: buildFeatureTranslationsPayload(
      values.name,
      values.description,
    ),
    priceUsd: values.price.toFixed(2),
    paymentType: values.paymentType,
    visibility: values.visibility,
    isActive: values.isActive,
    zonePrices: toFeatureZonePricesPayload(values.zones),
  };
}

export function toFeatureFormValues(
  feature: Feature,
  availableZones: Zone[],
): FeatureFormValues {
  const zonePricesById = new Map(
    (feature.zonePrices ?? []).map((zonePrice) => [zonePrice.zoneId, zonePrice]),
  );

  const localizedFields = mapFeatureTranslationsToForm(feature.translations, {
    name: feature.name,
    description: feature.description,
  });

  return {
    ...localizedFields,
    categoryId: feature.category.id,
    // priceUsd is write-only; detail responses no longer return a display USD price.
    price: 0,
    visibility: feature.visibility,
    isActive: feature.isActive,
    paymentType: feature.paymentType,
    zones: availableZones.map((zone) => {
      const existing = zonePricesById.get(zone.id);

      // No zonePrices on the feature yet — mirror create defaults (all zones on, unpriced).
      if (!feature.zonePrices?.length) {
        return {
          id: zone.id,
          enabled: true,
          price: 0,
          overrides: [],
        };
      }

      return {
        id: zone.id,
        enabled: existing != null,
        price: parseNumericValue(existing?.basePrice),
        overrides: (existing?.countryOverrides ?? []).map((override) => ({
          countryCode: override.countryCode,
          countryName: override.countryName ?? override.countryCode,
          price: parseNumericValue(override.price),
        })),
      };
    }),
  };
}
