export function formatPackageMoney(currencyCode: string, amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}

import type { CatalogLocalizedField } from "@/types/localized";

export function formatPackagePlansLabel(planNames: CatalogLocalizedField[] | undefined, displayText: (field: CatalogLocalizedField) => string) {
  if (!planNames || planNames.length === 0) return "-";
  if (planNames.length === 1) return displayText(planNames[0]);
  if (planNames.length === 2) return `${displayText(planNames[0])} & ${displayText(planNames[1])}`;
  return `${displayText(planNames[0])} & ${planNames.length - 1} more`;
}
