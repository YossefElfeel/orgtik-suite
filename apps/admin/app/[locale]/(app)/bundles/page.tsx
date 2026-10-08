"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PencilSimple, Plus } from "@phosphor-icons/react";
import { Badge, Button, IconButton, PageHeader, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { BundleDialog } from "@/components/commerce/BundleDialog";
import { usePlanNames } from "@/components/commerce/plans";
import { listStatus, useCountryName, usePick } from "@/components/system/kit";
import { useCan } from "@/lib/permissions";
import { useBundlesQuery, type Bundle } from "@/store/commerce";

const EXAMPLE_COUNTRIES = ["SA", "AE", "EG", "DE"] as const;

function Bundles() {
  const t = useTranslations("Commerce");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const pick = usePick();
  const country = useCountryName();
  const can = useCan();
  const editable = can("bundles:edit");
  const { nameOf } = usePlanNames();
  const { data, isLoading, error, refetch } = useBundlesQuery();
  const [editing, setEditing] = useState<Bundle | "new" | null>(null);

  const columns = useMemo<ColumnDef<Bundle, unknown>[]>(
    () => [
      {
        id: "name",
        header: t("bundles.colBundle"),
        meta: { wrap: true },
        cell: ({ row }) => (
          <span className="flex min-w-48 flex-col gap-1.5">
            <span className="inline-flex flex-wrap items-center gap-2">
              <span dir="auto" className="font-medium text-fg">
                {pick(row.original.name)}
              </span>
              <Badge size="sm" tone={row.original.active ? "success" : "neutral"}>
                {row.original.active ? t("bundles.onSale") : t("bundles.off")}
              </Badge>
            </span>
            <span className="flex flex-wrap gap-1">
              {row.original.planIds.map((p) => (
                <Badge key={p} size="sm" emphasis="outline">
                  {nameOf(p)}
                </Badge>
              ))}
            </span>
          </span>
        ),
      },
      { id: "pct", header: t("bundles.discount"), meta: { numeric: true }, cell: ({ row }) => f.percent(row.original.pct / 100) },
      ...EXAMPLE_COUNTRIES.map<ColumnDef<Bundle, unknown>>((iso) => ({
        id: `ex-${iso}`,
        header: country(iso),
        meta: { numeric: true },
        cell: ({ row }) => {
          const ex = row.original.examples?.find((e) => e.country === iso);
          if (!ex?.currency) return <span className="text-fg-subtle">{t("bundles.noPrice")}</span>;
          return (
            <span className="flex flex-col items-end" dir="ltr">
              <span aria-hidden="true" className="text-caption text-fg-subtle line-through">
                {f.money(ex.sum, ex.currency)}
              </span>
              <span className="sr-only">{t("bundles.sumLabel", { amount: f.money(ex.sum, ex.currency) })}</span>
              <span className="font-medium text-fg">{f.money(ex.price, ex.currency)}</span>
            </span>
          );
        },
      })),
      {
        id: "actions",
        header: () => <span className="sr-only">{t("actions")}</span>,
        meta: { numeric: true, width: "1%" },
        cell: ({ row }) => (editable ? <IconButton size="sm" variant="ghost" icon={<PencilSimple />} label={t("bundles.editFor", { name: pick(row.original.name) })} onClick={() => setEditing(row.original)} /> : null),
      },
    ],
    [t, f, pick, country, nameOf, editable],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("bundles.title")}
        description={t("bundles.description")}
        actions={editable ? <Button startIcon={<Plus />} onClick={() => setEditing("new")}>{t("bundles.create")}</Button> : null}
      />
      {!editable ? <p className="text-body-sm text-fg-muted">{tc("viewOnly")}</p> : null}
      <p className="text-body-sm text-fg-muted">{t("bundles.examplesNote")}</p>
      <DataTable
        label={t("bundles.title")}
        columns={columns}
        data={data ?? []}
        getRowId={(r) => r.id}
        status={listStatus(isLoading, error)}
        paginate
        onRetry={refetch}
        empty={{ title: t("bundles.empty"), description: editable ? t("bundles.emptyBody") : undefined }}
      />
      {editing ? <BundleDialog bundle={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

export default function BundlesPage() {
  return (
    <RequirePermission permission="bundles:view">
      <Bundles />
    </RequirePermission>
  );
}
