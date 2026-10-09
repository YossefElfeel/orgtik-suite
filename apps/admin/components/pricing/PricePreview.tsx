"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Field, NumberField, PageHeader, SegmentedControl, Select, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { statusOf } from "@/store/api";
import { useCountriesQuery, useGridQuery, usePreviewQuery, useZonesQuery, type Cycle, type PreviewRow } from "@/store/pricing";
import { SourceBadge, useMoney, useNames, usePlanLabel, useUrlState } from "./shared";

/**
 * ADM-13, the price preview: one plan, cycle and seat count, resolved for every country the way
 * checkout will (R03-ALG-1…9), with where each price came from.
 */
export function PricePreview() {
  const t = useTranslations("Pricing.preview");
  const tg = useTranslations("Pricing.grid");
  const tn = useTranslations("Nav");
  const locale = useLocale();
  const money = useMoney();
  const f = useFormatter();
  const names = useNames();
  const planLabel = usePlanLabel();
  const url = useUrlState();
  const grid = useGridQuery();
  const zones = useZonesQuery();
  const countries = useCountriesQuery();
  const plans = grid.data?.plans ?? [];
  const planId = url.get("plan") || plans.find((p) => p.id === "chat_pro")?.id || plans[0]?.id || "";
  const cycle: Cycle = url.get("cycle") === "yearly" ? "yearly" : "monthly";
  const seats = Math.max(1, Number(url.get("seats")) || 1);
  const plan = plans.find((p) => p.id === planId);
  const preview = usePreviewQuery({ planId, cycle, seats }, { skip: !planId });

  const zoneName = (iso: string) => {
    const z = countries.data?.find((c) => c.iso === iso)?.zone;
    return zones.data?.find((x) => x.id === z)?.name ?? z ?? "";
  };
  const columns = useMemo<ColumnDef<PreviewRow, any>[]>(
    () => [
      {
        id: "country",
        header: t("country"),
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <span className="text-fg">{names.country(row.original.country)}</span>
            <span dir="ltr" className="font-mono text-caption text-fg-subtle">
              {row.original.country}
            </span>
          </span>
        ),
      },
      { id: "zone", header: t("zone"), cell: ({ row }) => <bdi dir="auto" className="text-fg-muted">{zoneName(row.original.country)}</bdi> },
      {
        id: "amount",
        header: t("amount"),
        meta: { numeric: true },
        cell: ({ row }) => (
          <span className="flex flex-col items-end">
            <span dir="ltr" className="font-semibold tabular-nums text-fg">
              {money(row.original.amount, row.original.currency)}
            </span>
            {row.original.quantity > 1 ? (
              <span className="text-caption text-fg-muted">
                {t("perSeat", { quantity: row.original.quantity })} <span dir="ltr">{money(row.original.unit, row.original.currency)}</span>
              </span>
            ) : null}
            {row.original.taxDisplay ? <span className="text-caption text-fg-muted">{t(row.original.reverseCharge ? "taxReverseCharge" : row.original.taxRate === 0 ? "taxNone" : row.original.taxDisplay === "inclusive" ? "taxInclusive" : "taxExclusive", { rate: f.percent((row.original.taxRate ?? 0) / 100) })}</span> : null}
          </span>
        ),
      },
      { id: "currency", header: t("currency"), cell: ({ row }) => <span dir="ltr" className="font-mono text-fg-muted">{row.original.currency}</span> },
      { id: "source", header: t("source"), cell: ({ row }) => <SourceBadge source={row.original.source} /> },
    ],
    // zoneName reads the zone and country lists, which the deps below cover.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, names, money, f, zones.data, countries.data],
  );

  const status = grid.isLoading || preview.isLoading ? "loading" : grid.isError || preview.isError ? (statusOf(preview.error ?? grid.error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} breadcrumb={[{ label: tn("grid"), href: `/${locale}/pricing` }, { label: t("title") }]} />
      <div className="flex flex-wrap items-start gap-4">
        <Field label={t("plan")} className="w-full sm:w-64">
          <Select value={planId || null} onValueChange={(v) => v && url.set({ plan: v })} options={plans.map((p) => ({ value: p.id, label: planLabel(p) }))} placeholder={t("pickPlan")} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span aria-hidden="true" className="text-label text-fg">
            {t("cycle")}
          </span>
          <SegmentedControl<Cycle>
            label={t("cycle")}
            value={cycle}
            onValueChange={(v) => url.set({ cycle: v === "monthly" ? null : v })}
            segments={[
              { value: "monthly", label: tg("monthly") },
              { value: "yearly", label: tg("yearly") },
            ]}
          />
        </div>
        <Field label={t("seats")} description={plan?.perUser ? t("seatsHint") : t("seatsFlat")} className="w-40">
          <NumberField value={seats} min={1} max={10000} onValueChange={(v) => url.set({ seats: v && v > 1 ? v : null })} />
        </Field>
      </div>
      <DataTable
        label={t("tableLabel", { plan: plan ? planLabel(plan) : planId })}
        columns={columns}
        data={preview.data?.items ?? []}
        getRowId={(r) => r.country}
        status={status}
        paginate
        onRetry={() => (grid.isError ? grid.refetch() : preview.refetch())}
        empty={{ title: t("empty") }}
        className={preview.isFetching && !preview.isLoading ? "opacity-70" : undefined}
      />
      <p className="text-caption text-fg-muted">{t("note")}</p>
    </div>
  );
}
