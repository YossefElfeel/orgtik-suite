"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { Badge, Button, Card, ConfirmDialog, ErrorState, LoadingState, NoPermissionState, PageHeader, toast, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { useCan } from "@/lib/permissions";
import { statusOf, useIndexingQuery, useSetVisibilityMutation, type ApiError, type Indexing } from "@/store/api";

type Url = Indexing["sitemap"][number];

function IndexingView() {
  const t = useTranslations("Seo");
  const tt = useTranslations("Types");
  const f = useFormatter();
  const can = useCan();
  const { data, isLoading, error, refetch } = useIndexingQuery();
  const [setVisibility] = useSetVisibilityMutation();
  const columns = useMemo<ColumnDef<Url, any>[]>(
    () => [
      { id: "loc", header: t("colAddress"), meta: { truncate: true }, cell: ({ row }) => <span dir="ltr" className="block truncate text-start font-mono text-body-sm text-fg">{row.original.loc}</span> },
      { id: "type", header: t("colType"), cell: ({ row }) => <span className="text-fg-muted">{tt(`${row.original.type}.one`)}</span> },
      { id: "lastmod", header: t("colLastmod"), meta: { numeric: true }, cell: ({ row }) => <span className="text-fg-muted">{f.date(row.original.lastmod + "T00:00:00", { dateStyle: "medium" })}</span> },
    ],
    [t, tt, f],
  );
  const s = statusOf(error);
  if (isLoading) return <LoadingState rows={5} />;
  if (s === 403) return <NoPermissionState />;
  if (error || !data) return <ErrorState onRetry={refetch} />;
  const hidden = data.settings.visibility === "noindex";
  const next = hidden ? "index" : "noindex";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("indexingTitle")} description={t("indexingDescription")} />
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex items-center gap-2">
              {hidden ? <EyeSlash aria-hidden="true" className="size-5 text-fg-muted" /> : <Eye aria-hidden="true" className="size-5 text-success" />}
              <h2 className="font-display text-title-sm text-fg">{t(hidden ? "hiddenTitle" : "visibleTitle")}</h2>
            </span>
            <p className="text-body-sm text-fg-muted">{t(hidden ? "hiddenBody" : "visibleBody")}</p>
          </div>
          {can("site:visibility") ? (
            <ConfirmDialog
              trigger={<Button variant={hidden ? "primary" : "secondary"}>{t(hidden ? "makeVisible" : "hide")}</Button>}
              tone={hidden ? "primary" : "danger"}
              title={t(hidden ? "makeVisibleTitle" : "hideTitle")}
              impact={t(hidden ? "makeVisibleImpact" : "hideImpact", { count: data.sitemap.length })}
              reason={{ label: t("visibilityReason"), required: true }}
              acknowledgement={hidden ? t("makeVisibleAck") : undefined}
              confirmLabel={t(hidden ? "makeVisible" : "hide")}
              onConfirm={({ reason }) =>
                setVisibility({ version: data.settings.version, visibility: next, reason })
                  .unwrap()
                  .then(() => toast.success(t(hidden ? "nowVisible" : "nowHidden")))
                  .catch((e: ApiError) => {
                    toast.error(e.status === 412 ? t("stale") : t("failed"));
                    throw e;
                  })
              }
            />
          ) : (
            <p className="max-w-xs text-body-sm text-fg-subtle">{t("visibilityPermission")}</p>
          )}
        </div>
        <ol aria-label={t("visibilityHistory")} className="flex flex-col gap-1 border-t border-line pt-3">
          {data.settings.history.map((h, i) => (
            <li key={i} className="text-body-sm text-fg-muted">
              <Badge size="sm" tone={h.visibility === "index" ? "success" : "neutral"}>{t(h.visibility === "index" ? "stateVisible" : "stateHidden")}</Badge>{" "}
              {f.date(h.at, { dateStyle: "medium", timeStyle: "short" })} · <bdi dir="auto">{h.by.name ?? t("imported")}</bdi> · <span dir="auto">{h.note}</span>
            </li>
          ))}
        </ol>
      </Card>

      <section aria-labelledby="sitemap" className="flex flex-col gap-3">
        <h2 id="sitemap" className="font-display text-title-sm text-fg">{t("sitemapTitle", { count: data.sitemap.length })}</h2>
        <p className="text-body-sm text-fg-muted">{t("sitemapNote")}</p>
        <DataTable label={t("sitemapTitle", { count: data.sitemap.length })} columns={columns} data={data.sitemap} getRowId={(r) => r.id} status="ready" paginate={data.sitemap.length > 25} empty={{ title: t("sitemapEmpty") }} />
      </section>

      <section aria-labelledby="robots" className="flex flex-col gap-3">
        <h2 id="robots" dir="ltr" className="text-start font-display text-title-sm text-fg">robots.txt</h2>
        <pre dir="ltr" className="overflow-x-auto rounded-card border border-line bg-sunken p-4 text-start font-mono text-body-sm text-fg">{data.robots}</pre>
      </section>
    </div>
  );
}

export default function IndexingPage() {
  return (
    <RequirePermission permission="seo:view">
      <IndexingView />
    </RequirePermission>
  );
}
