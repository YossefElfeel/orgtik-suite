"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { Badge, buttonVariants, PageHeader, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { PlansTabs, ToolFilter, useLocalized, useToolName, ViewOnlyNote } from "@/components/catalog/bits";
import { PlanStatusBadge } from "@/components/catalog/PlanBits";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { statusOf } from "@/store/api";
import { usePlansQuery, type Plan } from "@/store/catalog";

// ADM-06: plans by tool (?tool= in the address), with how many workspaces are on each.
function PlansList() {
  const t = useTranslations("Catalog.plans");
  const f = useFormatter();
  const can = useCan();
  const name = useLocalized();
  const toolName = useToolName();
  const tool = useSearchParams().get("tool") ?? "";
  const editable = can("plans:edit");
  const { data, isLoading, error, refetch, isFetching } = usePlansQuery(tool ? { tool } : undefined);

  const columns = useMemo<ColumnDef<Plan, any>[]>(
    () => [
      {
        id: "plan",
        header: t("colPlan"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col items-start">
            <Link href={`/plans/${row.original.id}`} className="truncate font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
              {name(row.original.name)}
            </Link>
            <span dir="ltr" className="max-w-full truncate font-mono text-caption text-fg-subtle">{row.original.id}</span>
          </span>
        ),
      },
      { id: "tool", header: t("colTool"), cell: ({ row }) => <span className="text-fg-muted">{toolName(row.original.tool)}</span> },
      { id: "tier", header: t("colTier"), cell: ({ row }) => <span className="text-fg-muted">{t(`tier.${row.original.tier}`)}</span> },
      { id: "unit", header: t("colUnit"), cell: ({ row }) => <span className="text-fg-muted">{row.original.perUser ? t("perUser") : t("flat")}</span> },
      {
        id: "price",
        header: t("colPrice"),
        meta: { numeric: true },
        cell: ({ row }) => <span className="text-fg-muted">{row.original.defaultUsd ? f.money(row.original.defaultUsd.monthly, "USD") : "—"}</span>,
      },
      { id: "trial", header: t("colTrial"), meta: { numeric: true }, cell: ({ row }) => <span className="text-fg-muted">{row.original.trialDays ? t("days", { count: row.original.trialDays }) : "—"}</span> },
      {
        id: "visibility",
        header: t("colVisibility"),
        cell: ({ row }) => (
          <Badge size="sm" tone={row.original.visibility === "private" ? "info" : "neutral"}>
            {t(`visibility.${row.original.visibility}`)}
          </Badge>
        ),
      },
      { id: "subscribers", header: t("colSubscribers"), meta: { numeric: true }, cell: ({ row }) => <span className="text-fg">{f.number(row.original.subscribers ?? 0)}</span> },
      { id: "status", header: t("colStatus"), cell: ({ row }) => <PlanStatusBadge status={row.original.status} /> },
    ],
    [t, f, name, toolName],
  );

  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("areaTitle")}
        description={t("description")}
        actions={
          editable ? (
            <Link href={tool ? `/plans/new?tool=${tool}` : "/plans/new"} className={buttonVariants({ variant: "primary" })}>
              <Plus aria-hidden="true" className="size-4" />
              {t("add")}
            </Link>
          ) : null
        }
      />
      <PlansTabs current="plans" tool={tool || undefined} />
      {!editable ? <ViewOnlyNote /> : null}
      <ToolFilter value={tool} label={t("filterTool")} />
      <DataTable
        label={tool ? t("titleFor", { name: toolName(tool) }) : t("title")}
        columns={columns}
        data={data ?? []}
        getRowId={(r) => r.id}
        status={status}
        paginate={(data?.length ?? 0) > 25}
        onRetry={refetch}
        className={isFetching && !isLoading ? "opacity-70" : undefined}
        empty={
          tool
            ? {
                title: t("emptyFor"),
                action: editable ? (
                  <Link href={`/plans/new?tool=${tool}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                    {t("add")}
                  </Link>
                ) : undefined,
              }
            : { title: t("empty") }
        }
      />
    </div>
  );
}

export default function PlansPage() {
  return (
    <RequirePermission permission="plans:view">
      <PlansList />
    </RequirePermission>
  );
}
