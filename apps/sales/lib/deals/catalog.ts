"use client";

import { useMemo } from "react";
import {
  useGetDealDurationsQuery,
  useGetDealFeaturesQuery,
  useGetDealPlansQuery,
  useGetDealVatCountriesQuery,
} from "@/redux/features/projects/dealCatalogApi";
import type { DealCatalogFeature, DealCatalogPlan, DealDuration, DealVatCountry } from "@/types/projects";

export type DealCatalog = {
  plans: DealCatalogPlan[];
  /** Plans sold in the zone of the customer's country. */
  sellable: DealCatalogPlan[];
  planById: Map<string, DealCatalogPlan>;
  features: DealCatalogFeature[];
  featureById: Map<string, DealCatalogFeature>;
  /** Active durations for custom plans (with their discount). */
  durations: DealDuration[];
  /** Active installment terms for custom plans (with their markup). */
  terms: DealDuration[];
  vat: DealVatCountry[];
  /** The zone's currency, from the API's prices. */
  currency: string | null;
  zoneName: string | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

/** Everything the deal builder prices with, from the API, for the customer's country. */
export function useDealCatalog(countryCode: string | null, fallbackCurrency?: string | null): DealCatalog {
  const skip = !countryCode;
  const plans = useGetDealPlansQuery({ countryCode: countryCode ?? "" }, { skip });
  const features = useGetDealFeaturesQuery({ countryCode: countryCode ?? "" }, { skip });
  const durations = useGetDealDurationsQuery("plan");
  const terms = useGetDealDurationsQuery("installment");
  const vat = useGetDealVatCountriesQuery();

  return useMemo(() => {
    const planList = plans.data?.data?.items ?? [];
    const featureList = features.data?.data?.items ?? [];
    const sellable = planList.filter((p) => (p.resolvedPrice?.length ?? 0) > 0);
    const priced = sellable[0]?.resolvedPrice?.[0] ?? null;
    const pricedFeature = featureList.find((f) => f.resolvedPrice)?.resolvedPrice ?? null;
    const queries = [plans, features, durations, terms, vat];
    return {
      plans: planList,
      sellable,
      planById: new Map(planList.map((p) => [p.id, p])),
      features: featureList,
      featureById: new Map(featureList.map((f) => [f.id, f])),
      durations: (durations.data?.data?.items ?? []).filter((d) => d.isActive && d.type === "plan").sort((a, b) => a.months - b.months),
      terms: (terms.data?.data?.items ?? []).filter((d) => d.isActive && d.type === "installment").sort((a, b) => a.months - b.months),
      vat: vat.data?.data ?? [],
      currency: priced?.currencyCode ?? pricedFeature?.currencyCode ?? fallbackCurrency ?? null,
      zoneName: priced?.zoneName ?? pricedFeature?.zoneName ?? null,
      isLoading: queries.some((q) => q.isLoading),
      isError: queries.some((q) => q.isError),
      refetch: () => {
        for (const q of queries) if (q.isError) void q.refetch();
      },
    };
  }, [plans, features, durations, terms, vat, fallbackCurrency]);
}
