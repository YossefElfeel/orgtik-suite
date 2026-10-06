"use client";

// One standard plan in a deal: its duration and installment term, as the API prices them for the
// customer's zone. Every term the API offers (3, 6, 12, 24 months…) is kept as chosen (SAL-011).
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Trash } from "@phosphor-icons/react";
import { Badge, Card, Field, IconButton, RadioGroup, Select } from "@orgtik/ui";
import DealLinePrice from "@/components/dialogs/shared/deal-plans/DealLinePrice";
import { standardChoice } from "@/lib/deals/deal-form";
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
  locked: boolean;
  onRemove: () => void;
};

export default function DealStandardPlanCard({ form, index, catalog, currency, priced, locked, onRemove }: Props) {
  const t = useTranslations("Deal");
  const fmt = useDealFormat();
  const line = useWatch({ control: form.control, name: `standard.${index}` });
  const errors = form.formState.errors.standard?.[index];
  // A removed line can be read once more before its card goes.
  if (!line) return null;
  const { prices, duration, term } = standardChoice(line, catalog);
  const terms = duration?.installments ?? [];
  const sold = prices.length > 0;
  const set = (patch: Partial<typeof line>) => {
    for (const [k, v] of Object.entries(patch)) form.setValue(`standard.${index}.${k as keyof typeof line}`, v as never, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
  };

  return (
    <Card padding="sm" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span dir="auto" className="text-body font-semibold text-fg">
            {line.name}
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral" size="sm">
              {t("standardBadge")}
            </Badge>
            {line.keptTotal ? (
              <Badge tone="info" size="sm">
                {t("keptPrice")}
              </Badge>
            ) : null}
          </span>
        </div>
        {locked ? null : (
          <IconButton variant="ghost" size="sm" label={t("removePlan", { name: line.name })} icon={<Trash />} onClick={onRemove} />
        )}
      </div>

      {!sold && !line.keptTotal ? <p className="text-body-sm text-danger">{t("notSoldHere")}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("durationLabel")} required error={errors?.durationId?.message}>
          <Select
            value={duration?.duration.durationId ?? null}
            onValueChange={(v) => v && set({ durationId: v, durationMonths: null, keptTotal: null, installmentId: "", installmentMonths: null, payment: "cash" })}
            options={prices.map((p) => ({
              value: p.duration.durationId,
              label: num(p.discountPercentage)
                ? t("durationOptionOff", { months: p.duration.months, discount: fmt.percent(p.discountPercentage, 0), total: fmt.money(p.discountedTotal, p.currencyCode) })
                : t("durationOption", { months: p.duration.months, total: fmt.money(p.discountedTotal, p.currencyCode) }),
            }))}
            placeholder={line.durationMonths ? t("monthsCount", { months: line.durationMonths }) : t("durationPlaceholder")}
            disabled={locked}
          />
        </Field>
        <Field group label={t("paymentLabel")}>
          <RadioGroup<DealPayment>
            orientation="horizontal"
            value={line.payment}
            onValueChange={(v) => set(v === "cash" ? { payment: v, installmentId: "", installmentMonths: null } : { payment: v, installmentId: terms[0]?.durationId ?? "", installmentMonths: null })}
            disabled={locked}
            options={[
              { value: "cash", label: t("payUpfront") },
              { value: "installment", label: t("payInstallments"), disabled: terms.length === 0 },
            ]}
          />
        </Field>
        {line.payment === "installment" ? (
          <Field label={t("termLabel")} required error={errors?.installmentId?.message} className="md:col-span-2">
            <Select
              value={term?.durationId ?? null}
              onValueChange={(v) => v && set({ installmentId: v, installmentMonths: null })}
              options={terms.map((i) => ({
                value: i.durationId,
                label: num(i.markupPercentage)
                  ? t("termOptionMarkup", { months: i.months, markup: fmt.percent(i.markupPercentage, 0), monthly: fmt.money(i.monthlyPayment, currency) })
                  : t("termOption", { months: i.months, monthly: fmt.money(i.monthlyPayment, currency) }),
              }))}
              placeholder={line.installmentMonths ? t("paymentsCount", { months: line.installmentMonths }) : t("termPlaceholder")}
              disabled={locked}
            />
          </Field>
        ) : null}
      </div>

      <DealLinePrice priced={priced} currency={currency} />
    </Card>
  );
}
