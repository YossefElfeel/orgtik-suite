"use client";

import type { PackageDetail } from "@/types/packages";
import PackagePlanDetailCard from "./PackagePlanDetailCard";
import { formatPackageMoney } from "@/lib/packages";
import { Accordion } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Props = {
  packageDetail: PackageDetail;
};

export default function PackagePlansList({ packageDetail }: Props) {
  const t = useTranslations("packages");
  // Use the first pricing summary for the header display
  const primarySummary = packageDetail.pricingSummary?.[0];
  
  let bundlePrice = 0;
  let separateTotal = 0;
  let saved = 0;
  let savedPercent = 0;
  let currencyCode = "USD";
  let isSaving = true;

  if (primarySummary) {
    bundlePrice = Number(primarySummary.bundlePrice);
    separateTotal = Number(primarySummary.originalAmount);
    saved = Math.abs(Number(primarySummary.savingsAmount));
    savedPercent = Math.abs(Number(primarySummary.savingsPercentage));
    currencyCode = primarySummary.currencyCode;
    isSaving = Number(primarySummary.savingsAmount) >= 0;
  }

  return (
    <div className="flex flex-col gap-5 mt-2 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-[17px] font-bold text-foreground">
          {t("plansCount", { count: packageDetail.plans.length })}
        </h2>
        
        {primarySummary && separateTotal > 0 && (
          <div className="flex flex-col sm:items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-bold text-green">
                {formatPackageMoney(currencyCode, bundlePrice)}
              </span>
              <span className="text-[13px] font-semibold text-muted-foreground line-through decoration-muted-foreground/50 mt-0.5">
                {formatPackageMoney(currencyCode, separateTotal)}
              </span>
            </div>
            {saved > 0 && (
              <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5", isSaving ? "bg-green/10 text-green" : "bg-red/10 text-red")}>
                {isSaving ? t("saved") : t("markup")} {formatPackageMoney(currencyCode, saved)} ({savedPercent}%)
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Accordion className="gap-4 flex flex-col">
          {packageDetail.plans.map((plan) => (
            <PackagePlanDetailCard
              key={plan.id}
              plan={plan}
            />
          ))}
        </Accordion>
      </div>
    </div>
  );
}
