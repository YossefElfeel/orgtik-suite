"use client";

import PillTabs from "@/components/shared/PillTabs";
import { planFormSteps } from "./constants";
import { useTranslations } from "next-intl";

type Props = {
  currentStep: number;
};

export function PlanFormStepper({ currentStep }: Props) {
  const t = useTranslations("planManagement.form");

  const getStepTranslationKey = (id: string) => {
    switch (id) {
      case "basic": return "stepBasic";
      case "features": return "stepFeatures";
      case "zones": return "stepZones";
      case "commissions": return "stepCommissions";
      default: return id;
    }
  };

  return (
    <PillTabs
      size="sm"
      readOnly
      value={planFormSteps[currentStep]?.id}
      items={planFormSteps.map((step) => ({
        id: step.id,
        label: t(getStepTranslationKey(step.id) as Parameters<typeof t>[0]),
        icon: step.icon,
      }))}
      ariaLabel={t("stepperAriaLabel")}
    />
  );
}
