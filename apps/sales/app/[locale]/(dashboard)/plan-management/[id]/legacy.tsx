"use client";

import { Loader } from "lucide-react";
import { useParams } from "next/navigation";
import MainHeader from "@/components/shared/MainHeader";
import { PlanDetails } from "@/components/pages/plan-management/plan/PlanDetails";
import CustomerPlanDetails from "@/components/pages/plan-management/plan/CustomerPlanDetails";
import { useGetPlanQuery } from "@/redux/features/plans/plansApi";
import { useRole } from "@/hooks/useRole";
import { pickDisplayData } from "@/lib/api-display";
import type { PlanDto } from "@/types/plans";
import { useTranslations } from "next-intl";

export default function PlanDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { isCustomer, isReady } = useRole();
  const { data, isLoading, isError } = useGetPlanQuery(id, { skip: !id });
  const plan: PlanDto | undefined = pickDisplayData(data);
  const t = useTranslations("planManagement.details");

  if (!isReady || isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader className="size-6 animate-spin text-secondary" />
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <section className="flex flex-col gap-6">
        <MainHeader
          title={t("planUnavailable")}
          description={t("planUnavailableDesc")}
          backLink={{
            href: "/plan-management",
            label: t("backToPlans"),
          }}
        />
      </section>
    );
  }

  if (isCustomer) {
    return <CustomerPlanDetails plan={plan} />;
  }

  return <PlanDetails plan={plan} />;
}
