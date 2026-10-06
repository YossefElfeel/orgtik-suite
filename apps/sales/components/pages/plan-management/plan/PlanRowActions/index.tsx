"use client";

import { Icon } from "@iconify/react";
import { Link } from "@/i18n/routing";
import type { PlanListItem } from "@/types/plans";
import { DeleteDialog } from "@/components/dialogs/shared/DeleteDialog";
import { Button } from "@/components/ui/button";
import { PlanManagement } from "@/components/pages/plan-management/plan/PlanManagement";
import { useDeletePlanMutation } from "@/redux/features/plans/plansApi";
import { useRole } from "@/hooks/useRole";
import { useTranslations } from "next-intl";

type Props = {
  plan: PlanListItem;
};

export default function PlanRowActions({ plan }: Props) {
  const { isSalesman } = useRole();
  const [deletePlan, { isLoading: isDeleting }] = useDeletePlanMutation();
  const t = useTranslations("planManagement.actions");
  const tCommon = useTranslations("common");

  const handleDelete = async () => {
    await deletePlan(plan.id).unwrap();
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost-primary"
        size="icon"
        aria-label={t("viewDetails")}
        nativeButton={false}
        render={<Link href={`/plan-management/${plan.id}`} />}
      >
        <Icon icon="solar:eye-linear" />
      </Button>
      {!isSalesman && (
        <>
          <PlanManagement
            planId={plan.id}
            trigger={
              <Button size="icon" aria-label={t("edit")} variant="ghost-edit">
                <Icon icon="solar:pen-new-square-linear" />
              </Button>
            }
          />
          <DeleteDialog
            title={`${tCommon("delete")} ${plan.name}`}
            onConfirm={handleDelete}
            trigger={
              <Button
                variant="destructive"
                size="icon"
                aria-label={t("delete")}
                disabled={isDeleting}
              >
                <Icon icon="solar:trash-bin-trash-linear" />
              </Button>
            }
          />
        </>
      )}
    </div>
  );
}
