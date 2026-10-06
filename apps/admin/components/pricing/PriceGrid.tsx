"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle, Eye, PencilSimple, X } from "@phosphor-icons/react";
import { Badge, Button, buttonVariants, ConfirmDialog, Field, EmptyState, ErrorState, IconButton, PageHeader, Select, Skeleton, toast, useFormatter } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { cellKey, useCountriesQuery, useDiscardDraftMutation, useGridQuery, type Cycle, type DraftChange, type GridPlan, type Published } from "@/store/pricing";
import { CellDialog, type CellTarget } from "./CellDialog";
import { PublishDialog } from "./PublishDialog";
import { OverrideBadge, useMoney, useNames, usePlanLabel, useUrlState, ViewOnlyNote } from "./shared";

const CYCLES: Cycle[] = ["monthly", "yearly"];

/**
 * ADM-12, the price grid: a row per paid plan, a column pair (monthly, yearly) per active zone, in
 * the zone's currency. Edits go to one draft; changed cells read "from → to" until published.
 * Countries with their own price show it in the zone's cell, in brand violet (D-045).
 */
export function PriceGrid() {
  const t = useTranslations("Pricing.grid");
  const tp = useTranslations("Pricing");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const can = useCan();
  const editable = can("pricing:edit");
  const money = useMoney();
  const names = useNames();
  const planLabel = usePlanLabel();
  const url = useUrlState();
  const tool = url.get("tool");
  const grid = useGridQuery();
  const countries = useCountriesQuery();
  const [discard] = useDiscardDraftMutation();
  const [editing, setEditing] = useState<CellTarget | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<Published | null>(null);

  const data = grid.data;
  const draft = data?.draft;
  const changes = useMemo(() => new Map<string, DraftChange>((draft?.changes ?? []).map((c) => [c.key, c])), [draft]);
  const tools = useMemo(() => [...new Set((data?.plans ?? []).map((p) => p.tool))], [data]);
  const plans = useMemo(() => (data?.plans ?? []).filter((p) => !tool || p.tool === tool), [data, tool]);
  const zones = data?.zones ?? [];
  const labelOf = (planId: string) => {
    const p = data?.plans.find((x) => x.id === planId);
    return p ? planLabel(p) : planId;
  };
  // Countries with their own price for a plan and cycle, per zone (ADM-11 "price overrides").
  const overrides = (plan: GridPlan, cycle: Cycle, zoneId: string) =>
    (countries.data ?? []).filter((c) => c.zone === zoneId && c.fixed?.[`${plan.id}:${cycle}`] != null).map((c) => ({ iso: c.iso, amount: c.fixed[`${plan.id}:${cycle}`], currency: c.currency }));

  if (grid.isError) return <ErrorState title={tc("loadFailed")} description={tc("loadFailedBody")} onRetry={() => grid.refetch()} />;

  const count = draft?.changes.length ?? 0;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Link href={tool ? `/pricing/preview?plan=${plans[0]?.id ?? ""}` : "/pricing/preview"} className={buttonVariants({ variant: "secondary" })}>
              <Eye aria-hidden="true" className="size-4" />
              {t("preview")}
            </Link>
            {editable && draft && count ? (
              <>
                <ConfirmDialog
                  trigger={<Button variant="secondary">{t("discard")}</Button>}
                  tone="danger"
                  title={t("discardTitle")}
                  impact={t("discardImpact", { count })}
                  confirmLabel={t("discard")}
                  onConfirm={() => discard(draft.id).unwrap().then(() => toast.success(t("discarded")))}
                />
                <Button data-action="publish" onClick={() => setPublishing(true)}>{t("publish", { count })}</Button>
              </>
            ) : null}
          </>
        }
      />

      {!editable ? <ViewOnlyNote /> : null}

      {result ? (
        <div role="status" className="flex items-start gap-3 rounded-card border border-line bg-success-subtle px-4 py-3 text-body-sm text-fg">
          <CheckCircle aria-hidden="true" weight="fill" className="mt-0.5 size-5 shrink-0 text-success" />
          <p className="flex-1">
            {t("publishedNote", { version: result.priceVersion, mode: tp(`publish.modes.${result.applyMode}`) })}{" "}
            {result.applyMode === "new_only" ? t("noNotice") : result.applyMode === "existing_now" ? t("appliedNow") : t("notified", { count: result.notified })}{" "}
            <Link href="/pricing/log" className="font-semibold text-fg-brand underline">
              {t("seeLog")}
            </Link>
          </p>
          <IconButton size="sm" variant="ghost" label={tc("close")} icon={<X />} onClick={() => setResult(null)} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <Field label={t("tool")} className="w-56">
          <Select
            value={tool || "all"}
            onValueChange={(v) => url.set({ tool: v === "all" ? null : v })}
            options={[{ value: "all", label: tc("all") }, ...tools.map((k) => ({ value: k, label: tp.has(`tools.${k}`) ? tp(`tools.${k}` as "tools.chat") : k }))]}
          />
        </Field>
        <ul aria-label={t("legend")} className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-fg-muted">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block size-3 rounded-sm border border-warning bg-warning-subtle" />
            {t("legendDraft")}
          </li>
          <li className="flex items-center gap-1.5">
            <OverrideBadge>{t("legendOverrideBadge")}</OverrideBadge>
            {t("legendOverride")}
          </li>
          <li>{t("legendYearly")}</li>
          {data ? <li>{t("version", { version: data.priceVersion })}</li> : null}
        </ul>
      </div>

      {draft && count ? (
        <p className="flex items-center gap-2 text-body-sm text-fg">
          <Badge size="sm" tone="warning" icon={<PencilSimple />}>
            {t("draftBadge")}
          </Badge>
          {t("draftSummary", { count, date: f.date(draft.createdAt, { dateStyle: "medium", timeStyle: "short" }) })}
        </p>
      ) : null}

      {grid.isLoading ? (
        <div aria-busy="true" aria-label={tc("loading")} className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !plans.length ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyBody")}
          action={
            tool ? (
              <Button size="sm" variant="secondary" onClick={() => url.set({ tool: null })}>
                {t("allTools")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div role="region" aria-labelledby="grid-caption" tabIndex={0} className="relative max-w-full overflow-x-auto rounded-card border border-line bg-raised focus-visible:outline-2 focus-visible:outline-focus">
          <table className="w-full border-collapse text-body-sm">
            <caption id="grid-caption" className="sr-only">
              {t("caption")}
            </caption>
            <thead>
              <tr className="border-b border-line">
                <th rowSpan={2} scope="col" className="sticky start-0 z-10 min-w-44 bg-raised px-4 py-2 text-start text-label text-fg-muted">
                  {t("plan")}
                </th>
                {zones.map((z) => (
                  <th key={z.id} colSpan={2} scope="colgroup" className="border-s border-line px-3 py-2 text-center text-label text-fg">
                    <span className="flex flex-col items-center gap-0.5">
                      <bdi dir="auto">{z.name}</bdi>
                      <span className="flex items-center gap-1 text-caption text-fg-muted">
                        <span dir="ltr">{z.currency}</span>
                        {z.isDefault ? <span>· {t("defaultZone")}</span> : null}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
              <tr className="border-b border-line">
                {zones.map((z) =>
                  CYCLES.map((c) => (
                    <th key={`${z.id}-${c}`} scope="col" className={`px-3 py-1.5 text-end text-caption font-normal text-fg-muted ${c === "monthly" ? "border-s border-line" : ""}`}>
                      {t(c)}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => {
                const label = planLabel(p);
                return (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <th scope="row" className="sticky start-0 z-10 bg-raised px-4 py-2 text-start align-top font-normal">
                      <span className="flex flex-col items-start gap-1">
                        <bdi dir="auto" className="font-semibold text-fg">
                          {label}
                        </bdi>
                        <span className="flex flex-wrap items-center gap-2 text-caption text-fg-muted">
                          {p.perUser ? <span>{t("perUser")}</span> : <span>{t("flat")}</span>}
                          <Link href={`/pricing/preview?plan=${p.id}`} className="inline-flex items-center gap-1 text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                            {t("previewPlan")}
                            <span className="sr-only">: {label}</span>
                            <ArrowRight aria-hidden="true" className="size-3 rtl:-scale-x-100" />
                          </Link>
                        </span>
                      </span>
                    </th>
                    {zones.map((z) =>
                      CYCLES.map((c) => {
                        const key = cellKey(p.id, c, z.id);
                        const change = changes.get(key);
                        const value = p.cells[z.id]?.[c] ?? null;
                        const fallback = z.isDefault && value == null ? p.defaultUsd?.[c] : undefined;
                        const ov = overrides(p, c, z.id);
                        const shown = change ? (
                          <span dir="ltr" className="inline-flex flex-wrap items-baseline justify-end gap-x-1 tabular-nums">
                            <span className="text-fg-muted line-through">{change.from == null ? "—" : money(change.from, z.currency)}</span>
                            <span aria-hidden="true">→</span>
                            <span className="font-semibold text-fg">{change.to == null ? "—" : money(change.to, z.currency)}</span>
                          </span>
                        ) : value != null ? (
                          <span dir="ltr" className="tabular-nums text-fg">
                            {money(value, z.currency)}
                          </span>
                        ) : c === "yearly" ? (
                          <span className="text-caption text-fg-subtle">{t("fromMonthly")}</span>
                        ) : fallback != null ? (
                          <span className="flex flex-col items-end">
                            <span dir="ltr" className="tabular-nums text-fg-muted">
                              {money(fallback, z.currency)}
                            </span>
                            <span className="text-caption text-fg-subtle">{t("planDefault")}</span>
                          </span>
                        ) : (
                          <span className="text-fg-subtle">
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">{t("notSet")}</span>
                          </span>
                        );
                        return (
                          <td key={key} className={`px-2 py-2 text-end align-top ${c === "monthly" ? "border-s border-line" : ""} ${change ? "bg-warning-subtle" : ""}`}>
                            <span className="flex flex-col items-end gap-1">
                              {change ? <span className="sr-only">{t("draftCell")}</span> : null}
                              {editable ? (
                                <button
                                  type="button"
                                  data-cell={key}
                                  onClick={() => setEditing({ plan: p, planLabel: label, zone: z, cycle: c })}
                                  className="min-h-8 rounded-field px-2 py-1 text-end hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus"
                                >
                                  <span className="sr-only">{t("editCell", { plan: label, zone: z.name, cycle: t(c) })}: </span>
                                  {shown}
                                </button>
                              ) : (
                                <span className="px-2 py-1">{shown}</span>
                              )}
                              {ov.map((o) => (
                                <Link key={o.iso} href={`/pricing/zones?country=${o.iso}`} className="rounded-pill focus-visible:outline-2 focus-visible:outline-focus">
                                  <span className="sr-only">{t("overrideLink", { country: names.country(o.iso) })}: </span>
                                  <OverrideBadge>
                                    <span dir="ltr">
                                      {o.iso} {money(o.amount, o.currency)}
                                    </span>
                                  </OverrideBadge>
                                </Link>
                              ))}
                            </span>
                          </td>
                        );
                      }),
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing ? <CellDialog target={editing} change={changes.get(cellKey(editing.plan.id, editing.cycle, editing.zone.id))} onClose={() => setEditing(null)} /> : null}
      {publishing && draft && data ? (
        <PublishDialog
          draft={draft}
          grid={data}
          planLabel={labelOf}
          onClose={() => setPublishing(false)}
          onPublished={(p) => {
            setPublishing(false);
            setResult(p);
            toast.success(t("publishedToast", { version: p.priceVersion }));
          }}
        />
      ) : null}
    </div>
  );
}
