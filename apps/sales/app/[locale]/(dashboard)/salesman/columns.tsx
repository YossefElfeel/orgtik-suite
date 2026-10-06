"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import PerformanceBadge from "@/components/pages/salesman/PerformanceBadge";
import { useTeamFormat } from "@/lib/commissions";
import type { Salesman } from "@/types/salesman";

/** The salespeople list. The API sends the totals in US dollars, so they say so (SAL-086). */
export function useSalesmanColumns(): ColumnDef<Salesman>[] {
  const t = useTranslations("Team.salespeople");
  const f = useTeamFormat();
  return useMemo<ColumnDef<Salesman>[]>(
    () => [
      {
        id: "name",
        header: t("colName"),
        cell: ({ row }) => (
          <Link href={`/salesman/${row.original.id}`} dir="auto" className="font-semibold text-fg rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {row.original.fullName}
          </Link>
        ),
      },
      {
        id: "email",
        header: t("colEmail"),
        meta: { truncate: true },
        cell: ({ row }) => <bdi dir="ltr">{row.original.email}</bdi>,
      },
      {
        id: "phone",
        header: t("colPhone"),
        cell: ({ row }) => (row.original.phoneNumber ? <bdi dir="ltr">{row.original.phoneNumber}</bdi> : "—"),
      },
      {
        id: "deals",
        header: t("colDeals"),
        meta: { numeric: true },
        cell: ({ row }) => f.number(row.original.contractCount ?? 0),
      },
      {
        id: "sales",
        header: t("colSales"),
        meta: { numeric: true },
        cell: ({ row }) => f.money(row.original.totalSalesAmount, "USD"),
      },
      {
        id: "commission",
        header: t("colCommission"),
        meta: { numeric: true },
        cell: ({ row }) => f.money(row.original.totalCommission, "USD"),
      },
      {
        id: "performance",
        header: t("colPerformance"),
        cell: ({ row }) => <PerformanceBadge value={row.original.performance} />,
      },
    ],
    [t, f],
  );
}
