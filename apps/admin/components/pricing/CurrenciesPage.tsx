"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Info, PencilSimple, Plus } from "@phosphor-icons/react";
import { Badge, Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, NumberField, PageHeader, Select, Switch, toast, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { useCan } from "@/lib/permissions";
import { statusOf } from "@/store/api";
import { useAddCurrencyMutation, useCurrenciesQuery, useRatesQuery, useSetRateMutation, useUpdateCurrencyMutation, type Currency, type Rate, type RoundingMode } from "@/store/pricing";
import { codeOf, fieldErrorsOf, MODES, roundStep, useMoney, useNames, useUrlState, ViewOnlyNote } from "./shared";

const DECIMALS = [0, 2, 3] as const;
const SAMPLE = 44.1234;

/** A currency's settings (ADM-08): decimals, the rounding step and mode for converted prices, on or off. */
function CurrencyDialog({ currency, onClose }: { currency?: Currency; onClose: () => void }) {
  const t = useTranslations("Pricing.currencies");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const [add, adding] = useAddCurrencyMutation();
  const [update, updating] = useUpdateCurrencyMutation();
  const [code, setCode] = useState(currency?.code ?? "");
  const [name, setName] = useState(currency?.name ?? "");
  const [decimals, setDecimals] = useState<number>(currency?.decimals ?? 2);
  const [step, setStep] = useState<number | null>(currency?.step ?? 1);
  const [mode, setMode] = useState<RoundingMode>(currency?.mode ?? "nearest");
  const [active, setActive] = useState(currency?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string | null>(null);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!currency && !/^[A-Z]{3}$/.test(code)) e.code = "invalid";
    if (!currency && !name.trim()) e.name = "required";
    if (!(step != null && step > 0)) e.step = "min";
    setErrors(e);
    setFailed(null);
    if (Object.keys(e).length || step == null) return;
    const call = currency ? update({ code: currency.code, decimals, step, mode, ...(active !== currency.active ? { active } : {}) }) : add({ code, name: name.trim(), decimals, step, mode });
    call
      .unwrap()
      .then(() => {
        toast.success(currency ? tc("saved") : t("added", { code }));
        onClose();
      })
      .catch((err) => {
        const fe = fieldErrorsOf(err);
        if (Object.keys(fe).length) setErrors(fe);
        else if (codeOf(err) === "in_use") setErrors({ active: "in_use" });
        else setFailed(statusOf(err) === 403 ? tc("forbidden") : tc("saveFailed"));
      });
  };
  const sampleCode = (currency?.code ?? code) || "USD";
  const fmt = (n: number) => {
    try {
      return f.number(n, { style: "currency", currency: sampleCode, minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    } catch {
      return f.number(n, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
  };
  const codeError = errors.code === "taken" ? t("errors.taken") : errors.code ? t("errors.code") : undefined;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{currency ? t("editTitle", { code: currency.code }) : t("addTitle")}</DialogTitle>
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
            {!currency ? (
              <>
                <Field label={t("code")} required description={t("codeHint")} error={codeError}>
                  <Input dir="ltr" className="font-mono" maxLength={3} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
                </Field>
                <Field label={t("name")} required error={errors.name ? tc("required") : undefined}>
                  <Input dir="auto" value={name} onChange={(e) => setName(e.target.value)} required />
                </Field>
              </>
            ) : null}
            <Field label={t("decimals")} required description={t("decimalsHint")} error={errors.decimals ? t("errors.decimals") : undefined}>
              <Select value={String(decimals)} onValueChange={(v) => v && setDecimals(Number(v))} options={DECIMALS.map((d) => ({ value: String(d), label: f.number(d) }))} />
            </Field>
            <Field label={t("step")} required description={t("stepHint")} error={errors.step ? t("errors.step") : undefined}>
              <NumberField value={step} onValueChange={setStep} min={0} step={0.01} format={{ maximumFractionDigits: 3 }} />
            </Field>
            <Field label={t("mode")} required error={errors.mode ? tc("required") : undefined}>
              <Select<RoundingMode> value={mode} onValueChange={(v) => v && setMode(v)} options={MODES.map((m) => ({ value: m, label: t(`modes.${m}`) }))} />
            </Field>
            {step && step > 0 ? (
              <p className="flex items-start gap-2 rounded-card bg-sunken px-3 py-2 text-body-sm text-fg-muted">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>
                  {t("example")}{" "}
                  <span dir="ltr" className="tabular-nums text-fg">
                    {f.number(SAMPLE, { maximumFractionDigits: 4 })} → {fmt(roundStep(SAMPLE, { decimals, step, mode }))}
                  </span>
                </span>
              </p>
            ) : null}
            {currency ? (
              <Field error={errors.active ? t("errors.in_use", { code: currency.code }) : undefined} description={currency.inUse ? t("inUseHint", { count: currency.workspaces }) : undefined}>
                <Switch label={t("active")} checked={active} onCheckedChange={(v) => setActive(v)} />
              </Field>
            ) : null}
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
              {currency ? tc("save") : t("add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Sets an admin exchange rate (ADM-15). P6: it changes new purchases only. */
function RateDialog({ initial, currencies, onClose }: { initial: { from?: string; to?: string; rate?: number }; currencies: Currency[]; onClose: () => void }) {
  const t = useTranslations("Pricing.rates");
  const tc = useTranslations("Common");
  const names = useNames();
  const [setRate, saving] = useSetRateMutation();
  const [from, setFrom] = useState<string | null>(initial.from ?? null);
  const [to, setTo] = useState<string | null>(initial.to ?? null);
  const [rate, setRateValue] = useState<number | null>(initial.rate ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string | null>(null);
  const options = currencies.map((c) => ({ value: c.code, label: `${c.code} · ${names.currency(c.code, c.name)}` }));

  const submit = () => {
    const e: Record<string, string> = {};
    if (!from) e.from = "required";
    if (!to) e.to = "required";
    else if (to === from) e.to = "same";
    if (!(rate != null && rate > 0)) e.rate = "min";
    setErrors(e);
    setFailed(null);
    if (Object.keys(e).length || !from || !to || rate == null) return;
    setRate({ from, to, rate })
      .unwrap()
      .then(() => {
        toast.success(t("saved", { from, to }));
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
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
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
            <Field label={t("from")} required error={errors.from ? tc("required") : undefined}>
              <Select value={from} placeholder={t("pick")} onValueChange={setFrom} options={options} />
            </Field>
            <Field label={t("to")} required error={errors.to === "same" ? t("errors.same") : errors.to ? tc("required") : undefined}>
              <Select value={to} placeholder={t("pick")} onValueChange={setTo} options={options} />
            </Field>
            <Field label={t("rate")} required description={from && to ? t("rateHint", { from, to }) : undefined} error={errors.rate ? t("errors.rate") : undefined}>
              <NumberField value={rate} onValueChange={setRateValue} min={0} step={0.000001} steppers={false} format={{ maximumFractionDigits: 6 }} />
            </Field>
            <p className="flex items-start gap-2 rounded-card bg-sunken px-3 py-2 text-body-sm text-fg-muted">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {t("p6")}
            </p>
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
            <Button type="submit" loading={saving.isLoading}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** ADM-08 currencies and ADM-15 exchange rates. */
export function CurrenciesPage() {
  const t = useTranslations("Pricing.currencies");
  const tr = useTranslations("Pricing.rates");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const locale = useLocale();
  const can = useCan();
  const editable = can("pricing:edit");
  const names = useNames();
  const money = useMoney();
  const url = useUrlState();
  const currencies = useCurrenciesQuery();
  const rates = useRatesQuery();
  const [editing, setEditing] = useState<{ currency?: Currency } | null>(null);
  const [rateDialog, setRateDialog] = useState<{ from?: string; to?: string; rate?: number } | null>(null);
  // A link from a country's "no rate" error opens the rate form for that pair (?from=SAR&to=JOD).
  const askedFrom = url.get("from");
  const askedTo = url.get("to");
  const rateOpen = rateDialog ?? (editable && askedFrom && askedTo ? { from: askedFrom, to: askedTo } : null);
  const closeRate = () => {
    setRateDialog(null);
    if (askedFrom || askedTo) url.set({ from: null, to: null });
  };
  const fmtRate = (r: number) => new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : locale, { maximumFractionDigits: 6 }).format(r);

  const currencyColumns = useMemo<ColumnDef<Currency, any>[]>(
    () => [
      {
        id: "code",
        header: t("currency"),
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <span dir="ltr" className="font-mono font-semibold text-fg">
              {row.original.code}
            </span>
            <span className="text-fg-muted">{names.currency(row.original.code, row.original.name)}</span>
          </span>
        ),
      },
      { id: "decimals", header: t("decimals"), meta: { numeric: true }, cell: ({ row }) => f.number(row.original.decimals) },
      {
        id: "rounding",
        header: t("rounding"),
        cell: ({ row }) => (
          <span className="text-fg">
            {t(`modes.${row.original.mode}`)} ·{" "}
            <span dir="ltr" className="tabular-nums">
              {f.number(row.original.step, { maximumFractionDigits: 3 })}
            </span>
          </span>
        ),
      },
      {
        id: "example",
        header: t("exampleCol"),
        meta: { numeric: true },
        cell: ({ row }) => (
          <span dir="ltr" className="tabular-nums text-fg-muted">
            {money(roundStep(SAMPLE, row.original), row.original.code)}
          </span>
        ),
      },
      {
        id: "use",
        header: t("use"),
        cell: ({ row }) => (row.original.inUse ? <span className="text-fg">{t("inUse", { count: row.original.workspaces })}</span> : <span className="text-fg-subtle">{t("notInUse")}</span>),
      },
      {
        id: "active",
        header: t("status"),
        cell: ({ row }) => (
          <Badge size="sm" tone={row.original.active ? "success" : "neutral"}>
            {row.original.active ? t("on") : t("off")}
          </Badge>
        ),
      },
      ...(editable
        ? [
            {
              id: "actions",
              header: () => <span className="sr-only">{t("actions")}</span>,
              meta: { numeric: true },
              cell: ({ row }: { row: { original: Currency } }) => (
                <Button size="sm" variant="ghost" data-edit={row.original.code} startIcon={<PencilSimple />} onClick={() => setEditing({ currency: row.original })}>
                  {tc("edit")}
                  <span className="sr-only">: <span dir="ltr">{row.original.code}</span></span>
                </Button>
              ),
            } as ColumnDef<Currency, any>,
          ]
        : []),
    ],
    [t, tc, f, names, money, editable],
  );

  const rateColumns = useMemo<ColumnDef<Rate, any>[]>(
    () => [
      {
        id: "pair",
        header: tr("pair"),
        cell: ({ row }) => (
          <span dir="ltr" className="font-mono text-fg">
            {row.original.from} → {row.original.to}
          </span>
        ),
      },
      {
        id: "rate",
        header: tr("rate"),
        meta: { numeric: true },
        cell: ({ row }) => (
          <span dir="ltr" className="tabular-nums text-fg">
            1 {row.original.from} = {fmtRate(row.original.rate)} {row.original.to}
          </span>
        ),
      },
      {
        id: "updated",
        header: tr("updated"),
        cell: ({ row }) => <span className="text-fg-muted">{row.original.updatedAt ? f.date(row.original.updatedAt, { dateStyle: "medium", timeStyle: "short" }) : tr("seeded")}</span>,
      },
      ...(editable
        ? [
            {
              id: "actions",
              header: () => <span className="sr-only">{t("actions")}</span>,
              meta: { numeric: true },
              cell: ({ row }: { row: { original: Rate } }) => (
                <Button size="sm" variant="ghost" startIcon={<PencilSimple />} onClick={() => setRateDialog({ from: row.original.from, to: row.original.to, rate: row.original.rate })}>
                  {tc("edit")}
                  <span className="sr-only">
                    : <span dir="ltr">{row.original.from} → {row.original.to}</span>
                  </span>
                </Button>
              ),
            } as ColumnDef<Rate, any>,
          ]
        : []),
    ],
    // fmtRate depends on the locale only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tr, tc, f, editable, locale],
  );

  const listStatus = (q: { isLoading: boolean; isError: boolean; error?: unknown }) => (q.isLoading ? "loading" : q.isError ? (statusOf(q.error) === 403 ? "forbidden" : "error") : "ready");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          editable ? (
            <>
              <Button variant="secondary" startIcon={<Plus />} onClick={() => setRateDialog({})}>
                {tr("add")}
              </Button>
              <Button data-action="add-currency" startIcon={<Plus />} onClick={() => setEditing({})}>
                {t("add")}
              </Button>
            </>
          ) : undefined
        }
      />
      {!editable ? <ViewOnlyNote /> : null}

      <section aria-labelledby="cur-h" className="flex flex-col gap-3">
        <h2 id="cur-h" className="font-display text-title-sm text-fg">
          {t("heading")}
        </h2>
        <DataTable
          label={t("heading")}
          columns={currencyColumns}
          data={currencies.data ?? []}
          getRowId={(c) => c.code}
          status={listStatus(currencies)}
          paginate={false}
          onRetry={() => currencies.refetch()}
          empty={{ title: t("empty") }}
        />
      </section>

      <section aria-labelledby="rates-h" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="rates-h" className="font-display text-title-sm text-fg">
            {tr("heading")}
          </h2>
          <p className="flex items-start gap-2 text-body-sm text-fg-muted">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {tr("p6")}
          </p>
        </div>
        <DataTable
          label={tr("heading")}
          columns={rateColumns}
          data={rates.data ?? []}
          getRowId={(r) => `${r.from}-${r.to}`}
          status={listStatus(rates)}
          paginate={false}
          onRetry={() => rates.refetch()}
          empty={{ title: tr("empty"), action: editable ? <Button size="sm" onClick={() => setRateDialog({})}>{tr("add")}</Button> : undefined }}
        />
      </section>

      {editing ? <CurrencyDialog currency={editing.currency} onClose={() => setEditing(null)} /> : null}
      {rateOpen && currencies.data ? <RateDialog key={`${rateOpen.from}-${rateOpen.to}`} initial={rateOpen} currencies={currencies.data} onClose={closeRate} /> : null}
    </div>
  );
}
