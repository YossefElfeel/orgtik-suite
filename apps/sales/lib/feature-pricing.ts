import type {
  FeatureResolvedPrice,
  FeatureZonePrice,
} from "@/types/features";

export type FeatureDisplayPrice = {
  amount: string;
  currencyCode?: string;
};

type FeaturePricingSource = {
  resolvedPrice?:
    | FeatureResolvedPrice
    | FeatureResolvedPrice[]
    | null
    | Array<Pick<FeatureResolvedPrice, "price" | "currencyCode">>;
  zonePrices?: Array<
    Pick<FeatureZonePrice, "basePrice" | "currencyCode">
  > | null;
};

function fromResolved(
  resolved: Pick<FeatureResolvedPrice, "price" | "currencyCode"> | undefined,
): FeatureDisplayPrice | null {
  if (!resolved?.price) return null;
  return {
    amount: resolved.price,
    currencyCode: resolved.currencyCode,
  };
}

function fromZonePrice(
  zonePrice: Pick<FeatureZonePrice, "basePrice" | "currencyCode"> | undefined,
): FeatureDisplayPrice | null {
  if (!zonePrice?.basePrice) return null;
  return {
    amount: zonePrice.basePrice,
    currencyCode: zonePrice.currencyCode,
  };
}

function firstResolved(
  resolved: FeaturePricingSource["resolvedPrice"],
): Pick<FeatureResolvedPrice, "price" | "currencyCode"> | undefined {
  if (!resolved) return undefined;
  return Array.isArray(resolved) ? resolved[0] : resolved;
}

/** Prefer resolvedPrice, then first zonePrices entry — never USD display fields. */
export function getFeatureDisplayPrice(
  feature: FeaturePricingSource,
): FeatureDisplayPrice | null {
  return (
    fromResolved(firstResolved(feature.resolvedPrice)) ??
    fromZonePrice(feature.zonePrices?.[0] ?? undefined)
  );
}

export function getFeatureDisplayAmount(feature: FeaturePricingSource): number {
  const display = getFeatureDisplayPrice(feature);
  if (!display) return 0;
  const parsed = Number.parseFloat(display.amount);
  return Number.isFinite(parsed) ? parsed : 0;
}
