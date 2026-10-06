"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFormatter } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import { LeadStatus } from "@/components/shared/SalesStatus";
import { ORG_TIME_ZONE } from "@/components/pages/activity-feed/feed";
import type { DashboardCustomerRow } from "@/types/dashboard";

/** The dashboard's short customer list: who, their pipeline stage, their owner and when they came in. */
export function useLatestCustomerColumns({ showOwner }: { showOwner: boolean }): ColumnDef<DashboardCustomerRow>[] {
  const t = useTranslations("SalesHome");
  const f = useFormatter();
  return useMemo<ColumnDef<DashboardCustomerRow>[]>(() => {
    const cols: ColumnDef<DashboardCustomerRow>[] = [
      {
        id: "name",
        header: t("columnCustomer"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col">
            <Link
              href={`/customers/${encodeURIComponent(row.original.id)}`}
              dir="auto"
              className="truncate font-medium text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {row.original.fullName}
            </Link>
            {row.original.companyName ? (
              <span dir="auto" className="truncate text-caption text-fg-muted">
                {row.original.companyName}
              </span>
            ) : null}
          </span>
        ),
      },
      { id: "stage", header: t("columnStage"), cell: ({ row }) => <LeadStatus value={row.original.status} size="sm" /> },
    ];
    if (showOwner) {
      cols.push({
        id: "owner",
        header: t("columnOwner"),
        cell: ({ row }) =>
          row.original.salesName ? (
            <span dir="auto">{row.original.salesName}</span>
          ) : (
            <span className="text-fg-muted">{t("unassigned")}</span>
          ),
      });
    }
    cols.push({
      id: "added",
      header: t("columnAdded"),
      meta: { numeric: true, width: "1%" },
      cell: ({ row }) => (
        <time dateTime={row.original.createdAt} className="text-fg-muted">
          {f.date(row.original.createdAt, { dateStyle: "medium", timeZone: ORG_TIME_ZONE })}
        </time>
      ),
    });
    return cols;
  }, [f, showOwner, t]);
}
