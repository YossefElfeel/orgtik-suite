"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PencilSimple, Plus } from "@phosphor-icons/react";
import { Badge, Button, ConfirmDialog, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, PageHeader, Select, toast } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { useCan } from "@/lib/permissions";
import { statusOf } from "@/store/api";
import { useAddZoneMutation, useCountriesQuery, useCurrenciesQuery, useGridQuery, useUpdateZoneMutation, useZonesQuery, type Country, type Zone } from "@/store/pricing";
import { CountrySheet } from "./CountrySheet";
import { codeOf, fieldErrorsOf, OverrideBadge, useMoney, useNames, usePlanLabel, useUrlState, ViewOnlyNote } from "./shared";

/** Add a zone, or rename one and change its base currency (ADM-10). */
function ZoneDialog({ zone, onClose }: { zone?: Zone; onClose: () => void }) {
  const t = useTranslations("Pricing.zones");
  const tc = useTranslations("Common");
  const names = useNames();
  const currencies = useCurrenciesQuery();
  const [add, adding] = useAddZoneMutation();
  const [update, updating] = useUpdateZoneMutation();
  const [id, setId] = useState(zone?.id ?? "");
  const [name, setName] = useState(zone?.name ?? "");
  const [currency, setCurrency] = useState<string | null>(zone?.currency ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string | null>(null);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!zone && !/^[a-z][a-z0-9_]{1,30}$/.test(id)) e.id = "invalid";
    if (!name.trim()) e.name = "required";
    if (!currency) e.currency = "required";
    setErrors(e);
    setFailed(null);
    if (Object.keys(e).length || !currency) return;
    const call = zone ? update({ id: zone.id, name: name.trim(), currency }) : add({ id, name: name.trim(), currency });
    call
      .unwrap()
      .then(() => {
        toast.success(zone ? tc("saved") : t("added", { zone: name.trim() }));
        onClose();
      })
      .catch((err) => {
        const fe = fieldErrorsOf(err);
        if (Object.keys(fe).length) setErrors(fe);
        else setFailed(statusOf(err) === 403 ? tc("forbidden") : tc("saveFailed"));
      });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{zone ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <DialogBody className="flex flex-col gap-4">
            <Field label={t("name")} required error={errors.name ? tc("required") : undefined}>
              <Input dir="auto" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            {!zone ? (
              <Field label={t("key")} required description={t("keyHint")} error={errors.id ? t("errors.key") : undefined}>
                <Input dir="ltr" value={id} onChange={(e) => setId(e.target.value.toLowerCase())} required className="font-mono" />
              </Field>
            ) : null}
            <Field label={t("currency")} required description={t("currencyHint")} error={errors.currency ? t("errors.currency") : undefined}>
              <Select
                value={currency}
                placeholder={t("pickCurrency")}
                onValueChange={setCurrency}
                options={(currencies.data ?? []).filter((c) => c.active).map((c) => ({ value: c.code, label: `${c.code} · ${names.currency(c.code, c.name)}` }))}
              />
            </Field>
            {zone && currency !== zone.currency ? <p className="text-body-sm text-fg-muted">{t("currencyChange")}</p> : null}
            {failed ? (
              <p role="alert" className="text-body-sm text-danger">
                {failed}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="submit" loading={adding.isLoading || updating.isLoading}>
              {zone ? tc("save") : t("add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Turn a zone off (R03-X5: its countries fall back to Default; its workspaces queue for migration) or back on. */
function ZoneSwitch({ zone }: { zone: Zone }) {
  const t = useTranslations("Pricing.zones");
  const tc = useTranslations("Common");
  const [update, updating] = useUpdateZoneMutation();
  if (zone.isDefault) return <span className="text-caption text-fg-subtle">{t("defaultAlwaysOn")}</span>;
  if (!zone.active)
    return (
      <Button
        size="sm"
        variant="secondary"
        loading={updating.isLoading}
        onClick={() =>
          update({ id: zone.id, active: true })
            .unwrap()
            .then(() => toast.success(t("turnedOn", { zone: zone.name })))
            .catch(() => toast.error(tc("saveFailed")))
        }
      >
        {t("turnOn")}
      </Button>
    );
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" variant="ghost">
          {t("turnOff")}
          <span className="sr-only">: <bdi dir="auto">{zone.name}</bdi></span>
        </Button>
      }
      tone="danger"
      title={t("turnOffTitle", { zone: zone.name })}
      impact={t("turnOffImpact", { count: zone.countries.length })}
      confirmLabel={t("turnOffConfirm")}
      onConfirm={() =>
        update({ id: zone.id, active: false })
          .unwrap()
          .then(() => toast.success(t("turnedOff", { zone: zone.name })))
          .catch((e) => {
            toast.error(codeOf(e) === "default_zone" ? t("errors.default_zone") : statusOf(e) === 403 ? tc("forbidden") : tc("saveFailed"));
            throw e;
          })
      }
    />
  );
}

/** ADM-09/10/11: zones with their currency and countries, and the countries table. */
export function ZonesPage() {
  const t = useTranslations("Pricing.zones");
  const tk = useTranslations("Pricing.countries");
  const tg = useTranslations("Pricing.grid");
  const tc = useTranslations("Common");
  const can = useCan();
  const editable = can("pricing:edit");
  const names = useNames();
  const money = useMoney();
  const planLabel = usePlanLabel();
  const url = useUrlState();
  const zones = useZonesQuery();
  const countries = useCountriesQuery();
  const grid = useGridQuery();
  const [dialog, setDialog] = useState<{ zone?: Zone } | null>(null);
  const zoneFilter = url.get("zone");
  const openIso = url.get("country");
  const open = countries.data?.find((c) => c.iso === openIso);
  const zoneById = useMemo(() => new Map((zones.data ?? []).map((z) => [z.id, z])), [zones.data]);
  const labelOf = (planId: string) => {
    const p = grid.data?.plans.find((x) => x.id === planId);
    return p ? planLabel(p) : planId;
  };

  const zoneColumns = useMemo<ColumnDef<Zone, any>[]>(
    () => [
      {
        id: "zone",
        header: t("zone"),
        cell: ({ row }) => (
          <span className="flex flex-col items-start">
            <bdi dir="auto" className="font-semibold text-fg">
              {row.original.name}
            </bdi>
            <span dir="ltr" className="font-mono text-caption text-fg-subtle">
              {row.original.id}
            </span>
          </span>
        ),
      },
      {
        id: "currency",
        header: t("currency"),
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <span dir="ltr" className="font-mono text-fg">
              {row.original.currency}
            </span>
            <span className="text-caption text-fg-muted">{names.currency(row.original.currency)}</span>
          </span>
        ),
      },
      {
        id: "countries",
        header: t("countries"),
        meta: { wrap: true },
        cell: ({ row }) => (
          <span className="flex flex-col items-start gap-0.5">
            <span className="text-fg">{t("countryCount", { count: row.original.countries.length })}</span>
            {row.original.countries.length ? (
              <span dir="ltr" className="font-mono text-caption text-fg-muted">
                {row.original.countries.join(" · ")}
              </span>
            ) : null}
          </span>
        ),
      },
      {
        id: "status",
        header: t("status"),
        cell: ({ row }) => (
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge size="sm" tone={row.original.active ? "success" : "neutral"}>
              {row.original.active ? t("on") : t("off")}
            </Badge>
            {row.original.isDefault ? (
              <Badge size="sm" tone="info" emphasis="outline">
                {tg("defaultZone")}
              </Badge>
            ) : null}
          </span>
        ),
      },
      ...(editable
        ? [
            {
              id: "actions",
              header: () => <span className="sr-only">{t("actions")}</span>,
              meta: { numeric: true },
              cell: ({ row }: { row: { original: Zone } }) => (
                <span className="inline-flex items-center gap-1">
                  <Button size="sm" variant="ghost" startIcon={<PencilSimple />} onClick={() => setDialog({ zone: row.original })}>
                    {tc("edit")}
                    <span className="sr-only">: <bdi dir="auto">{row.original.name}</bdi></span>
                  </Button>
                  <ZoneSwitch zone={row.original} />
                </span>
              ),
            } as ColumnDef<Zone, any>,
          ]
        : []),
    ],
    [t, tg, tc, names, editable],
  );

  const countryColumns = useMemo<ColumnDef<Country, any>[]>(
    () => [
      {
        id: "country",
        header: tk("country"),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => url.set({ country: row.original.iso })}
            className="flex items-center gap-2 rounded-field text-start hover:underline focus-visible:outline-2 focus-visible:outline-focus"
          >
            <span className="font-semibold text-fg">{names.country(row.original.iso, row.original.name)}</span>
            <span dir="ltr" className="font-mono text-caption text-fg-subtle">
              {row.original.iso}
            </span>
          </button>
        ),
      },
      {
        id: "zone",
        header: tk("zone"),
        cell: ({ row }) => {
          const z = zoneById.get(row.original.zone);
          return (
            <span className="flex items-center gap-1.5">
              <bdi dir="auto" className="text-fg">
                {z?.name ?? row.original.zone}
              </bdi>
              {z && !z.active ? (
                <Badge size="sm" tone="neutral">
                  {t("off")}
                </Badge>
              ) : null}
            </span>
          );
        },
      },
      {
        id: "currency",
        header: tk("currency"),
        cell: ({ row }) => {
          const z = zoneById.get(row.original.zone);
          const override = z && z.currency !== row.original.currency;
          return (
            <span className="flex items-center gap-1.5">
              <span dir="ltr" className="font-mono text-fg">
                {row.original.currency}
              </span>
              {override ? <OverrideBadge>{tk("ownCurrency")}</OverrideBadge> : null}
            </span>
          );
        },
      },
      {
        id: "fixed",
        header: tk("fixed"),
        meta: { wrap: true },
        cell: ({ row }) => {
          const entries = Object.entries(row.original.fixed ?? {});
          if (!entries.length) return <span className="text-fg-subtle">{tk("none")}</span>;
          return (
            <span className="flex flex-wrap gap-1">
              {entries.map(([k, amount]) => {
                const [planId, cycle] = k.split(":");
                return (
                  <OverrideBadge key={k}>
                    <bdi dir="auto">{labelOf(planId)}</bdi> · {tg(cycle as "monthly")} ·{" "}
                    <span dir="ltr">{money(amount, row.original.currency)}</span>
                  </OverrideBadge>
                );
              })}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("actions")}</span>,
        meta: { numeric: true },
        cell: ({ row }) => (
          <Button size="sm" variant="ghost" startIcon={editable ? <PencilSimple /> : undefined} onClick={() => url.set({ country: row.original.iso })}>
            {editable ? tc("edit") : tk("view")}
            <span className="sr-only">: {names.country(row.original.iso, row.original.name)}</span>
          </Button>
        ),
      },
    ],
    // labelOf reads the grid's plans, covered by grid.data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tk, tg, tc, names, money, zoneById, editable, url, grid.data],
  );

  const listStatus = (q: { isLoading: boolean; isError: boolean; error?: unknown }) => (q.isLoading ? "loading" : q.isError ? (statusOf(q.error) === 403 ? "forbidden" : "error") : "ready");
  const shownCountries = (countries.data ?? []).filter((c) => !zoneFilter || c.zone === zoneFilter);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          editable ? (
            <Button startIcon={<Plus />} onClick={() => setDialog({})}>
              {t("add")}
            </Button>
          ) : undefined
        }
      />
      {!editable ? <ViewOnlyNote /> : null}

      <section aria-labelledby="zones-h" className="flex flex-col gap-3">
        <h2 id="zones-h" className="font-display text-title-sm text-fg">
          {t("zonesHeading")}
        </h2>
        <DataTable
          label={t("zonesHeading")}
          columns={zoneColumns}
          data={zones.data ?? []}
          getRowId={(z) => z.id}
          status={listStatus(zones)}
          paginate
          onRetry={() => zones.refetch()}
          empty={{ title: t("empty"), action: editable ? <Button size="sm" onClick={() => setDialog({})}>{t("add")}</Button> : undefined }}
        />
      </section>

      <section aria-labelledby="countries-h" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="countries-h" className="font-display text-title-sm text-fg">
              {tk("heading")}
            </h2>
            <p className="text-body-sm text-fg-muted">{tk("description")}</p>
          </div>
          <Field label={tk("filterZone")} className="w-full sm:w-56">
            <Select
              value={zoneFilter || "all"}
              onValueChange={(v) => url.set({ zone: v === "all" ? null : v })}
              options={[{ value: "all", label: tc("all") }, ...(zones.data ?? []).map((z) => ({ value: z.id, label: <bdi dir="auto">{z.name}</bdi> }))]}
            />
          </Field>
        </div>
        <DataTable
          label={tk("heading")}
          columns={countryColumns}
          data={shownCountries}
          getRowId={(c) => c.iso}
          status={listStatus(countries)}
          paginate
          onRetry={() => countries.refetch()}
          empty={
            zoneFilter
              ? {
                  title: tk("emptyZone"),
                  action: (
                    <Button size="sm" variant="secondary" onClick={() => url.set({ zone: null })}>
                      {tk("allZones")}
                    </Button>
                  ),
                }
              : { title: tk("empty") }
          }
        />
      </section>

      {dialog ? <ZoneDialog zone={dialog.zone} onClose={() => setDialog(null)} /> : null}
      {open ? <CountrySheet key={open.iso} country={open} editable={editable} onClose={() => url.set({ country: null })} /> : null}
    </div>
  );
}
