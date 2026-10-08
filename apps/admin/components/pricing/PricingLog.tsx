"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Badge, PageHeader, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { statusOf } from "@/store/api";
import { usePricingLogQuery, type LogEntry } from "@/store/pricing";
import { useUrlState } from "./shared";

const ACTIONS = ["publish", "schedule", "currency", "country", "rate"];

/** ADM-14, the pricing log (R03-P7): every change, who made it, when, how it applies and why. */
export function PricingLog() {
  const t = useTranslations("Pricing.log");
  const tp = useTranslations("Pricing.publish");
  const f = useFormatter();
  const url = useUrlState();
  const page = Math.max(1, Number(url.get("page")) || 1);
  const pageSize = [10].includes(Number(url.get("pageSize"))) ? Number(url.get("pageSize")) : 10;
  const { data, isLoading, isError, error, isFetching, refetch } = usePricingLogQuery({ page, pageSize });

  const columns = useMemo<ColumnDef<LogEntry, any>[]>(
    () => [
      {
        id: "at",
        header: t("when"),
        cell: ({ row }) => <span className="whitespace-nowrap text-fg">{f.date(row.original.at, { dateStyle: "medium", timeStyle: "short" })}</span>,
      },
      { id: "by", header: t("who"), cell: ({ row }) => <bdi dir="auto" className="text-fg">{row.original.byName}</bdi> },
      {
        id: "what",
        header: t("what"),
        meta: { wrap: true },
        cell: ({ row }) => (
          <span className="flex flex-col items-start gap-1">
            <Badge size="sm" tone={row.original.action === "publish" || row.original.action === "schedule" ? "brand" : "neutral"}>
              {ACTIONS.includes(row.original.action) ? t(`actions.${row.original.action}`) : row.original.action}
            </Badge>
            <span dir="auto" className="text-body-sm text-fg-muted">
              {row.original.summary}
            </span>
          </span>
        ),
      },
      {
        id: "mode",
        header: t("applyMode"),
        cell: ({ row }) => (row.original.applyMode ? <span className="text-fg">{tp(`modes.${row.original.applyMode}`)}</span> : <span className="text-fg-subtle">—</span>),
      },
      {
        id: "reason",
        header: t("reason"),
        meta: { wrap: true },
        cell: ({ row }) => (row.original.reason ? <span dir="auto" className="text-fg">{row.original.reason}</span> : <span className="text-fg-subtle">—</span>),
      },
      {
        id: "notified",
        header: t("notified"),
        meta: { numeric: true },
        cell: ({ row }) => (row.original.notified != null ? f.number(row.original.notified) : <span className="text-fg-subtle">—</span>),
      },
      {
        id: "version",
        header: t("version"),
        meta: { numeric: true },
        cell: ({ row }) => (row.original.priceVersion != null ? <span className="tabular-nums">{f.number(row.original.priceVersion)}</span> : <span className="text-fg-subtle">—</span>),
      },
    ],
    [t, tp, f],
  );

  const status = isLoading ? "loading" : isError ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <DataTable
        label={t("title")}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(r) => r.id}
        status={status}
        mode="server"
        rowCount={data?.total ?? 0}
        pagination={{ pageIndex: page - 1, pageSize }}
        onPaginationChange={(up) => {
          const next = typeof up === "function" ? up({ pageIndex: page - 1, pageSize }) : up;
          url.set({ page: next.pageIndex > 0 ? next.pageIndex + 1 : null, pageSize: next.pageSize !== 10 ? next.pageSize : null });
        }}
        onRetry={() => refetch()}
        className={isFetching && !isLoading ? "opacity-70" : undefined}
        empty={{ title: t("empty"), description: t("emptyBody") }}
      />
    </div>
  );
}
