"use client";

import PillTabs from "@/components/shared/PillTabs";
import type { PillTabsActiveTooltip } from "@/types/tabs";
import { useTranslations } from "next-intl";

export const createCustomInvoiceSteps = [
  {
    id: "details",
    labelKey: "customerAndDetails",
    icon: "solar:user-rounded-linear",
  },
  {
    id: "items",
    labelKey: "itemsAndSender",
    icon: "solar:document-add-linear",
  },
] as const;

type Props = {
  currentStep: number;
  onStepChange: (stepIndex: number) => void;
  activeTooltip?: PillTabsActiveTooltip | null;
  onActiveTooltipOpenChange?: (open: boolean) => void;
};

export default function CreateCustomInvoiceStepper({
  currentStep,
  onStepChange,
  activeTooltip,
  onActiveTooltipOpenChange,
}: Props) {
  const t = useTranslations("invoices");

  return (
    <PillTabs
      size="sm"
      variant="primary"
      value={createCustomInvoiceSteps[currentStep]?.id}
      onValueChange={(stepId) => {
        const stepIndex = createCustomInvoiceSteps.findIndex(
          (step) => step.id === stepId,
        );
        if (stepIndex >= 0) {
          onStepChange(stepIndex);
        }
      }}
      items={createCustomInvoiceSteps.map((step) => ({
        id: step.id,
        label: t(step.labelKey),
        icon: step.icon,
      }))}
      ariaLabel={t("customInvoiceStepsLabel")}
      activeTooltip={activeTooltip}
      onActiveTooltipOpenChange={onActiveTooltipOpenChange}
    />
  );
}
