import type {
  ProjectInstallmentOption,
  ProjectPlanDurationOption,
} from "@/types/projects";

export const projectPlanDurationOptions: ProjectPlanDurationOption[] = [
  { id: "1_month", months: 1, discountPercent: 0 },
  { id: "3_months", months: 3, discountPercent: 5 },
  { id: "6_months", months: 6, discountPercent: 10 },
  { id: "12_months", months: 12, discountPercent: 15 },
];

export const projectInstallmentOptions: ProjectInstallmentOption[] = [
  { id: "3_months", months: 3, label: "Pay over 3M" },
  { id: "6_months", months: 6, label: "Pay over 6M" },
  { id: "12_months", months: 12, label: "Pay over 12M" },
  { id: "18_months", months: 18, label: "Pay over 18M" },
  { id: "24_months", months: 24, label: "Pay over 24M" },
];
