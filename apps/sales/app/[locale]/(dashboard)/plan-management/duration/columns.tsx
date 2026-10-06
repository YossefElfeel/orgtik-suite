"use client";

import { ColumnDef } from "@tanstack/react-table";
import DurationActions from "@/components/pages/plan-management/duration/DurationActions";
import DurationActiveSwitch from "@/components/pages/plan-management/duration/DurationActiveSwitch";
import {
  formatDurationLabel,
  formatDurationPercentage,
} from "@/lib/durations";
import type { Duration, DurationKind } from "@/types/durations";

import { useMemo } from "react";
import { useRole } from "@/hooks/useRole";
import { useTranslations } from "next-intl";

export function useDurationColumns(
  kind: DurationKind,
  page: number,
  limit: number,
) {
  const { isSalesman } = useRole();
  const t = useTranslations("planManagement.durations");
  const tCommon = useTranslations("common");
  
  const percentHeader =
    kind === "plan" ? t("columnDiscount") : t("columnDiscount"); // Using columnDiscount for both or wait, interest vs discount

  return useMemo(() => {
    const columns: ColumnDef<Duration>[] = [
    {
      id: "no",
      header: tCommon("no"),
      cell: ({ row }) => (
        <span className="text-secondary">
          {(page - 1) * limit + row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "months",
      header: t("columnMonths"),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {formatDurationLabel(row.original.months, tCommon)}
        </span>
      ),
    },
    {
      accessorKey: "percentage",
      header: percentHeader,
      cell: ({ row }) => (
        <span className="text-secondary">
          {formatDurationPercentage(row.original.percentage)}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: tCommon("active"),
      cell: ({ row }) => <DurationActiveSwitch duration={row.original} />,
    },
    {
      id: "actions",
      header: t("columnActions"),
      cell: ({ row }) => <DurationActions duration={row.original} />,
    },
  ];

  if (isSalesman) {
    return columns.filter(
      (col: any) => col.id !== "actions" && col.accessorKey !== "isActive"
    );
  }

  return columns;
  }, [kind, page, limit, isSalesman]);
}
