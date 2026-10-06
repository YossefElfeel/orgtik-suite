"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@orgtik/ui/table";
import { SalesStatus } from "@/components/shared/SalesStatus";
import ProjectPriority from "@/components/pages/projects/ProjectPriority";
import ProjectRowActions from "@/components/pages/projects/ProjectRowActions";
import { Link } from "@/i18n/routing";
import { useDealFormat } from "@/lib/deals/format";
import type { ProjectDetail } from "@/types/projects";

type Options = { showCustomer: boolean; showSalesman: boolean; showPriority: boolean; canDelete: boolean };

export function useProjectColumns({ showCustomer, showSalesman, showPriority, canDelete }: Options) {
  const t = useTranslations("Projects");
  const fmt = useDealFormat();
  return useMemo<ColumnDef<ProjectDetail>[]>(() => {
    const cols: ColumnDef<ProjectDetail>[] = [
      {
        id: "name",
        header: t("colProject"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col">
            <Link
              href={`/projects/${row.original.id}`}
              className="truncate font-semibold text-fg hover:text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus"
            >
              <span dir="auto">{row.original.projectName}</span>
            </Link>
            <bdi dir="ltr" className="text-caption text-fg-muted">
              {row.original.displayId ?? (row.original.referenceNumber ? `#${row.original.referenceNumber}` : "")}
            </bdi>
          </span>
        ),
      },
    ];
    if (showCustomer)
      cols.push({
        id: "customer",
        header: t("colCustomer"),
        meta: { truncate: true },
        cell: ({ row }) => <span dir="auto">{row.original.customer?.fullName ?? row.original.customerName ?? "—"}</span>,
      });
    if (showSalesman)
      cols.push({
        id: "salesman",
        header: t("colSalesman"),
        cell: ({ row }) => <span dir="auto">{row.original.assignedSalesman?.fullName ?? row.original.salesmanName ?? t("unassigned")}</span>,
      });
    cols.push(
      {
        id: "total",
        header: t("colTotal"),
        meta: { numeric: true },
        cell: ({ row }) => {
          const zone = row.original.contractTotalsByZone?.[0];
          return zone ? fmt.money(zone.totalWithVat, zone.currencyCode) : <span className="text-fg-muted">{t("noContract")}</span>;
        },
      },
      {
        id: "status",
        header: t("colStatus"),
        cell: ({ row }) => <SalesStatus kind="project" value={row.original.status} size="sm" />,
      },
      ...(showPriority
        ? [
            {
              id: "priority",
              header: t("colPriority"),
              cell: ({ row }) => <ProjectPriority value={row.original.priority} size="sm" />,
            } satisfies ColumnDef<ProjectDetail>,
          ]
        : []),
      {
        id: "created",
        header: t("colCreated"),
        meta: { numeric: true },
        cell: ({ row }) => fmt.date(row.original.createdAt),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("colActions")}</span>,
        meta: { width: "1%" },
        cell: ({ row }) => <ProjectRowActions project={row.original} canDelete={canDelete} />,
      },
    );
    return cols;
  }, [t, fmt, showCustomer, showSalesman, showPriority, canDelete]);
}
