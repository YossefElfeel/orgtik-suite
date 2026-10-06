"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Card, PageHeader, Tabs, TabsList, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { Link } from "@/i18n/routing";
import { TYPES } from "@/lib/contentTypes";
import { useEntryName } from "@/lib/entryName";
import { statusOf, useSeoHealthQuery, type SeoCheck, type SeoRow } from "@/store/api";

const CHECKS: SeoCheck[] = ["descriptionMissing", "descriptionShort", "descriptionLong", "titleMissing", "titleLong", "titleDuplicate", "noSocialImage", "imageNoAlt"];

// What a search result and a shared link need, page by page: a checklist, not a score.
function Health() {
  const t = useTranslations("Seo");
  const tt = useTranslations("Types");
  const f = useFormatter();
  const entryName = useEntryName();
  const [check, setCheck] = useState<"all" | SeoCheck>("all");
  const { data, isLoading, error, refetch, isFetching } = useSeoHealthQuery({ issue: check === "all" ? undefined : check });
  const counts = data?.counts;

  const columns = useMemo<ColumnDef<SeoRow, any>[]>(
    () => [
      {
        id: "page",
        header: t("colPage"),
        meta: { truncate: true },
        cell: ({ row }) => {
          const r = row.original;
          return (
            <span className="flex min-w-0 flex-col">
              <Link href={`/content/${TYPES[r.type].area}/${r.id}`} dir="auto" className="truncate font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                {entryName(r)}
              </Link>
              <span dir="ltr" className="truncate text-start font-mono text-caption text-fg-subtle">{r.path}</span>
            </span>
          );
        },
      },
      { id: "type", header: t("colType"), cell: ({ row }) => <span className="text-fg-muted">{tt(`${row.original.type}.one`)}</span> },
      { id: "title", header: t("colTitle"), meta: { numeric: true }, cell: ({ row }) => <span className="tabular-nums text-fg-muted">{f.number(row.original.titleLength)}</span> },
      { id: "description", header: t("colDescription"), meta: { numeric: true }, cell: ({ row }) => <span className="tabular-nums text-fg-muted">{f.number(row.original.descriptionLength)}</span> },
      {
        id: "issues",
        header: t("colIssues"),
        cell: ({ row }) =>
          row.original.issues.length ? (
            <span className="flex flex-wrap gap-1">
              {row.original.issues.map((i) => (
                <Badge key={i} size="sm" tone={i.startsWith("description") || i.startsWith("title") ? "warning" : "neutral"}>{t(`checks.${i}`)}</Badge>
              ))}
            </span>
          ) : (
            <Badge size="sm" tone="success">{t("ok")}</Badge>
          ),
      },
    ],
    [t, tt, f, entryName],
  );

  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("healthTitle")} description={t("healthDescription")} />
      {data ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(12rem,100%),1fr))] gap-3">
          <Card padding="sm" className="flex flex-col">
            <span className="text-body-sm text-fg-muted">{t("checked")}</span>
            <span className="font-display text-title text-fg tabular-nums">{f.number(data.checked)}</span>
          </Card>
          <Card padding="sm" className="flex flex-col">
            <span className="text-body-sm text-fg-muted">{t("healthy")}</span>
            <span className="font-display text-title text-fg tabular-nums">{f.number(data.healthy)}</span>
          </Card>
          <Card padding="sm" className="flex flex-col">
            <span className="text-body-sm text-fg-muted">{t("checks.descriptionMissing")}</span>
            <span className="font-display text-title text-fg tabular-nums">{f.number(data.counts.descriptionMissing)}</span>
          </Card>
          <Card padding="sm" className="flex flex-col">
            <span className="text-body-sm text-fg-muted">{t("checks.noSocialImage")}</span>
            <span className="font-display text-title text-fg tabular-nums">{f.number(data.counts.noSocialImage)}</span>
          </Card>
        </div>
      ) : null}
      <Tabs value={check} onValueChange={(v) => setCheck(v as SeoCheck | "all")}>
        <TabsList items={[{ value: "all", label: t("all") }, ...CHECKS.filter((c) => (counts?.[c] ?? 0) > 0 || c === check).map((c) => ({ value: c, label: t(`checks.${c}`), count: counts?.[c] ?? 0 }))]} />
      </Tabs>
      <DataTable
        label={t("healthTitle")}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(r) => `${r.id}-${r.locale}`}
        status={status}
        paginate={(data?.total ?? 0) > 25}
        onRetry={refetch}
        className={isFetching && !isLoading ? "opacity-70" : undefined}
        empty={{ title: t("allGood") }}
      />
    </div>
  );
}

export default function SeoHealthPage() {
  return (
    <RequirePermission permission="seo:view">
      <Health />
    </RequirePermission>
  );
}
