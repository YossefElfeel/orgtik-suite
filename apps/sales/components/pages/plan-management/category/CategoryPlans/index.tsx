"use client";

import type { CategoryPlan } from "@/types/categories";
import { SectionCard } from "@/components/shared/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useTranslations } from "next-intl";

type Props = {
  plans: CategoryPlan[];
};

export default function CategoryPlans({ plans }: Props) {
  const displayText = useCatalogDisplayText();
  const tCat = useTranslations("planManagement.categories");
  const tCommon = useTranslations("common");

  return (
    <SectionCard title={tCat("plansCount", { count: plans.length })}>
      {plans.length === 0 ? (
        <p className="py-6 text-center text-14 text-muted-foreground">
          {tCat("noPlansInCategory")}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border">
          {plans.map((plan) => {
            const planName = displayText(plan.name);

            return (
              <li
                key={plan.id}
                className="flex flex-col gap-3 border-b border-border px-4 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-16 font-semibold text-foreground">
                      {planName}
                    </p>
                    <Badge variant={plan.isActive ? "ghost-green" : "ghost-red"}>
                      {plan.isActive ? tCommon("active") : tCommon("inactive")}
                    </Badge>
                  </div>
                  <p className="text-14 leading-5 text-secondary">
                    {displayText(plan.description)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <p className="text-14 font-medium text-secondary">
                    {tCommon("featuresCount", { count: plan.featureCount })}
                  </p>
                  <Button
                    type="button"
                    variant="ghost-primary"
                    size="icon-sm"
                    aria-label={tCommon("viewDetails")}
                    nativeButton={false}
                    render={<Link href={`/plan-management/${plan.id}`} />}
                    icon="solar:eye-linear"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
