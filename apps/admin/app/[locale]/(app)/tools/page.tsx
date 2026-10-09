"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowSquareOut, Plus } from "@phosphor-icons/react";
import { buttonVariants, PageHeader, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { InlineAlert, ToolIcon, ToolStatusBadge, useLocalized, ViewOnlyNote } from "@/components/catalog/bits";
import { ToolStatusAction } from "@/components/catalog/ToolStatusAction";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { statusOf } from "@/store/api";
import { useToolsQuery, type ToolRow } from "@/store/catalog";

// ADM-03: every tool, its release status and what hangs on it (plans, workspaces, waitlist).
function ToolsList() {
  const t = useTranslations("Catalog.tools");
  const f = useFormatter();
  const can = useCan();
  const name = useLocalized();
  const editable = can("tools:edit");
  const [refused, setRefused] = useState<string | null>(null);
  const { data, isLoading, error, refetch, isFetching } = useToolsQuery();

  const columns = useMemo<ColumnDef<ToolRow, any>[]>(
    () => [
      { id: "order", header: t("colOrder"), meta: { numeric: true, width: "1%" }, cell: ({ row }) => <span className="text-fg-muted">{f.number(row.original.order)}</span> },
      {
        id: "tool",
        header: t("colTool"),
        meta: { truncate: true },
        cell: ({ row }) => {
          const x = row.original;
          return (
            <span className="flex min-w-0 items-center gap-3">
              <ToolIcon icon={x.icon} />
              <span className="flex min-w-0 flex-col items-start">
                <span className="flex max-w-full items-center gap-1.5">
                  <Link href={`/tools/${x.key}`} className="truncate font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                    {name(x.name)}
                  </Link>
                  {x.external ? <ArrowSquareOut aria-label={t("external")} className="size-3.5 shrink-0 text-fg-subtle" /> : null}
                </span>
                <span dir="ltr" className="max-w-full truncate font-mono text-caption text-fg-subtle">{x.key}</span>
              </span>
            </span>
          );
        },
      },
      { id: "status", header: t("colStatus"), cell: ({ row }) => <ToolStatusBadge status={row.original.status} /> },
      {
        id: "plans",
        header: t("colPlans"),
        meta: { numeric: true },
        cell: ({ row }) => (
          <Link href={`/plans?tool=${row.original.key}`} className="text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus" aria-label={t("plansOf", { count: row.original.plans, name: name(row.original.name) })}>
            {f.number(row.original.plans)}
          </Link>
        ),
      },
      { id: "workspaces", header: t("colWorkspaces"), meta: { numeric: true }, cell: ({ row }) => <span className="text-fg-muted">{f.number(row.original.workspaces)}</span> },
      {
        id: "waitlist",
        header: t("colWaitlist"),
        meta: { numeric: true },
        cell: ({ row }) =>
          row.original.waitlist && can("waitlist:view") ? (
            <Link href={`/waitlist?tool=${row.original.key}`} className="text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus" aria-label={t("waitlistOf", { count: row.original.waitlist, name: name(row.original.name) })}>
              {f.number(row.original.waitlist)}
            </Link>
          ) : (
            <span className="text-fg-muted">{f.number(row.original.waitlist)}</span>
          ),
      },
      ...(editable
        ? [
            {
              id: "actions",
              header: () => <span className="sr-only">{t("colActions")}</span>,
              meta: { numeric: true },
              cell: ({ row }: { row: { original: ToolRow } }) => <ToolStatusAction tool={row.original} compact onRefused={setRefused} />,
            } as ColumnDef<ToolRow, any>,
          ]
        : []),
    ],
    [t, f, name, can, editable],
  );

  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          editable ? (
            <Link href="/tools/new" className={buttonVariants({ variant: "primary" })}>
              <Plus aria-hidden="true" className="size-4" />
              {t("add")}
            </Link>
          ) : null
        }
      />
      {!editable ? <ViewOnlyNote /> : null}
      {refused ? <InlineAlert>{refused}</InlineAlert> : null}
      <DataTable
        label={t("title")}
        columns={columns}
        data={data ?? []}
        getRowId={(r) => r.key}
        status={status}
        paginate
        onRetry={refetch}
        className={isFetching && !isLoading ? "opacity-70" : undefined}
        empty={{ title: t("empty"), description: editable ? t("emptyBody") : undefined }}
      />
    </div>
  );
}

export default function ToolsPage() {
  return (
    <RequirePermission permission="tools:view">
      <ToolsList />
    </RequirePermission>
  );
}
