"use client";

// The plans of a deal: standard plans from the catalog (duration and installment term as the API
// prices them) and custom plans built from features. Each line shows its price as it stands.
import { useMemo, useState } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Plus, WarningCircle } from "@phosphor-icons/react";
import { Button, Combobox, EmptyState, ErrorState, LoadingState } from "@orgtik/ui";
import DealStandardPlanCard from "@/components/dialogs/shared/deal-plans/DealStandardPlanCard";
import DealCustomPlanCard from "@/components/dialogs/shared/deal-plans/DealCustomPlanCard";
import { newCustomLine, newStandardLine, priceLines } from "@/lib/deals/deal-form";
import { catalogText } from "@/lib/deals/pricing";
import { isolate } from "@/lib/bidi";
import type { DealCatalog } from "@/lib/deals/catalog";
import type { DealFormValues } from "@/schemas/offers";

type Props = {
  form: UseFormReturn<DealFormValues>;
  catalog: DealCatalog;
  currency: string;
  /** Why the plans can't change (an offer's custom plan the API doesn't describe). */
  lockedReason: string | null;
};

export default function DealPlansStep({ form, catalog, currency, lockedReason }: Props) {
  const t = useTranslations("Deal");
  const locale = useLocale();
  const standard = useFieldArray({ control: form.control, name: "standard", keyName: "fieldKey" });
  const custom = useFieldArray({ control: form.control, name: "custom", keyName: "fieldKey" });
  const values = useWatch({ control: form.control }) as DealFormValues;
  const countryCode = values.countryCode;
  const [picker, setPicker] = useState<string | null>(null);

  const priced = useMemo(() => {
    const { lines } = priceLines(values, catalog, currency);
    return new Map(lines.map((l) => [l.key, l]));
  }, [values, catalog, currency]);

  const chosen = new Set((values.standard ?? []).map((l) => l.planId));
  const options = catalog.sellable
    .filter((p) => !chosen.has(p.id))
    .map((p) => ({ value: p.id, label: catalogText(p.name, locale), hint: p.categories.map((c) => catalogText(c.name, locale)).join(" · ") }));
  const noPlans = form.formState.errors.standard?.root?.message;

  if (!countryCode) return <EmptyState size="compact" title={t("noCountryTitle")} description={t("noCountryBody")} />;
  if (catalog.isLoading) return <LoadingState rows={4} label={t("loadingCatalog")} />;
  if (catalog.isError) return <ErrorState size="compact" title={t("catalogErrorTitle")} description={t("catalogErrorBody")} onRetry={catalog.refetch} />;

  const add = (planId: string | null) => {
    const plan = planId ? catalog.planById.get(planId) : undefined;
    if (!plan) return;
    const first = plan.resolvedPrice?.[0];
    standard.append(newStandardLine(plan.id, catalogText(plan.name, locale), first?.duration.durationId ?? ""));
    setPicker(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-body text-fg-muted">
        {catalog.zoneName && currency ? t("pricesFor", { zone: isolate(catalog.zoneName), currency }) : t("pricesForCurrency", { currency })}
      </p>
      {lockedReason ? (
        <p role="note" className="flex items-start gap-2 rounded-field bg-sunken px-3 py-2 text-body-sm text-fg">
          <WarningCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-muted" />
          {lockedReason}
        </p>
      ) : null}
      {noPlans ? (
        <p role="alert" className="flex items-start gap-2 text-body-sm text-danger">
          <WarningCircle aria-hidden weight="fill" className="mt-0.5 size-4 shrink-0" />
          {noPlans}
        </p>
      ) : null}

      <section aria-labelledby="deal-standard" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 id="deal-standard" className="text-title-sm text-fg">
              {t("standardSection")}
            </h3>
            <p className="text-body-sm text-fg-muted">{t("standardHint")}</p>
          </div>
          {lockedReason ? null : (
            <Combobox
              value={picker}
              onValueChange={(v) => add(v)}
              options={options}
              placeholder={t("addPlan")}
              aria-label={t("addPlan")}
              emptyText={t("noMorePlans")}
              className="w-full sm:w-80"
            />
          )}
        </div>
        {standard.fields.length === 0 ? (
          <p className="rounded-field border border-dashed border-line px-4 py-3 text-body-sm text-fg-muted">
            {catalog.sellable.length ? t("standardEmpty") : t("standardNone")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {standard.fields.map((field, i) => (
              <li key={field.fieldKey}>
                <DealStandardPlanCard
                  form={form}
                  index={i}
                  catalog={catalog}
                  currency={currency}
                  priced={priced.get(field.key)}
                  locked={Boolean(lockedReason)}
                  onRemove={() => standard.remove(i)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="deal-custom" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 id="deal-custom" className="text-title-sm text-fg">
              {t("customSection")}
            </h3>
            <p className="text-body-sm text-fg-muted">{t("customHint")}</p>
          </div>
          {lockedReason ? null : (
            <Button type="button" variant="secondary" onClick={() => custom.append(newCustomLine(t("customDefaultName", { n: custom.fields.length + 1 })))} startIcon={<Plus aria-hidden className="size-4" />}>
              {t("addCustom")}
            </Button>
          )}
        </div>
        {custom.fields.length === 0 ? (
          <p className="rounded-field border border-dashed border-line px-4 py-3 text-body-sm text-fg-muted">{t("customEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {custom.fields.map((field, i) => (
              <li key={field.fieldKey}>
                <DealCustomPlanCard
                  form={form}
                  index={i}
                  catalog={catalog}
                  currency={currency}
                  priced={priced.get(field.key)}
                  locked={Boolean(lockedReason)}
                  onRemove={() => custom.remove(i)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
