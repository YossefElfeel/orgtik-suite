"use client";

import type { PackageDetail } from "@/types/packages";
import { SectionCard } from "@/components/shared/SectionCard";
import { formatPackageMoney } from "@/lib/packages";
import { useTranslations } from "next-intl";

type Props = {
  packageDetail: PackageDetail;
};

export default function PackagePricingSummary({ packageDetail }: Props) {
  const t = useTranslations("packages");

  return (
    <SectionCard title={t("pricingSummary")}>
      <div className="flex flex-col gap-6">
        {packageDetail.pricingSummary?.map((summary, idx) => {
          const bundlePrice = Number(summary.bundlePrice);
          const separateTotal = Number(summary.originalAmount);
          const saved = Math.abs(Number(summary.savingsAmount));
          const savedPercent = Math.abs(Number(summary.savingsPercentage));

          // Assuming negative savingsAmount means no real savings (markup), but we'll show it if there is any difference.
          const isSaving = Number(summary.savingsAmount) < 0 ? false : true; // In the mock JSON savingsAmount is -549.00 for a markup. If it's a real discount, it should be positive or vice versa depending on backend logic. Let's assume positive means savings. Wait, if original = 450 and bundle = 999, savings is 450 - 999 = -549. So negative means markup, positive means savings!

          return (
            <div key={idx} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
                  {t("summaryLabel")} ({summary.currencyCode})
                </span>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 ">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium text-muted-foreground">
                    {t("plansBoughtSeparately", { count: summary.plansBoughtSeparately })}
                  </span>
                  <span className="text-[15px] font-medium text-muted-foreground line-through decoration-muted-foreground/50">
                    {formatPackageMoney(summary.currencyCode, separateTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-foreground">
                    {t("bundlePrice")}
                  </span>
                  <span className="text-base font-bold text-foreground">
                    {formatPackageMoney(summary.currencyCode, bundlePrice)}
                  </span>
                </div>

                {saved > 0 ? (
                  <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-1">
                    <span
                      className={
                        isSaving
                          ? "text-[15px] font-semibold text-green"
                          : "text-[15px] font-semibold text-red"
                      }
                    >
                      {isSaving ? t("saved") : t("markup")}
                    </span>
                    <span
                      className={
                        isSaving
                          ? "text-[15px] font-semibold text-green"
                          : "text-[15px] font-semibold text-red"
                      }
                    >
                      {formatPackageMoney(summary.currencyCode, saved)} (
                      {savedPercent}%)
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
