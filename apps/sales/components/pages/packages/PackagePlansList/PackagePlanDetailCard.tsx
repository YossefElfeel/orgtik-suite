"use client";

import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import type { PackageDetailPlan } from "@/types/packages";
import { formatPackageMoney } from "@/lib/packages";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ChevronDownIcon } from "lucide-react";
import PlanFeatureCard from "./PlanFeatureCard";
import { useTranslations } from "next-intl";

type Props = {
  plan: PackageDetailPlan;
};

export default function PackagePlanDetailCard({ plan }: Props) {
  const t = useTranslations("packages");
  const displayText = useCatalogDisplayText();
  // Get primary pricing matrix entry for this plan (assuming the first one or primary zone)
  const zonePricing = plan.pricingMatrix?.[0];
  const priceToDisplay = zonePricing ? Number(zonePricing.baseMonthlyPrice || zonePricing.discountedTotal || zonePricing.undiscountedTotal) : 0;
  const currencyCode = zonePricing ? zonePricing.currencyCode : "USD";

  return (
    <AccordionItem value={plan.id} className="overflow-hidden p-0 px-0 border border-border rounded-xl">
      <AccordionTrigger className="px-5 py-4 hover:bg-muted/30 transition-colors [&>svg[data-slot=accordion-trigger-icon]]:hidden">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <ChevronDownIcon className="size-5 text-foreground transition-transform group-data-open/accordion-trigger:rotate-180" />
            <span className="text-[15px] font-semibold text-foreground">
              {displayText(plan.category?.name) !== "—"
                ? displayText(plan.category?.name)
                : displayText(plan.name)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-left">
            {zonePricing && Number(zonePricing.undiscountedTotal) > priceToDisplay && (
              <span className="text-[15px] font-bold line-through text-muted-foreground decoration-muted-foreground/50 mr-2">
                {formatPackageMoney(currencyCode, Number(zonePricing.undiscountedTotal || 0))}
              </span>
            )}
            <span className="text-[16px] font-bold text-foreground">
              {formatPackageMoney(currencyCode, priceToDisplay)}
            </span>
            <span className="text-[11px] uppercase text-muted-foreground ml-1">{t("base")}</span>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="border-t border-border px-5 py-5 pb-5 pt-5 h-auto">
        <div className="flex flex-col gap-4">
          {plan.description && (
            <p className="text-[13px] leading-relaxed text-muted-foreground mb-0">
              {displayText(plan.description)}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.allFeatures?.map((feature) => (
              <PlanFeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
