import type { IPaginated, PaginationOptions } from "@/types";

export type DurationKind = "plan" | "installment";

export type Duration = {
  id: string;
  type: DurationKind;
  months: number;
  percentage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DurationListItem = {
  id: string;
  name: string;
};

export type DurationUpdateDTO = {
  months: number;
  percentage: string;
  isActive: boolean;
};

export type DurationDTO = DurationUpdateDTO & {
  type: DurationKind;
};

export type DurationTotals = {
  plan: number;
  installment: number;
};

export type DurationsQueryParams = PaginationOptions & {
  type?: DurationKind;
};

export type DurationsPageData = IPaginated<Duration> & {
  totals: DurationTotals;
};

/** @deprecated Prefer `Duration` from the durations API. Kept for mock UIs. */
export type PlanDurationItem = {
  id: string;
  months: number;
  discountPercent: number;
};

/** @deprecated Prefer `Duration` from the durations API. Kept for mock UIs. */
export type InstallmentDurationItem = {
  id: string;
  months: number;
  interestPercent: number;
};

/** @deprecated Prefer `Duration` from the durations API. Kept for mock UIs. */
export type DurationItem = PlanDurationItem | InstallmentDurationItem;
