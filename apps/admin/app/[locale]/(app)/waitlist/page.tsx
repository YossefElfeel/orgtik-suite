"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge, PageHeader, Pagination, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { ToolFilter, useLocaleHref, useToolName, ViewOnlyNote } from "@/components/catalog/bits";
import { useCan } from "@/lib/permissions";
import { statusOf } from "@/store/api";
import { useWaitlistQuery, type WaitlistEntry } from "@/store/catalog";

const PAGE_SIZE = 25;

// ADM-29: who is waiting for which tool. Paged by the API; tool and page live in the address.
function WaitlistList() {
  const t = useTranslations("Catalog.waitlist");
  const f = useFormatter();
  const can = useCan();
  const toolName = useToolName();
  const href = useLocaleHref();
  const params = useSearchParams();
  const tool = params.get("tool") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const { data, isLoading, error, refetch, isFetching } = useWaitlistQuery({ tool: tool || undefined, page, pageSize: PAGE_SIZE });
  const locale = useLocale();
  const regions = useMemo(() => new Intl.DisplayNames([locale], { type: "region" }), [locale]);

  const columns = useMemo<ColumnDef<WaitlistEntry, any>[]>(
    () => [
      {
        id: "who",
        header: t("colWho"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col items-start">
            <bdi dir="auto" className="max-w-full truncate font-semibold text-fg">{row.original.name}</bdi>
            <span dir="ltr" className="max-w-full truncate text-caption text-fg-muted">{row.original.email}</span>
          </span>
        ),
      },
      { id: "tool", header: t("colTool"), cell: ({ row }) => <span className="text-fg-muted">{toolName(row.original.tool)}</span> },
      { id: "country", header: t("colCountry"), cell: ({ row }) => <span className="text-fg-muted">{regions.of(row.original.country) ?? row.original.country}</span> },
      { id: "joined", header: t("colJoined"), meta: { numeric: true }, cell: ({ row }) => <span className="text-fg-muted">{f.date(row.original.createdAt, { dateStyle: "medium" })}</span> },
      {
        id: "notified",
        header: t("colNotified"),
        cell: ({ row }) => (
          <Badge size="sm" tone={row.original.notified ? "success" : "neutral"}>
            {row.original.notified ? t("notified") : t("waiting")}
          </Badge>
        ),
      },
    ],
    [t, f, toolName, regions],
  );

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (tool) q.set("tool", tool);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return href(`/waitlist${s ? `?${s}` : ""}`);
  };
  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      {!can("waitlist:edit") ? <ViewOnlyNote /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToolFilter value={tool} label={t("filterTool")} />
        {data ? <p className="text-body-sm text-fg-muted">{t("total", { count: data.total, n: f.number(data.total) })}</p> : null}
      </div>
      <DataTable
        label={tool ? t("titleFor", { name: toolName(tool) }) : t("title")}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(r) => r.id}
        status={status}
        paginate={false}
        onRetry={refetch}
        className={isFetching && !isLoading ? "opacity-70" : undefined}
        empty={{ title: tool ? t("emptyFor") : t("empty"), description: t("emptyBody") }}
      />
      {data && data.total > data.pageSize ? <Pagination page={data.page} pageSize={data.pageSize} total={data.total} hrefFor={pageHref} /> : null}
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <RequirePermission permission="waitlist:view">
      <WaitlistList />
    </RequirePermission>
  );
}
