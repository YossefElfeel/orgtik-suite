import type { PaginationOptions } from "@/types";
import type { CatalogLocalizedField } from "@/types/localized";

export type FeaturePaymentType = "full_payment" | "installment";

export type FeatureVisibility = "public" | "internal";

export type FeatureTranslation = {
  languageCode: string;
  name: string;
  description: string;
};

export type FeatureCategory = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
};

/** Country/zone-scoped price returned when resolving feature pricing for a quote context. */
export type FeatureResolvedPrice = {
  zoneId: string;
  zoneName: string;
  currencyCode: string;
  currencyName?: string;
  currencySymbol?: string;
  priceSource: "zone_override" | "country_override";
  countryCode?: string | null;
  price: string;
};

export type FeatureCountryOverride = {
  countryCode: string;
  countryName?: string;
  price: string;
};

export type FeatureZonePrice = {
  zoneId: string;
  zoneName?: string;
  currencyCode?: string;
  /** null means no price configured for this zone. */
  basePrice: string | null;
  countryOverrides: FeatureCountryOverride[];
};

export type FeatureListItem = {
  id: string;
  name: string;
  description: string;
  categoryName: string;
  paymentType: FeaturePaymentType;
  visibility: FeatureVisibility;
  /** Present when list responses include zone pricing. */
  zonePrices?: FeatureZonePrice[];
  /** Price in the caller's zone (or when `countryCode` was passed); null if unpriced. */
  resolvedPrice?: FeatureResolvedPrice | null;
  createdAt: string;
  updatedAt: string;
};

export type FeatureCountryPriceInput = {
  countryCode: string;
  price: string;
};

export type FeatureZonePriceInput = {
  zoneId: string;
  basePrice?: string;
  countryOverrides?: FeatureCountryPriceInput[];
};

export type Feature = {
  id: string;
  defaultLanguageCode: string;
  translations: FeatureTranslation[];
  name: string;
  description: string;
  resolvedLanguageCode: string;
  usedFallback: boolean;
  category: FeatureCategory;
  paymentType: FeaturePaymentType;
  visibility: FeatureVisibility;
  isActive: boolean;
  planCount: number;
  /** Present on GET /features/:id — per-zone / per-country prices. */
  zonePrices?: FeatureZonePrice[];
  /** Price in the caller's zone; null if the feature is not sold there. */
  resolvedPrice?: FeatureResolvedPrice | null;
  createdAt: string;
  updatedAt: string;
};

export type FeatureTranslationInput = {
  languageCode: string;
  name: string;
  description: string;
};

export type CreateFeatureDTO = {
  categoryId: string;
  defaultLanguageCode: string;
  translations: FeatureTranslationInput[];
  priceUsd: string;
  paymentType: FeaturePaymentType;
  visibility: FeatureVisibility;
  isActive: boolean;
  /** Full replace on PATCH when sent; omit to leave existing zone prices untouched. */
  zonePrices?: FeatureZonePriceInput[];
};

export type UpdateFeatureDTO = Partial<CreateFeatureDTO>;

export type GetFeatureQueryArg =
  | string
  | {
      id: string;
      countryCode?: string;
    };

export type FeaturesQueryParams = PaginationOptions & {
  q?: string;
  departmentId?: string;
  categoryId?: string;
  categoryIds?: string[];
  paymentType?: FeaturePaymentType;
  visibility?: FeatureVisibility;
  isActive?: boolean;
  _locale?: string;
};

export type GroupedFeaturesQueryParams = PaginationOptions & {
  q?: string;
  categoryId?: string;
  categoryIds?: string[];
  isActive?: boolean;
  _locale?: string;
};

export type GroupedFeaturesGroup = {
  categoryId: string;
  categoryName: string | CatalogLocalizedField;
  features: FeatureListItem[];
};

export type FeatureLanguageZone = {
  id: string;
  name: string;
  isDefault: boolean;
};

export type FeatureLanguageCatalogItem = {
  code: string;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  zones: FeatureLanguageZone[];
};

export type FeatureLanguageCatalogQueryParams = PaginationOptions;

export type FeatureTranslationRecord = {
  name: string;
  description: string;
};
