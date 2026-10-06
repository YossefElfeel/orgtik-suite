import {
  projectInstallmentOptions,
  projectPlanDurationOptions,
} from "@/mock/project-plans";
import type { PlanDuration, PlanListItem, PlanPricingMatrixItem } from "@/types/plans";
import type {
  ProjectInstallmentOption,
  ProjectPlanDurationOption,
  ProjectPlanPaymentMethod,
} from "@/types/projects";
import { formatAmount } from "@/lib/format-amount";
import { getPlanPricingEntries } from "@/lib/plan-pricing";

const durationShortLabels: Record<PlanDuration, string> = {
  "1_month": "1M",
  "3_months": "3M",
  "6_months": "6M",
  "12_months": "12M",
};

export function formatPlanPrice(value: number, currencyCode: string = "USD") {
  return formatAmount(value, currencyCode);
}

export type ProjectPlanPricing = {
  monthlyPrice: number;
  planTotal: number;
  installmentMonthlyPrice?: number;
  installmentMonths?: number;
};

const MIN_DURATION_MONTHS_FOR_INSTALLMENTS = 3;

const durationMonthsMap: Record<PlanDuration, number> = {
  "1_month": 1,
  "3_months": 3,
  "6_months": 6,
  "12_months": 12,
};

export function getDurationMonths(duration: PlanDuration) {
  return durationMonthsMap[duration];
}

export function getProjectPlanDurationOption(
  duration: PlanDuration,
): ProjectPlanDurationOption | undefined {
  return projectPlanDurationOptions.find((option) => option.id === duration);
}

export function formatProjectPlanDurationLabel(
  duration: PlanDuration,
  discountPercent?: number,
) {
  const option = getProjectPlanDurationOption(duration);
  const months = option?.months ?? getDurationMonths(duration);
  const discount = discountPercent ?? option?.discountPercent ?? 0;
  const label = months === 1 ? "1 Month" : `${months} Months`;

  if (discount > 0) {
    return `${label} · −${discount}%`;
  }

  return label;
}

export function formatDurationSummaryLabel(duration: PlanDuration) {
  const option = getProjectPlanDurationOption(duration);
  const shortLabel = durationShortLabels[duration];
  const discount = option?.discountPercent ?? 0;

  if (discount > 0) {
    return `${shortLabel}  (−${discount}%)`;
  }

  return shortLabel;
}

export function formatInstallmentShortLabel(months: number) {
  return `${months}M`;
}

export function getPaymentSummaryLabel(
  paymentMethod: ProjectPlanPaymentMethod,
) {
  return paymentMethod === "cash" ? "Cash" : "Installment";
}

export function calculateProjectPlanPricing(
  baseMonthlyPrice: number,
  duration: PlanDuration,
  paymentMethod: ProjectPlanPaymentMethod,
  installmentPlanId?: string,
): ProjectPlanPricing {
  const durationOption = getProjectPlanDurationOption(duration);
  const durationMonths = getDurationMonths(duration);
  const discountPercent = durationOption?.discountPercent ?? 0;
  const monthlyPrice = baseMonthlyPrice * (1 - discountPercent / 100);
  const planTotal = monthlyPrice * durationMonths;

  if (paymentMethod !== "installments" || !installmentPlanId) {
    return { monthlyPrice, planTotal };
  }

  const installmentOption = projectInstallmentOptions.find(
    (option) => option.id === installmentPlanId,
  );

  if (!installmentOption) {
    return { monthlyPrice, planTotal };
  }

  return {
    monthlyPrice,
    planTotal,
    installmentMonthlyPrice: planTotal / installmentOption.months,
    installmentMonths: installmentOption.months,
  };
}

export function formatMonthlyPrice(value: number, currencyCode: string = "USD") {
  return `${formatPlanPrice(value, currencyCode)}/mo`;
}

export function formatDurationTotalLabel(duration: PlanDuration) {
  return `${durationShortLabels[duration]} total`;
}

export function getAvailableInstallmentOptions(
  duration: PlanDuration,
  supportsInstallments: boolean,
): ProjectInstallmentOption[] {
  if (!supportsInstallments) {
    return [];
  }

  const durationMonths = getDurationMonths(duration);

  if (durationMonths < MIN_DURATION_MONTHS_FOR_INSTALLMENTS) {
    return [];
  }

  return projectInstallmentOptions.filter(
    (option) => option.months >= durationMonths,
  );
}

export function getSuggestedDurationForInstallments(
  duration: PlanDuration,
): PlanDuration | null {
  if (getDurationMonths(duration) >= MIN_DURATION_MONTHS_FOR_INSTALLMENTS) {
    return null;
  }

  return "3_months";
}

export function formatInstallmentWarningDuration(duration: PlanDuration) {
  return durationShortLabels[duration];
}

export function formatSuggestedDurationLabel(duration: PlanDuration) {
  const option = getProjectPlanDurationOption(duration);
  const months = option?.months ?? getDurationMonths(duration);
  return months === 1 ? "1 M" : `${months} M`;
}

function parsePricingAmount(value?: string | null): number {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

export type PlanDurationOption = {
  durationId: string;
  months: number;
  discountPercentage: string;
};

export type PlanInstallmentOption = {
  durationId: string;
  months: number;
  markupPercentage: string;
  monthlyPayment: string;
};

export function getPlanDurationOptions(plan: PlanListItem): PlanDurationOption[] {
  const seen = new Set<string>();
  const options: PlanDurationOption[] = [];

  for (const entry of getPlanPricingEntries(plan)) {
    const { durationId, months, discountPercentage } = entry.duration;
    if (seen.has(durationId)) {
      continue;
    }

    seen.add(durationId);
    options.push({ durationId, months, discountPercentage });
  }

  return options.sort((a, b) => a.months - b.months);
}

export function getPlanPricingEntry(
  plan: PlanListItem,
  durationId: string,
  zoneId?: string,
): PlanPricingMatrixItem | undefined {
  const entries = getPlanPricingEntries(plan);

  if (zoneId) {
    const matched = entries.find(
      (entry) =>
        entry.duration.durationId === durationId && entry.zoneId === zoneId,
    );
    if (matched) return matched;
  }
  return entries.find((entry) => entry.duration.durationId === durationId);
}

export function getPlanInstallmentOptions(
  plan: PlanListItem,
  durationId: string,
): PlanInstallmentOption[] {
  const entry = getPlanPricingEntry(plan, durationId);
  if (!entry) {
    return [];
  }

  return entry.installments.map((installment) => ({
    durationId: installment.durationId,
    months: installment.months,
    markupPercentage: installment.markupPercentage,
    monthlyPayment: installment.monthlyPayment,
  }));
}

export function formatPlanDurationOptionLabel(
  months: number,
  discountPercentage: string,
) {
  const discount = parsePricingAmount(discountPercentage);
  const label = months === 1 ? "1 Month" : `${months} Months`;

  if (discount > 0) {
    return `${label} · −${discount}%`;
  }

  return label;
}

export function formatPlanInstallmentOptionLabel(months: number) {
  return `Pay over ${months}M`;
}

export function formatPlanDurationShortLabel(months: number) {
  return `${months}M`;
}

export function calculatePlanPricingFromMatrix(
  pricingEntry: PlanPricingMatrixItem,
  paymentMethod: ProjectPlanPaymentMethod,
  installmentDurationId?: string,
): ProjectPlanPricing {
  const monthlyPrice = parsePricingAmount(pricingEntry.effectiveMonthlyPrice);
  const planTotal = parsePricingAmount(pricingEntry.discountedTotal);

  if (paymentMethod !== "installments" || !installmentDurationId) {
    return { monthlyPrice, planTotal };
  }

  const installment = pricingEntry.installments.find(
    (item) => item.durationId === installmentDurationId,
  );

  if (!installment) {
    return { monthlyPrice, planTotal };
  }

  return {
    monthlyPrice,
    planTotal,
    installmentMonthlyPrice: parsePricingAmount(installment.monthlyPayment),
    installmentMonths: installment.months,
  };
}
