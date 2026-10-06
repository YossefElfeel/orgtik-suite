"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash, WarningCircle } from "@phosphor-icons/react";
import { Button, DialogBody, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, IconButton, MoneyField, Select, Sheet, SheetContent, toast } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { statusOf } from "@/store/api";
import { useCurrenciesQuery, useGridQuery, useRatesQuery, useUpdateCountryMutation, useZonesQuery, type Country, type Cycle, type Rate } from "@/store/pricing";
import { fieldErrorsOf, useNames, usePlanLabel } from "./shared";

type Row = { id: number; planId: string; cycle: Cycle; amount: number | null };

/** The admin rate from one currency to another as the resolver finds it: direct, inverse, or through USD. */
export function findRate(rates: Rate[], from: string, to: string): number | null {
  if (from === to) return 1;
  const direct = rates.find((r) => r.from === from && r.to === to);
  if (direct) return direct.rate;
  const inverse = rates.find((r) => r.from === to && r.to === from);
  if (inverse) return 1 / inverse.rate;
  if (from !== "USD" && to !== "USD") {
    const a = findRate(rates, from, "USD");
    const b = findRate(rates, "USD", to);
    if (a != null && b != null) return a * b;
  }
  return null;
}

/**
 * ADM-11, one country: its zone, its currency (an override needs an exchange rate from the zone's
 * currency, R03-X2) and its own fixed prices, which win over the zone's (R03-ALG-2).
 */
export function CountrySheet({ country, editable, onClose }: { country: Country; editable: boolean; onClose: () => void }) {
  const t = useTranslations("Pricing.countries");
  const tg = useTranslations("Pricing.grid");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const names = useNames();
  const planLabel = usePlanLabel();
  const zones = useZonesQuery();
  const currencies = useCurrenciesQuery();
  const rates = useRatesQuery();
  const grid = useGridQuery();
  const [update, saving] = useUpdateCountryMutation();
  const [zone, setZone] = useState(country.zone);
  const [currency, setCurrency] = useState(country.currency);
  const [rows, setRows] = useState<Row[]>(() =>
    Object.entries(country.fixed ?? {}).map(([k, amount], i) => {
      const [planId, cycle] = k.split(":");
      return { id: i, planId, cycle: cycle as Cycle, amount };
    }),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string | null>(null);

  const zoneCur = zones.data?.find((z) => z.id === zone)?.currency ?? "";
  const rate = zoneCur && currency !== zoneCur ? findRate(rates.data ?? [], zoneCur, currency) : 1;
  const plans = grid.data?.plans ?? [];
  const planOptions = useMemo(() => plans.map((p) => ({ value: p.id, label: planLabel(p) })), [plans, planLabel]);
  const fmtRate = (r: number) => new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : locale, { maximumFractionDigits: 6 }).format(r);

  const save = () => {
    const e: Record<string, string> = {};
    const seen = new Set<string>();
    rows.forEach((r) => {
      const k = `${r.planId}:${r.cycle}`;
      if (!r.planId) e[`row${r.id}`] = "plan";
      else if (seen.has(k)) e[`row${r.id}`] = "duplicate";
      else if (!(r.amount != null && r.amount > 0)) e[`row${r.id}`] = "amount";
      seen.add(k);
    });
    setErrors(e);
    setFailed(null);
    if (Object.keys(e).length) return;
    const fixed = Object.fromEntries(rows.map((r) => [`${r.planId}:${r.cycle}`, r.amount as number]));
    update({ iso: country.iso, zone, currency, fixed })
      .unwrap()
      .then(() => {
        toast.success(t("saved", { country: names.country(country.iso, country.name) }));
        onClose();
      })
      .catch((err) => {
        const fe = fieldErrorsOf(err);
        if (Object.keys(fe).length) setErrors(fe);
        else setFailed(statusOf(err) === 403 ? tc("forbidden") : tc("saveFailed"));
      });
  };

  const currencyError =
    errors.currency === "no_rate" ? (
      <span>
        {t("errors.no_rate", { from: zoneCur, to: currency })}{" "}
        <Link href={`/pricing/currencies?from=${zoneCur}&to=${currency}`} className="font-semibold underline">
          {t("addRate")}
        </Link>
      </span>
    ) : errors.currency ? (
      tc("required")
    ) : undefined;
  const rowError = (code?: string) => (code === "duplicate" ? t("errors.duplicate") : code === "plan" ? t("errors.plan") : code === "amount" ? t("errors.amount") : undefined);

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <DialogHeader>
          <DialogTitle>
            {names.country(country.iso, country.name)}{" "}
            <span dir="ltr" className="font-mono text-body text-fg-muted">
              {country.iso}
            </span>
          </DialogTitle>
          <DialogDescription>{t("sheetDescription")}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            if (editable) save();
          }}
        >
          <DialogBody className="flex flex-col gap-5">
            <Field label={t("zone")} required error={errors.zone ? tc("required") : undefined} description={t("zoneHint")}>
              <Select
                readOnly={!editable}
                value={zone}
                onValueChange={(v) => v && setZone(v)}
                options={(zones.data ?? []).map((z) => ({ value: z.id, label: z.active ? `${z.name} · ${z.currency}` : t("zoneOff", { zone: z.name }) }))}
              />
            </Field>
            <Field label={t("currency")} required error={currencyError} description={currency === zoneCur ? t("currencySame", { currency: zoneCur }) : t("currencyOverride", { currency: zoneCur })}>
              <Select
                readOnly={!editable}
                value={currency}
                onValueChange={(v) => {
                  if (!v) return;
                  setCurrency(v);
                  setErrors(({ currency: _c, ...rest }) => rest);
                }}
                options={(currencies.data ?? []).filter((c) => c.active || c.code === currency).map((c) => ({ value: c.code, label: `${c.code} · ${names.currency(c.code, c.name)}` }))}
              />
            </Field>
            {currency !== zoneCur && zoneCur ? (
              rate == null ? (
                <p className="flex items-start gap-2 rounded-card border border-line bg-warning-subtle px-3 py-2 text-body-sm text-fg">
                  <WarningCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>
                    {t("noRateYet", { from: zoneCur, to: currency })}{" "}
                    <Link href={`/pricing/currencies?from=${zoneCur}&to=${currency}`} className="font-semibold underline">
                      {t("addRate")}
                    </Link>
                  </span>
                </p>
              ) : (
                <p className="text-body-sm text-fg-muted">
                  {t("rateIs")}{" "}
                  <span dir="ltr" className="tabular-nums text-fg">
                    1 {zoneCur} = {fmtRate(rate)} {currency}
                  </span>
                </p>
              )
            ) : null}

            <fieldset className="flex flex-col gap-3">
              <legend className="text-label text-fg">{t("fixed")}</legend>
              <p className="text-body-sm text-fg-muted">{t("fixedHint")}</p>
              {rows.length ? (
                <ul className="flex flex-col gap-3">
                  {rows.map((r, i) => (
                    <li key={r.id} className="flex flex-col gap-1 rounded-card border border-line p-3">
                      <div className="flex flex-wrap items-end gap-2">
                        <Field label={t("plan")} className="min-w-40 flex-1">
                          <Select readOnly={!editable} value={r.planId || null} placeholder={t("pickPlan")} onValueChange={(v) => setRows((x) => x.map((y) => (y.id === r.id ? { ...y, planId: v ?? "" } : y)))} options={planOptions} />
                        </Field>
                        <Field label={t("cycle")} className="w-32">
                          <Select<Cycle>
                            readOnly={!editable}
                            value={r.cycle}
                            onValueChange={(v) => v && setRows((x) => x.map((y) => (y.id === r.id ? { ...y, cycle: v } : y)))}
                            options={[
                              { value: "monthly", label: tg("monthly") },
                              { value: "yearly", label: tg("yearly") },
                            ]}
                          />
                        </Field>
                        <Field label={t("amount")} className="w-36">
                          <MoneyField currency={currency} readOnly={!editable} value={r.amount} onValueChange={(v) => setRows((x) => x.map((y) => (y.id === r.id ? { ...y, amount: v } : y)))} />
                        </Field>
                        {editable ? <IconButton type="button" variant="ghost" label={t("removeFixed", { n: i + 1 })} icon={<Trash />} onClick={() => setRows((x) => x.filter((y) => y.id !== r.id))} /> : null}
                      </div>
                      {rowError(errors[`row${r.id}`]) ? (
                        <p role="alert" className="text-body-sm text-danger">
                          {rowError(errors[`row${r.id}`])}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-sm text-fg-subtle">{t("noFixed")}</p>
              )}
              {editable ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="self-start"
                  startIcon={<Plus />}
                  onClick={() => setRows((x) => [...x, { id: Math.max(-1, ...x.map((y) => y.id)) + 1, planId: "", cycle: "monthly", amount: null }])}
                >
                  {t("addFixed")}
                </Button>
              ) : null}
            </fieldset>
            {failed ? (
              <p role="alert" className="text-body-sm text-danger">
                {failed}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              {editable ? tc("cancel") : tc("close")}
            </Button>
            {editable ? (
              <Button type="submit" loading={saving.isLoading}>
                {tc("save")}
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
