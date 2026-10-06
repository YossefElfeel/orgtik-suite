"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import type { PlanListItem } from "@/types/plans";
import {
  PlanStatusCell,
  resolvePlanStatus,
} from "@/components/pages/plan-management/plan/PlanStatusCell";
import PlanRowActions from "@/components/pages/plan-management/plan/PlanRowActions";
import CurrencyAmount from "@/components/shared/CurrencyAmount";
import {
  getPlanPricingEntries,
  getPrimaryPlanPricing,
} from "@/lib/plan-pricing";

function getInstallmentLabel(plan: PlanListItem) {
  if (plan.paymentMode !== "installment") return null;

  const installment = getPlanPricingEntries(plan)
    .flatMap((entry) => entry.installments)
    .find(Boolean);

  return installment ? `${installment.months}M` : "installment";
}

export function usePlanColumns() {
  const t = useTranslations("planManagement");
  const displayText = useCatalogDisplayText();

  return useMemo(() => {
    const cols: ColumnDef<PlanListItem>[] = [
      {
        accessorKey: "name",
        header: t("columnName"),
        cell: ({ row }) => (
          <p className="max-w-36 truncate font-semibold text-foreground">
            {displayText(row.original.name)}
          </p>
        ),
      },
      {
        id: "category",
        header: t("columnCategory"),
        cell: ({ row }) => (
          <p className="max-w-32 truncate text-secondary">
            {displayText(row.original.category.name)}
          </p>
        ),
      },
      {
        id: "department",
        header: t("columnDepartment"),
        cell: ({ row }) => (
          <p className="max-w-28 truncate text-secondary">
            {displayText(row.original.department.name)}
          </p>
        ),
      },
      {
        accessorKey: "featureCount",
        header: t("columnFeatures"),
        cell: ({ row }) => (
          <span className="text-secondary p-1 bg-muted rounded-full">
            {row.original.featureCount}
          </span>
        ),
      },
      {
        id: "price",
        header: t("columnBasePrice"),
        cell: ({ row }) => {
          const pricing = getPrimaryPlanPricing(row.original);

          return (
            <div className="flex items-center gap-2">
              <span className="text-secondary">
                <CurrencyAmount
                  amount={pricing?.discountedTotal ?? 0}
                  currency={pricing?.currencyCode}
                />
              </span>
              {row.original.zoneCount > 0 ? (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {row.original.zoneCount}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "durations",
        header: t("columnDurations"),
        cell: ({ row }) => (
          <span className="text-secondary">
            {t("optionsCount", { count: row.original.durationCount })}
          </span>
        ),
      },
      {
        id: "installment",
        header: t("columnInstallment"),
        cell: ({ row }) => {
          const value = getInstallmentLabel(row.original);

          if (!value) {
            return <span className="text-muted-foreground">-</span>;
          }

          return (
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 text-xs font-medium text-primary">
              <Icon icon="solar:check-circle-bold" className="size-3.5" />
              {value}
            </span>
          );
        },
      },
      {
        id: "status",
        header: t("columnStatus"),
        cell: ({ row }) => <PlanStatusCell plan={row.original} />,
      },
      {
        id: "actions",
        header: t("columnActions"),
        cell: ({ row }) => <PlanRowActions plan={row.original} />,
      },
    ];

    return cols;
  }, [displayText, t]);
}

export { resolvePlanStatus };
