import type { PlanListItem, PlanPricingMatrixItem } from "@/types/plans";

/** Prefer resolved (country-scoped) prices; fall back to full matrix for admin tooling. */
export function getPlanPricingEntries(
  plan: Pick<PlanListItem, "resolvedPrice" | "pricingMatrix">,
): PlanPricingMatrixItem[] {
  return plan.resolvedPrice ?? plan.pricingMatrix ?? [];
}

export function getPrimaryPlanPricing(
  plan: Pick<PlanListItem, "resolvedPrice" | "pricingMatrix">,
): PlanPricingMatrixItem | undefined {
  return getPlanPricingEntries(plan)[0];
}

/** One pricing row per zone for the primary duration (first matrix entry's months). */
export function getPrimaryDurationZonePricing(
  plan: Pick<PlanListItem, "resolvedPrice" | "pricingMatrix">,
): PlanPricingMatrixItem[] {
  const entries = getPlanPricingEntries(plan);
  const primary = entries[0];
  if (!primary) return [];

  const months = primary.duration.months;
  const byZone = new Map<string, PlanPricingMatrixItem>();

  for (const entry of entries) {
    if (entry.duration.months !== months) continue;
    if (!byZone.has(entry.zoneId)) {
      byZone.set(entry.zoneId, entry);
    }
  }

  return Array.from(byZone.values());
}
