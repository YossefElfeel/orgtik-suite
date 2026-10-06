export const planPaymentTypeOptions = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed Amount" },
];

export const planFormSteps = [
  {
    id: "basic",
    label: "Basic Info",
    icon: "solar:info-circle-linear",
  },
  {
    id: "features",
    label: "Features & Durations",
    icon: "solar:clock-circle-linear",
  },
  {
    id: "zones",
    label: "Zone Pricing",
    icon: "solar:global-linear",
  },
  {
    id: "commissions",
    label: "Commissions",
    icon: "solar:dollar-minimalistic-linear",
  },
] as const;
