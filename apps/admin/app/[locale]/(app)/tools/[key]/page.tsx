"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Plus } from "@phosphor-icons/react";
import { buttonVariants, ErrorState, LoadingState, PageHeader, Stat, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { InlineAlert, NotFound, ToolIcon, ToolStatusBadge, useLocaleHref, useLocalized, ViewOnlyNote } from "@/components/catalog/bits";
import { PlanStatusBadge } from "@/components/catalog/PlanBits";
import { ToolForm } from "@/components/catalog/ToolForm";
import { ToolStatusAction } from "@/components/catalog/ToolStatusAction";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { statusOf, type Locale } from "@/store/api";
import { useToolQuery, useToolsQuery, type Feature, type Plan, type ToolDetail } from "@/store/catalog";
import { PaginatedTable } from "@orgtik/ui/table";

const LOCALES: Locale[] = ["en", "ar", "de", "fr", "it"];

/** For roles that can only look: the texts in every language, as they are. */
function ToolTexts({ tool }: { tool: ToolDetail }) {
  const t = useTranslations("Catalog.toolForm");
  const tl = useTranslations("Catalog.languages");
  const f = useFormatter();
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="overflow-x-auto rounded-card border border-line">
        <PaginatedTable><table className="w-full text-body-sm">
          <caption className="sr-only">{t("texts")}</caption>
          <thead className="bg-sunken text-fg-muted">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-semibold">{t("language")}</th>
              <th scope="col" className="px-3 py-2 text-start font-semibold">{t("name")}</th>
              <th scope="col" className="px-3 py-2 text-start font-semibold">{t("short")}</th>
            </tr>
          </thead>
          <tbody>
            {LOCALES.map((l) => (
              <tr key={l} className="border-t border-line">
                <th scope="row" className="px-3 py-2 text-start font-normal text-fg-muted">{tl(l)}</th>
                <td lang={l} dir="auto" className="px-3 py-2 text-fg">{tool.name[l] || "—"}</td>
                <td lang={l} dir="auto" className="px-3 py-2 text-fg-muted">{tool.short[l] || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></PaginatedTable>
      </div>
      <p className="text-body-sm text-fg-muted">{t("orderIs", { order: f.number(tool.order) })}</p>
    </div>
  );
}

function ToolPage() {
  const { key } = useParams<{ key: string }>();
  const t = useTranslations("Catalog.toolDetail");
  const tt = useTranslations("Catalog.tools");
  const tf = useTranslations("Catalog.features");
  const tp = useTranslations("Catalog.plans");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const can = useCan();
  const name = useLocalized();
  const href = useLocaleHref();
  const [refused, setRefused] = useState<string | null>(null);
  const { data: tool, isLoading, error, refetch } = useToolQuery(key);
  const row = useToolsQuery().data?.find((x) => x.key === key);
  const editable = can("tools:edit");

  const featureCols = useMemo<ColumnDef<Feature, any>[]>(
    () => [
      { id: "key", header: tf("colKey"), cell: ({ row: r }) => <code dir="ltr" className="font-mono text-body-sm text-fg">{r.original.key}</code> },
      { id: "kind", header: tf("colKind"), cell: ({ row: r }) => <span className="text-fg-muted">{tf(`kind.${r.original.kind}`)}</span> },
      { id: "unit", header: tf("colUnit"), cell: ({ row: r }) => (r.original.unit ? <span dir="ltr" className="text-fg-muted">{r.original.unit}</span> : <span className="text-fg-subtle">—</span>) },
      { id: "enforcement", header: tf("colEnforcement"), cell: ({ row: r }) => <span className="text-fg-muted">{r.original.enforcement ? tf(`enforcement.${r.original.enforcement}`) : "—"}</span> },
    ],
    [tf],
  );
  const planCols = useMemo<ColumnDef<Plan, any>[]>(
    () => [
      {
        id: "name",
        header: tp("colPlan"),
        cell: ({ row: r }) => (
          <Link href={`/plans/${r.original.id}`} className="font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {name(r.original.name)}
          </Link>
        ),
      },
      { id: "tier", header: tp("colTier"), cell: ({ row: r }) => <span className="text-fg-muted">{tp(`tier.${r.original.tier}`)}</span> },
      { id: "status", header: tp("colStatus"), cell: ({ row: r }) => <PlanStatusBadge status={r.original.status} /> },
    ],
    [tp, name],
  );

  if (statusOf(error) === 404) return <NotFound title={t("notFound")} body={t("notFoundBody", { key })} back={t("back")} backHref="/tools" />;
  if (error) return <ErrorState title={tc("loadFailed")} description={tc("loadFailedBody")} onRetry={() => refetch()} />;
  if (isLoading || !tool) return <LoadingState rows={6} label={tc("loading")} />;

  const title = name(tool.name);
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <ToolIcon icon={tool.icon} className="size-10 [&_svg]:size-5" />
            {title}
          </span>
        }
        description={name(tool.short)}
        breadcrumb={[{ label: tt("title"), href: href("/tools") }, { label: title }]}
        status={<ToolStatusBadge status={tool.status} size="md" />}
        actions={editable ? <ToolStatusAction tool={{ ...tool, waitlist: row?.waitlist, workspaces: row?.workspaces }} onRefused={setRefused} /> : null}
      />
      {!editable ? <ViewOnlyNote /> : null}
      {refused ? <InlineAlert>{refused}</InlineAlert> : null}

      <section aria-labelledby="tool-numbers" className="flex flex-col gap-3">
        <h2 id="tool-numbers" className="sr-only">{t("numbers")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label={tt("colPlans")} value={f.number(tool.plans.length)} loading={false} />
          <Stat label={tt("colWorkspaces")} value={row ? f.number(row.workspaces) : "—"} loading={!row} />
          <Stat label={tt("colWaitlist")} value={row ? f.number(row.waitlist) : "—"} loading={!row} />
        </div>
        <p className="text-caption text-fg-subtle">
          {t("keyLabel")} <code dir="ltr" className="font-mono">{tool.key}</code>
        </p>
      </section>

      <section aria-labelledby="tool-details" className="flex flex-col gap-4">
        <h2 id="tool-details" className="font-display text-title-sm text-fg">{t("details")}</h2>
        {editable ? <ToolForm key={tool.key} tool={tool} /> : <ToolTexts tool={tool} />}
      </section>

      <section aria-labelledby="tool-features" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="tool-features" className="font-display text-title-sm text-fg">{tf("title")}</h2>
          {can("plans:view") ? (
            <Link href={`/plans/features?tool=${tool.key}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {t("allFeatures")}
              <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
            </Link>
          ) : null}
        </div>
        <DataTable label={tf("titleFor", { name: title })} columns={featureCols} data={tool.features} getRowId={(r) => r.key} paginate empty={{ title: tf("emptyFor") }} />
      </section>

      <section aria-labelledby="tool-plans" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="tool-plans" className="font-display text-title-sm text-fg">{tp("title")}</h2>
          {can("plans:edit") ? (
            <Link href={`/plans/new?tool=${tool.key}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <Plus aria-hidden="true" className="size-4" />
              {tp("add")}
            </Link>
          ) : null}
        </div>
        <DataTable label={tp("titleFor", { name: title })} columns={planCols} data={tool.plans.filter((p) => !p.service)} getRowId={(r) => r.id} paginate empty={{ title: tp("emptyFor") }} />
      </section>
    </div>
  );
}

export default function ToolDetailPage() {
  return (
    <RequirePermission permission="tools:view">
      <ToolPage />
    </RequirePermission>
  );
}
