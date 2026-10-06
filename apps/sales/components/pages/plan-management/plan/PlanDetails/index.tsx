"use client";

import { Icon } from "@iconify/react";
import type { PlanDto } from "@/types/plans";
import MainHeader from "@/components/shared/MainHeader";
import { DeleteDialog } from "@/components/dialogs/shared/DeleteDialog";
import { Button } from "@/components/ui/button";
import { PlanStatusCell } from "@/components/pages/plan-management/plan/PlanStatusCell";
import { SectionCard } from "@/components/shared/SectionCard";
import { PlanManagement } from "@/components/pages/plan-management/plan/PlanManagement";
import { PlanStats } from "./PlanStats";
import { PlanPricing } from "./PlanPricing";
import { PlanFeatures } from "./PlanFeatures";
import { PlanZones } from "./PlanZones";
import { PlanCommission } from "./PlanCommission";
import { useDeletePlanMutation } from "@/redux/features/plans/plansApi";
import { useRouter } from "@/i18n/routing";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useRole } from "@/hooks/useRole";
import { useTranslations } from "next-intl";

type Props = {
  plan: PlanDto;
};

function DeletePlanButton({ plan }: { plan: PlanDto }) {
  const router = useRouter();
  const displayText = useCatalogDisplayText();
  const [deletePlan, { isLoading }] = useDeletePlanMutation();

  const handleDelete = async () => {
    await deletePlan(plan.id).unwrap();
    router.push("/plan-management");
  };

  const tCommon = useTranslations("common");

  return (
    <DeleteDialog
      title={displayText(plan.name)}
      onConfirm={handleDelete}
      trigger={
        <Button
          variant="outline"
          type="button"
          className="border-red/20 text-red hover:bg-red/5 hover:text-red"
          disabled={isLoading}
        >
          <Icon icon="solar:trash-bin-trash-linear" />
          {tCommon("delete")}
        </Button>
      }
    />
  );
}

export function PlanDetails({ plan }: Props) {
  const displayText = useCatalogDisplayText();
  const managerName =
    typeof plan.manager?.displayName === "string"
      ? plan.manager.displayName
      : "—";

   const { isSalesman } = useRole();
   const t = useTranslations("planManagement.details");
   const tCommon = useTranslations("common");

  return (
    <section className="flex flex-col gap-6">
      <MainHeader
        title={displayText(plan.name)}
        backLink={{
          href: "/plan-management",
          label: t("backToPlans"),
        }}
        subChildren={
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-secondary">
            <PlanStatusCell plan={plan} />
            <span>{displayText(plan.department.name)}</span>
            <span aria-hidden>•</span>
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="solar:user-linear" className="size-4" />
              {tCommon("manager", { name: managerName })}
            </span>
          </div>
        }
      >
        {!isSalesman && (
        <div className="flex flex-wrap items-center gap-2">
          <DeletePlanButton plan={plan} />
          <PlanManagement
            planId={plan.id}
            initialPlan={plan}
            trigger={
              <Button type="button">
                <Icon icon="solar:pen-linear" />
                {t("editPlan")}
              </Button>
            }
          />
        </div>
      )}
      </MainHeader>

      <PlanStats plan={plan} />

      <SectionCard title={tCommon("description")}>
        <p className="text-sm leading-6 text-secondary">{displayText(plan.description)}</p>
      </SectionCard>

      <PlanPricing plan={plan} />
      <PlanFeatures plan={plan} />
      <PlanZones plan={plan} />
      <PlanCommission plan={plan} />
    </section>
  );
}
