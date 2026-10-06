import type { IPagination } from "./index";
import type { CatalogLocalizedField, LocalizedText } from "@/types/localized";

export type PackagePrice = {
  zoneId: string;
  zoneName: string;
  currencyCode: string;
  amount: string;
  countryOverrideCount: number;
};

export type PackageItem = {
  id: string;
  name: CatalogLocalizedField;
  description: CatalogLocalizedField;
  planNames: CatalogLocalizedField[];
  prices: PackagePrice[];
};

export interface PackagesPaginated {
  items: PackageItem[];
  meta: IPagination;
}

export type PackageDetailPlanFeature = {
  id: string;
  name: string;
  description: string;
  zonePrices?: {
    zoneId: string;
    zoneName: string;
    currencyCode: string;
    basePrice: string;
  }[];
  resolvedPrice?: {
    zoneId: string;
    zoneName: string;
    currencyCode: string;
    price: string;
  }[];
  paymentType: string;
  visibility: string;
  isActive: boolean;
};

export type PackageDetailPlan = {
  id: string;
  name: CatalogLocalizedField;
  isActive: boolean;
  description?: CatalogLocalizedField;
  category?: {
    id: string;
    name: CatalogLocalizedField;
  };
  department?: {
    id: string;
    name: CatalogLocalizedField;
  };
  allFeatures?: PackageDetailPlanFeature[];
  pricingMatrix?: {
    zoneId: string;
    zoneName: string;
    currencyCode: string;
    baseMonthlyPrice: string;
    undiscountedTotal: string;
    discountedTotal: string;
    discountPercentage: string;
    discountAmount: string;
    effectiveMonthlyPrice: string;
  }[];
};

export type PackageCountryOverride = {
  countryCode: string;
  price: string;
  effectivePrice: string;
};

export type PackageDetailZone = {
  zoneId: string;
  zoneName: string;
  currencyCode: string;
  amount: string;
  countryOverrideCount: number;
  basePrice: string;
  priceSource: "manual" | "auto" | string;
  derivedPlansTotal: string;
  countryOverrides: PackageCountryOverride[];
};

export type PackageDetail = {
  id: string;
  name: CatalogLocalizedField;
  description: CatalogLocalizedField;
  status: string;
  category: CatalogLocalizedField;
  department: CatalogLocalizedField;
  planCount: number;
  publicPlanCount: number;
  installmentPlanCount: number;
  planDurationCount: number;
  minimumDurationMonths: number;
  maximumDurationMonths: number;
  installmentsEnabled: boolean;
  pricingSummary: {
    plansBoughtSeparately: number;
    currencyCode: string;
    originalAmount: string;
    bundlePrice: string;
    savingsAmount: string;
    savingsPercentage: string;
  }[];
  plans: PackageDetailPlan[];
  zones: PackageDetailZone[];
  createdAt: string;
  updatedAt: string;
};

export interface PackagesQueryParams {
  page?: number;
  limit?: number;
  q?: string;
}

export interface PackageCreatePayload {
  name: LocalizedText;
  description: LocalizedText;
  planIds: string[];
  zones: {
    zoneId: string;
    price: string;
    countryOverrides?: {
      countryCode: string;
      price: string;
    }[];
  }[];
}
