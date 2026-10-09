"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash, X } from "@phosphor-icons/react";
import { ConfirmDialog, IconButton, PageHeader, toast, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { InlineAlert, PlansTabs, ToolFilter, useLocalized, useToolName, ViewOnlyNote } from "@/components/catalog/bits";
import { FeatureDialog } from "@/components/catalog/FeatureDialog";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { statusOf, type ApiError } from "@/store/api";
import { useDeleteFeatureMutation, useFeaturesQuery, usePlansQuery, type Feature } from "@/store/catalog";

type Refusal = { key: string; plans: string[] };

/** Deletes a feature; the API refuses (409 in_use) while a plan sets it, and says which plans. */
function DeleteFeature({ feature, onRefused }: { feature: Feature; onRefused: (r: Refusal) => void }) {
  const t = useTranslations("Catalog.features");
  const [remove] = useDeleteFeatureMutation();
  return (
    <ConfirmDialog
      trigger={<IconButton size="sm" variant="ghost" label={t("deleteFor", { key: feature.key })} icon={<Trash />} />}
      tone="danger"
      irreversible
      title={t("deleteTitle", { key: feature.key })}
      impact={feature.usedBy ? t("deleteImpactUsed", { count: feature.usedBy }) : t("deleteImpact")}
      confirmLabel={t("delete")}
      onConfirm={() =>
        remove(feature.key)
          .unwrap()
          .then(() => toast.success(t("deleted", { key: feature.key })))
          .catch((e: ApiError) => {
            if (e.status === 409 && e.code === "in_use") {
              onRefused({ key: feature.key, plans: (e.extra?.plans as string[] | undefined) ?? [] });
              return;
            }
            throw e;
          })
      }
    />
  );
}

// ADM-05: the features and limits plans are made of, per tool (?tool=).
function FeaturesList() {
  const t = useTranslations("Catalog.features");
  const tp = useTranslations("Catalog.plans");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const can = useCan();
  const name = useLocalized();
  const toolName = useToolName();
  const tool = useSearchParams().get("tool") ?? "";
  const editable = can("plans:edit");
  const [refused, setRefused] = useState<Refusal | null>(null);
  const { data, isLoading, error, refetch, isFetching } = useFeaturesQuery(tool ? { tool } : undefined);
  const plans = usePlansQuery(undefined, { skip: !refused });

  const columns = useMemo<ColumnDef<Feature, any>[]>(
    () => [
      { id: "key", header: t("colKey"), cell: ({ row }) => <code dir="ltr" className="font-mono text-body-sm text-fg">{row.original.key}</code> },
      { id: "tool", header: t("tool"), cell: ({ row }) => <span className="text-fg-muted">{toolName(row.original.tool)}</span> },
      { id: "kind", header: t("colKind"), cell: ({ row }) => <span className="text-fg-muted">{t(`kind.${row.original.kind}`)}</span> },
      { id: "unit", header: t("colUnit"), cell: ({ row }) => (row.original.unit ? <span dir="ltr" className="text-fg-muted">{row.original.unit}</span> : <span className="text-fg-subtle">—</span>) },
      { id: "enforcement", header: t("colEnforcement"), cell: ({ row }) => <span className="text-fg-muted">{row.original.enforcement ? t(`enforcement.${row.original.enforcement}`) : "—"}</span> },
      { id: "usedBy", header: t("colUsedBy"), meta: { numeric: true }, cell: ({ row }) => <span className="text-fg">{t("plansCount", { count: row.original.usedBy ?? 0, n: f.number(row.original.usedBy ?? 0) })}</span> },
      ...(editable
        ? [
            {
              id: "actions",
              header: () => <span className="sr-only">{t("colActions")}</span>,
              meta: { numeric: true, width: "1%" },
              cell: ({ row }: { row: { original: Feature } }) => <DeleteFeature feature={row.original} onRefused={setRefused} />,
            } as ColumnDef<Feature, any>,
          ]
        : []),
    ],
    [t, f, toolName, editable],
  );

  const planName = (id: string) => name(plans.data?.find((p) => p.id === id)?.name) || id;
  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={tp("areaTitle")} description={t("description")} actions={editable ? <FeatureDialog key={tool} defaultTool={tool || undefined} /> : null} />
      <PlansTabs current="features" tool={tool || undefined} />
      {!editable ? <ViewOnlyNote /> : null}
      {refused ? (
        <InlineAlert action={<IconButton size="sm" variant="ghost" label={tc("close")} icon={<X />} onClick={() => setRefused(null)} />}>
          <p>{t("inUse", { key: refused.key, count: refused.plans.length })}</p>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {refused.plans.map((id) => (
              <li key={id}>
                <Link href={`/plans/${id}`} className="font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-focus">
                  {planName(id)}
                </Link>
              </li>
            ))}
          </ul>
        </InlineAlert>
      ) : null}
      <ToolFilter value={tool} label={t("filterTool")} />
      <DataTable
        label={tool ? t("titleFor", { name: toolName(tool) }) : t("title")}
        columns={columns}
        data={data ?? []}
        getRowId={(r) => r.key}
        status={status}
        paginate
        onRetry={refetch}
        className={isFetching && !isLoading ? "opacity-70" : undefined}
        empty={{ title: tool ? t("emptyFor") : t("empty"), description: editable ? t("emptyBody") : undefined }}
      />
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <RequirePermission permission="plans:view">
      <FeaturesList />
    </RequirePermission>
  );
}
