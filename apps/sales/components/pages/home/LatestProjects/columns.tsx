"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFormatter } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import { SalesStatus } from "@/components/shared/SalesStatus";
import { ORG_TIME_ZONE } from "@/components/pages/activity-feed/feed";
import type { DashboardProjectRow } from "@/types/dashboard";

/**
 * The dashboard's short project list: the project, its customer (staff only), its stage, its
 * salesperson (admins and managers) and its due date.
 */
export function useLatestProjectColumns({ showCustomer, showOwner }: { showCustomer: boolean; showOwner: boolean }): ColumnDef<DashboardProjectRow>[] {
  const t = useTranslations("SalesHome");
  const f = useFormatter();
  return useMemo<ColumnDef<DashboardProjectRow>[]>(() => {
    const cols: ColumnDef<DashboardProjectRow>[] = [
      {
        id: "project",
        header: t("columnProject"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col">
            <Link
              href={`/projects/${encodeURIComponent(row.original.id)}`}
              dir="auto"
              className="truncate font-medium text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {row.original.projectName}
            </Link>
            {row.original.displayId ? (
              <bdi dir="ltr" className="text-caption text-fg-muted">
                {row.original.displayId}
              </bdi>
            ) : null}
          </span>
        ),
      },
    ];
    if (showCustomer) {
      cols.push({
        id: "customer",
        header: t("columnCustomer"),
        meta: { truncate: true },
        cell: ({ row }) => <span dir="auto">{row.original.customerName || "—"}</span>,
      });
    }
    cols.push({ id: "stage", header: t("columnStage"), cell: ({ row }) => <SalesStatus kind="project" value={row.original.status} size="sm" /> });
    if (showOwner) {
      cols.push({
        id: "owner",
        header: t("columnOwner"),
        cell: ({ row }) =>
          row.original.salesmanName ? (
            <span dir="auto">{row.original.salesmanName}</span>
          ) : (
            <span className="text-fg-muted">{t("unassigned")}</span>
          ),
      });
    }
    cols.push({
      id: "due",
      header: t("columnDue"),
      meta: { numeric: true, width: "1%" },
      cell: ({ row }) =>
        row.original.dueDate ? (
          <time dateTime={row.original.dueDate} className="text-fg-muted">
            {f.date(row.original.dueDate, { dateStyle: "medium", timeZone: ORG_TIME_ZONE })}
          </time>
        ) : (
          <span className="text-fg-muted">—</span>
        ),
    });
    return cols;
  }, [f, showCustomer, showOwner, t]);
}
