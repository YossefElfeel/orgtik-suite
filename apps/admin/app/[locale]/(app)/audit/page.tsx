"use client";

import { Suspense, useMemo } from "react";
import { useTranslations } from "next-intl";
import { LoadingState, PageHeader, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { listStatus, useUrlState } from "@/components/system/kit";
import { useAuditQuery, type AuditEntry } from "@/store/system";

const PAGE_SIZE = 10;
const ACTIONS = ["view_as", "tax_rule", "staff_roles", "settings", "service_assign", "service_review", "service_quote", "service_start", "service_hold", "service_deliver", "service_milestone", "service_message", "service_cancel"];
const SKIP = new Set(["at", "by", "byName", "action", "target", "reason"]);

/** The extra fields an entry carries (a request number, the roles given), read as "key: value". */
const extras = (e: AuditEntry) =>
  Object.entries(e)
    .filter(([k]) => !SKIP.has(k))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");

function Audit() {
  const t = useTranslations("System");
  const f = useFormatter();
  const url = useUrlState();
  const page = Math.max(1, Number(url.get("page")) || 1);
  const { data, isLoading, error, refetch } = useAuditQuery({ page, pageSize: PAGE_SIZE });

  const columns = useMemo<ColumnDef<AuditEntry, unknown>[]>(
    () => [
      { id: "at", header: t("audit.when"), cell: ({ row }) => f.date(row.original.at, { dateStyle: "medium", timeStyle: "short" }) },
      { id: "by", header: t("audit.who"), cell: ({ row }) => <bdi dir="auto">{row.original.byName ?? row.original.by}</bdi> },
      { id: "action", header: t("audit.action"), cell: ({ row }) => (ACTIONS.includes(row.original.action) ? t(`audit.actions.${row.original.action}`) : row.original.action) },
      { id: "target", header: t("audit.target"), cell: ({ row }) => <span dir="ltr">{row.original.target}</span> },
      {
        id: "detail",
        header: t("audit.detail"),
        meta: { wrap: true },
        cell: ({ row }) => {
          const more = extras(row.original);
          return (
            <span className="flex max-w-96 flex-col">
              {row.original.reason ? <span dir="auto">{row.original.reason}</span> : null}
              {more ? (
                <span dir="ltr" className="text-start text-caption text-fg-subtle">
                  {more}
                </span>
              ) : null}
              {!row.original.reason && !more ? <span className="text-fg-subtle">—</span> : null}
            </span>
          );
        },
      },
    ],
    [t, f],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("audit.title")} description={t("audit.description")} />
      <DataTable
        label={t("audit.title")}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(r) => `${r.at}-${r.by}-${r.action}-${r.target}`}
        status={listStatus(isLoading, error)}
        mode="server"
        rowCount={data?.total ?? 0}
        pagination={{ pageIndex: page - 1, pageSize: PAGE_SIZE }}
        onPaginationChange={(u) => {
          const next = typeof u === "function" ? u({ pageIndex: page - 1, pageSize: PAGE_SIZE }) : u;
          url.set({ page: next.pageIndex + 1 === 1 ? null : next.pageIndex + 1 });
        }}
        pageSizes={[PAGE_SIZE]}
        onRetry={refetch}
        empty={{ title: t("audit.empty"), description: t("audit.emptyBody") }}
      />
    </div>
  );
}

export default function AuditPage() {
  return (
    <RequirePermission permission="settings:view">
      <Suspense fallback={<LoadingState />}>
        <Audit />
      </Suspense>
    </RequirePermission>
  );
}
