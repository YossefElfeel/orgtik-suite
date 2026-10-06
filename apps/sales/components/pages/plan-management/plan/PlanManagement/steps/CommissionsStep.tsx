"use client";

import type { UseFormReturn } from "react-hook-form";
import TextFormEle from "@/components/ui/form/text-form-element";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import type { PlanFormValues } from "@/schemas/plans";
import { planPaymentTypeOptions } from "../constants";
import { useTranslations } from "next-intl";

type Props = {
  form: UseFormReturn<PlanFormValues>;
};

export function CommissionsStep({ form }: Props) {
  const paymentType = form.watch("paymentType");
  const isPercentage = paymentType === "percentage";
  const t = useTranslations("planManagement.form");

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {t("commissionDesc")}
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ComboboxFormEle
          form={form}
          name="paymentType"
          label={t("paymentType")}
          placeholder={t("selectPaymentType")}
          options={planPaymentTypeOptions.map(opt => ({
            value: opt.value,
            label: t(opt.value === "percentage" ? "percentage" : "amount")
          }))}
        />
        <TextFormEle
          form={form}
          name="commissionRate"
          type="number"
          label={isPercentage ? t("ratePercent") : t("rateFixed")}
          placeholder="0"
          allowEmptyNumber
          inputProps={{
            min: 0,
            max: isPercentage ? 100 : undefined,
            step: "any",
          }}
        />
      </div>
    </div>
  );
}
