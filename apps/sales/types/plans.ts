import type { PaginationOptions } from "@/types";
import type { CatalogLocalizedField, LocalizedText } from "@/types/localized";

export type PlanStatus = "active" | "hidden" | "review";

/** @deprecated Mock-only category slug used by deal-plans mock data. */
export type PlanCategory =
  | "ui_ux_design"
  | "creative_services"
  | "content_strategy"
  | "web_development";

export type PlanDuration = "1_month" | "3_months" | "6_months" | "12_months";

export type PlanPaymentMode = "cash_only" | "installment";

export type PlanCardBadgeVariant = "primary" | "info";

export type PlanCardBadge = {
  label: string;
  variant: PlanCardBadgeVariant;
};

export type PlanCardItem = {
  id: string;
  name: string;
  categoryLabel: string;
  department: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  durationLabel: string;
  region: string;
  badges: PlanCardBadge[];
  features: string[];
  featuresTotal: number;
  currencyCode?: string;
  currencySymbol?: string;
};

export type PlanDetailFeatureTag =
  | "public"
  | "private"
  | "internal"
  | "installment"
  | "full_payment"
  | "cash_only";

export type PlanTab =
  | "plans"
  | "departments"
  | "categories"
  | "features"
  | "duration"
  | "zones";

export type PlanResourceSummary = {
  id: string;
  name: CatalogLocalizedField;
};

export type PlanCompletion = {
  isComplete: boolean;
  missingSections: string[];
};

export type PlanFeatureSummary = {
  id: string;
  name: string;
  description?: string;
  paymentType?: "full_payment" | "installment";
  visibility?: "public" | "internal";
  isActive?: boolean;
  resolvedLanguageCode?: string;
  usedFallback?: boolean;
};

export type PlanDurationTerms = {
  durationId: string;
  months: number;
  discountPercentage: string;
};

export type PlanInstallmentTerms = {
  durationId: string;
  months: number;
  markupPercentage: string;
  isMarkupApplied: boolean;
};

export type PlanInstallmentPrice = PlanInstallmentTerms & {
  monthlyPayment: string;
};

export type PlanPricingMatrixItem = {
  zoneId: string;
  zoneName: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  priceSource: "zone_override" | "country_override";
  countryCode?: string | null;
  baseMonthlyPrice: string;
  undiscountedTotal: string;
  discountPercentage: string;
  discountAmount: string;
  discountedTotal: string;
  effectiveMonthlyPrice: string;
  duration: PlanDurationTerms;
  installments: PlanInstallmentPrice[];
};

export type PlanListItem = {
  id: string;
  name: CatalogLocalizedField;
  department: PlanResourceSummary;
  category: PlanResourceSummary;
  /** All categories on the plan; first item matches `category` (primary). */
  categories?: PlanResourceSummary[];
  activationRequested: boolean;
  isActive: boolean;
  isPrivate: boolean;
  completion: PlanCompletion;
  features: PlanFeatureSummary[];
  featureCount: number;
  publicFeatureCount: number;
  installmentFeatureCount: number;
  zoneCount: number;
  countryOverrideCount: number;
  durationCount: number;
  minimumDurationMonths: number | null;
  maximumDurationMonths: number | null;
  paymentMode: PlanPaymentMode;
  zones: PlanResourceSummary[];
  pricingMatrix: PlanPricingMatrixItem[];
  /** Country-scoped prices when `countryCode` was passed on the request. */
  resolvedPrice?: PlanPricingMatrixItem[];
};

export type PlanManagerSummary = {
  id: number;
  displayName?: string | null;
  avatar?: string | null;
  isActive?: boolean | null;
  isAvailable: boolean;
};

export type PlanCountryPrice = {
  countryCode: string;
  countryName: string;
  priceSource: "inherit" | "country_override";
  overridePrice?: string | null;
  pricingMatrix: PlanPricingMatrixItem[];
};

export type PlanZoneDetail = {
  id: string;
  name: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  priceSource: "zone_override";
  basePrice?: string | null;
  countryOverrideCount: number;
  countries: PlanCountryPrice[];
};

export type PlanCommission = {
  type: "percentage" | "fixed";
  amount: string;
  currencyCode: string;
};

export type PlanDto = PlanListItem & {
  description: CatalogLocalizedField;
  manager: PlanManagerSummary | null;
  allFeatures: PlanFeatureSummary[];
  planDurations: PlanDurationTerms[];
  installmentsEnabled: boolean;
  installmentDurations: PlanInstallmentTerms[];
  zoneDetails: PlanZoneDetail[];
  availableZoneCount: number;
  allZonesEnabled: boolean;
  commission: PlanCommission | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanCountryPriceInput = {
  countryCode: string;
  price: string;
};

export type PlanZonePriceInput = {
  zoneId: string;
  basePrice?: string;
  countryOverrides?: PlanCountryPriceInput[];
};

export type PlanCommissionInput = {
  type: "percentage" | "fixed";
  amount: string;
};

export type CreatePlanDTO = {
  name: LocalizedText;
  description: LocalizedText;
  departmentId: string;
  /** @deprecated Prefer `categoryIds`. Ignored when `categoryIds` is sent. */
  categoryId?: string;
  categoryIds: string[];
  isActive: boolean;
  isPrivate?: boolean;
  featureIds?: string[];
  planDurationIds?: string[];
  installmentsEnabled?: boolean;
  installmentDurationIds?: string[];
  zonePrices?: PlanZonePriceInput[];
  commission?: PlanCommissionInput | null;
};

export type UpdatePlanDTO = Partial<CreatePlanDTO>;

export type GetPlanQueryArg =
  | string
  | {
      id: string;
      countryCode?: string;
    };

export type PlansQueryParams = PaginationOptions & {
  q?: string;
  categoryIds?: string[];
  departmentIds?: string[];
  zoneIds?: string[];
  paymentMode?: PlanPaymentMode;
  isActive?: boolean;
  countryCode?: string;
  _locale?: string;
};

export type PlanPricingPreflightRequest = {
  featureIds: string[];
  zoneIds?: string[];
  planDurationIds?: string[];
  installmentDurationIds?: string[];
};

export type PlanPricingPreflightCountry = {
  countryCode: string;
  countryName: string;
  suggestedPrice: string | null;
};

export type PlanPricingPreflightDuration = {
  duration: PlanDurationTerms;
  undiscountedTotal: string;
  discountAmount: string;
  discountedTotal: string;
  effectiveMonthlyPrice: string;
  installments: PlanInstallmentPrice[];
};

export type PlanPricingPreflightZone = {
  zoneId: string;
  zoneName: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  minorUnits: number;
  suggestedBasePrice: string | null;
  /** Features in this zone missing a price; when > 0, `durations` may be empty. */
  unpricedFeatureCount: number;
  countries: PlanPricingPreflightCountry[];
  durations: PlanPricingPreflightDuration[];
};

export type PlanPricingPreflightResult = {
  featureTotalUsd: string;
  ratesAsOf: string | null;
  zones: PlanPricingPreflightZone[];
};
