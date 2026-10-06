"use client";

// The loyalty programme's settings (admins). Rates are relative to the base currency the admin
// picks, not fixed to US dollars (SAL-090). Removing a rate is part of the form: nothing is deleted
// on the server, and no other edit is lost, until Save (SAL-088). The expiry needs at least one
// month, as the server does (SAL-168). The base row is text, not an unlabeled input (SAL-116).
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Plus, Trash } from "@phosphor-icons/react";
import { Button, Card, CardHeader, Checkbox, ErrorState, IconButton, LoadingState, NumberField, Select } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useRole } from "@/hooks/useRole";
import { useDeleteLoyaltyRateMutation, useGetLoyaltySettingsQuery, useUpdateLoyaltySettingsMutation } from "@/redux/features/loyalty/loyaltyApi";
import { useGetCurrenciesQuery } from "@/redux/features/management/currenciesApi";
import { loyaltyProgramSchema, type LoyaltyProgramFormValues } from "@/schemas/loyalty";
import type { LoyaltyProgramSettings } from "@/types/loyalty";

const valuesOf = (s: LoyaltyProgramSettings): LoyaltyProgramFormValues => ({
  isActive: s.isActive,
  pointsPerUnit: Number(s.pointsPerUnit) || 1,
  baseCurrency: s.baseCurrency,
  pointsExpireAfterMonths: Math.max(1, s.pointsExpireAfterMonths || 1),
  rates: (s.rates ?? []).filter((r) => r.currencyCode !== s.baseCurrency).map((r) => ({ currencyCode: r.currencyCode, rate: Number(r.rate) })),
});

export default function LoyaltyProgramForm() {
  const t = useTranslations("Team.loyalty");
  const tForm = useTranslations("Team.form");
  const { canEdit } = useRole();
  const settings = useGetLoyaltySettingsQuery();
  const currencies = useGetCurrenciesQuery();
  const [update] = useUpdateLoyaltySettingsMutation();
  const [deleteRate] = useDeleteLoyaltyRateMutation();
  const [saving, setSaving] = useState(false);
  const [toAdd, setToAdd] = useState<string | null>(null);
  const schema = useMemo(() => loyaltyProgramSchema(tForm), [tForm]);
  const form = useForm<LoyaltyProgramFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true, pointsPerUnit: 1, baseCurrency: "USD", pointsExpireAfterMonths: 12, rates: [] },
  });
  const rates = useFieldArray({ control: form.control, name: "rates" });
  const data = settings.data?.data;

  useEffect(() => {
    if (data) form.reset(valuesOf(data));
  }, [data, form]);

  if (settings.isLoading) return <LoadingState rows={4} label={t("programTitle")} />;
  if (settings.isError || !data) {
    return <ErrorState title={t("programErrorTitle")} description={t("errorBody")} onRetry={() => void settings.refetch()} />;
  }

  const base = form.watch("baseCurrency");
  const used = new Set([base, ...form.watch("rates").map((r) => r.currencyCode)]);
  const known = currencies.data?.data ?? [];
  const nameOf = (code: string) => known.find((c) => c.code === code)?.name ?? data.rates.find((r) => r.currencyCode === code)?.currencyName ?? code;
  const currencyOptions = (known.length ? known.map((c) => c.code) : data.rates.map((r) => r.currencyCode)).map((code) => ({ value: code, label: `${code} · ${nameOf(code)}` }));
  const addable = currencyOptions.filter((o) => !used.has(o.value));

  const save = form.handleSubmit(async (v) => {
    setSaving(true);
    try {
      const rows = v.rates.filter((r) => r.currencyCode !== v.baseCurrency);
      await update({
        isActive: v.isActive,
        pointsPerUnit: String(v.pointsPerUnit),
        baseCurrency: v.baseCurrency,
        pointsExpireAfterMonths: v.pointsExpireAfterMonths,
        rates: rows.map((r) => ({ currencyCode: r.currencyCode, rate: String(r.rate) })),
      }).unwrap();
      // Rates removed in the form go only now, after the rest is saved.
      const kept = new Set([v.baseCurrency, ...rows.map((r) => r.currencyCode)]);
      for (const r of data.rates) if (!kept.has(r.currencyCode)) await deleteRate(r.currencyCode).unwrap();
    } catch {
      // The request's toast says why; the form keeps the edits.
    } finally {
      setSaving(false);
    }
  });

  return (
    <Card className="flex flex-col gap-6">
      <CardHeader title={t("programTitle")} description={t("programHint")} />
      <form onSubmit={save} noValidate>
        <fieldset disabled={!canEdit} className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0">
          <RHFField
            control={form.control}
            name="isActive"
            render={(field) => (
              <Checkbox
                name={field.name}
                checked={Boolean(field.value)}
                onCheckedChange={(v) => field.onChange(Boolean(v))}
                label={t("programActive")}
                description={t("programActiveHint")}
              />
            )}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <RHFField
              control={form.control}
              name="pointsPerUnit"
              label={t("pointsPerUnit", { currency: base })}
              description={t("pointsPerUnitHint")}
              required
              render={(field) => (
                <NumberField
                  name={field.name}
                  value={field.value ?? null}
                  onValueChange={(v) => field.onChange(v ?? undefined)}
                  min={0}
                  step={0.5}
                  format={{ maximumFractionDigits: 2 }}
                />
              )}
            />
            <RHFField
              control={form.control}
              name="baseCurrency"
              label={t("baseCurrency")}
              description={t("baseCurrencyHint")}
              required
              render={(field) => (
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={(v) => {
                    if (!v) return;
                    field.onChange(v);
                    // The base is always 1; it can't also be a rate row.
                    const i = form.getValues("rates").findIndex((r) => r.currencyCode === v);
                    if (i >= 0) rates.remove(i);
                  }}
                  options={currencyOptions}
                />
              )}
            />
            <RHFField
              control={form.control}
              name="pointsExpireAfterMonths"
              label={t("expiry")}
              description={t("expiryHint")}
              required
              render={(field) => <NumberField name={field.name} value={field.value ?? null} onValueChange={(v) => field.onChange(v ?? undefined)} min={1} step={1} />}
            />
          </div>

          <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 border-t border-line p-0 pt-5">
            <legend className="float-start w-full p-0 text-title-sm text-fg">{t("ratesTitle")}</legend>
            <p className="text-body-sm text-fg-muted">{t("ratesHint", { currency: base })}</p>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <li className="flex min-h-control-md items-center rounded-field border border-line bg-sunken px-3 text-body text-fg-muted">{t("baseRow", { currency: base })}</li>
              {rates.fields.map((row, i) => (
                <li key={row.id} className="flex items-end gap-2">
                  <RHFField
                    control={form.control}
                    name={`rates.${i}.rate`}
                    label={t("rateLabel", { code: row.currencyCode, base })}
                    className="min-w-0 flex-1"
                    render={(field) => (
                      <NumberField
                        name={field.name}
                        value={field.value ?? null}
                        onValueChange={(v) => field.onChange(v ?? undefined)}
                        min={0}
                        steppers={false}
                        format={{ maximumFractionDigits: 6 }}
                      />
                    )}
                  />
                  <IconButton label={t("removeRate", { code: row.currencyCode })} icon={<Trash />} onClick={() => rates.remove(i)} />
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                aria-label={t("addCurrency")}
                placeholder={addable.length ? t("chooseCurrency") : t("noMoreCurrencies")}
                value={toAdd}
                onValueChange={(v) => setToAdd(v)}
                options={addable}
                disabled={!addable.length}
                className="sm:w-72"
              />
              <Button
                variant="secondary"
                startIcon={<Plus />}
                disabled={!toAdd}
                onClick={() => {
                  if (!toAdd) return;
                  rates.append({ currencyCode: toAdd, rate: 1 });
                  setToAdd(null);
                }}
              >
                {t("addCurrency")}
              </Button>
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-5">
            {form.formState.isDirty ? (
              <Button variant="ghost" disabled={saving} onClick={() => form.reset(valuesOf(data))}>
                {t("discard")}
              </Button>
            ) : null}
            <Button type="submit" variant="primary" loading={saving}>
              {t("saveProgram")}
            </Button>
          </div>
        </fieldset>
      </form>
    </Card>
  );
}
