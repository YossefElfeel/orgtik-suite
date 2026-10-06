"use client";

// One custom plan: a name, its features (priced by the API in the customer's zone and currency,
// SAL-022), a duration with the API's discount and an installment term with the API's markup.
import { useTranslations } from "next-intl";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Trash } from "@phosphor-icons/react";
import { Badge, Card, Field, IconButton, Input, MultiSelect, RadioGroup, Select } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import DealLinePrice from "@/components/dialogs/shared/deal-plans/DealLinePrice";
import { customChoice } from "@/lib/deals/deal-form";
import { num, useDealFormat } from "@/lib/deals/format";
import type { DealCatalog } from "@/lib/deals/catalog";
import type { PricedLine } from "@/lib/deals/pricing";
import type { DealFormValues } from "@/schemas/offers";
import type { DealPayment } from "@/types/projects";

type Props = {
  form: UseFormReturn<DealFormValues>;
  index: number;
  catalog: DealCatalog;
  currency: string;
  priced: PricedLine | undefined;
  /** The deal's plans can't change (another custom plan is locked). */
  locked: boolean;
  onRemove: () => void;
};

export default function DealCustomPlanCard({ form, index, catalog, currency, priced, locked, onRemove }: Props) {
  const t = useTranslations("Deal");
  const fmt = useDealFormat();
  const line = useWatch({ control: form.control, name: `custom.${index}` });
  const errors = form.formState.errors.custom?.[index];
  // A removed line can be read once more before its card goes.
  if (!line) return null;
  const { duration, term } = customChoice(line, catalog);
  const frozen = locked || line.locked;
  const set = (patch: Partial<typeof line>) => {
    for (const [k, v] of Object.entries(patch)) form.setValue(`custom.${index}.${k as keyof typeof line}`, v as never, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
  };

  return (
    <Card padding="sm" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone="brand" size="sm">
              {t("customBadge")}
            </Badge>
            {line.keptTotal ? (
              <Badge tone="info" size="sm">
                {t("keptPrice")}
              </Badge>
            ) : null}
          </span>
          {frozen ? (
            <span dir="auto" className="text-body font-semibold text-fg">
              {line.label}
            </span>
          ) : (
            <RHFField
              control={form.control}
              name={`custom.${index}.label`}
              label={t("customName")}
              required
              render={(f) => <Input {...f} dir="auto" autoComplete="off" />}
            />
          )}
        </div>
        {/* A locked plan can still be removed: the rest of the deal is then sent as it is. */}
        {locked && !line.locked ? null : (
          <IconButton variant="ghost" size="sm" label={t("removePlan", { name: line.label })} icon={<Trash />} onClick={onRemove} />
        )}
      </div>

      {line.locked ? (
        <p className="text-body-sm text-fg-muted">
          {[
            line.durationMonths ? t("monthsCount", { months: line.durationMonths }) : null,
            line.payment === "installment" && line.installmentMonths ? t("paymentsCount", { months: line.installmentMonths }) : t("payUpfront"),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("featuresLabel")} required error={errors?.featureIds?.message} className="md:col-span-2">
            <MultiSelect
              value={line.featureIds}
              onValueChange={(ids) => set({ featureIds: ids, keptTotal: null })}
              options={catalog.features.map((f) => ({
                value: f.id,
                label: f.name,
                hint: f.resolvedPrice
                  ? t("featureHint", { category: f.categoryName, price: fmt.money(f.resolvedPrice.price, f.resolvedPrice.currencyCode) })
                  : t("featureNotSold", { category: f.categoryName }),
                disabled: !f.resolvedPrice,
              }))}
              placeholder={t("featuresPlaceholder")}
              aria-label={t("featuresLabel")}
              disabled={locked}
            />
          </Field>
          <Field label={t("durationLabel")} required error={errors?.durationId?.message}>
            <Select
              value={duration?.id ?? null}
              onValueChange={(v) => v && set({ durationId: v, durationMonths: null, keptTotal: null })}
              options={catalog.durations.map((d) => ({
                value: d.id,
                label: num(d.percentage) ? t("customDurationOff", { months: d.months, discount: fmt.percent(d.percentage, 0) }) : t("monthsCount", { months: d.months }),
              }))}
              placeholder={t("durationPlaceholder")}
              disabled={locked}
            />
          </Field>
          <Field group label={t("paymentLabel")}>
            <RadioGroup<DealPayment>
              orientation="horizontal"
              value={line.payment}
              onValueChange={(v) => set(v === "cash" ? { payment: v, installmentId: "", installmentMonths: null } : { payment: v, installmentId: catalog.terms[0]?.id ?? "", installmentMonths: null })}
              disabled={locked}
              options={[
                { value: "cash", label: t("payUpfront") },
                { value: "installment", label: t("payInstallments"), disabled: catalog.terms.length === 0 },
              ]}
            />
          </Field>
          {line.payment === "installment" ? (
            <Field label={t("termLabel")} required error={errors?.installmentId?.message} className="md:col-span-2">
              <Select
                value={term?.id ?? null}
                onValueChange={(v) => v && set({ installmentId: v, installmentMonths: null })}
                options={catalog.terms.map((d) => ({
                  value: d.id,
                  label: num(d.percentage)
                    ? t("customTermMarkup", { months: d.months, markup: fmt.percent(d.percentage, 0) })
                    : t("paymentsCount", { months: d.months }),
                }))}
                placeholder={t("termPlaceholder")}
                disabled={locked}
              />
            </Field>
          ) : null}
        </div>
      )}

      <DealLinePrice priced={priced} currency={currency} />
    </Card>
  );
}
