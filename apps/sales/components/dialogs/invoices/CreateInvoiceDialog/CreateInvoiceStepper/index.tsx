"use client";

import PillTabs from "@/components/shared/PillTabs";
import type { PillTabsActiveTooltip } from "@/types/tabs";
import { useTranslations } from "next-intl";

export const createInvoiceSteps = [
  {
    id: "recipient",
    labelKey: "recipientAndTerms",
    icon: "solar:user-rounded-linear",
  },
  {
    id: "items",
    labelKey: "itemsAndSend",
    icon: "solar:document-add-linear",
  },
] as const;

type Props = {
  currentStep: number;
  onStepChange: (stepIndex: number) => void;
  activeTooltip?: PillTabsActiveTooltip | null;
  onActiveTooltipOpenChange?: (open: boolean) => void;
};

export default function CreateInvoiceStepper({
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
      value={createInvoiceSteps[currentStep]?.id}
      onValueChange={(stepId) => {
        const stepIndex = createInvoiceSteps.findIndex(
          (step) => step.id === stepId,
        );
        if (stepIndex >= 0) {
          onStepChange(stepIndex);
        }
      }}
      items={createInvoiceSteps.map((step) => ({
        id: step.id,
        label: t(step.labelKey),
        icon: step.icon,
      }))}
      ariaLabel={t("createInvoiceStepsLabel")}
      activeTooltip={activeTooltip}
      onActiveTooltipOpenChange={onActiveTooltipOpenChange}
    />
  );
}
