"use client";

// The deal before it is sent: who it is for, each plan and its price, and the totals. The numbers
// are the API's catalog prices; the API prices the deal again when it is saved.
import { useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Info, WarningCircle } from "@phosphor-icons/react";
import { Card } from "@orgtik/ui";
import DealTotals from "@/components/dialogs/shared/deal-plans/DealTotals";
import { priceLines } from "@/lib/deals/deal-form";
import { useDealFormat } from "@/lib/deals/format";
import { useDisplayNames } from "@/components/pages/customers/leads";
import { totals as sumTotals } from "@/lib/deals/pricing";
import type { DealCatalog } from "@/lib/deals/catalog";
import { NO_VAT, type DealFormValues, type DealMode } from "@/schemas/offers";
import type { DealCustomer } from "@/types/projects";
import { PaginatedTable } from "@orgtik/ui/table";

type Props = {
  form: UseFormReturn<DealFormValues>;
  mode: DealMode;
  catalog: DealCatalog;
  currency: string;
  customer: DealCustomer | null;
  /** Changing a signed contract's plans asks the customer to sign again. */
  signedContract: boolean;
};

export default function DealReviewStep({ form, mode, catalog, currency, customer, signedContract }: Props) {
  const t = useTranslations("Deal");
  const tp = useTranslations("Projects");
  const fmt = useDealFormat();
  const names = useDisplayNames();
  const values = useWatch({ control: form.control }) as DealFormValues;
  const vat = catalog.vat.find((v) => v.code === values.vatCountryCode) ?? null;
  const { lines, unpriced } = useMemo(() => priceLines(values, catalog, currency), [values, catalog, currency]);
  const totals = useMemo(() => sumTotals(lines, currency, values.vatCountryCode === NO_VAT ? 0 : (vat?.vatRate ?? 0)), [lines, currency, vat, values.vatCountryCode]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Card padding="sm" className="flex flex-col gap-1">
          <span className="text-caption text-fg-muted">{t("customerSection")}</span>
          <span dir="auto" className="text-body font-semibold text-fg">
            {customer?.fullName ?? "—"}
          </span>
          {customer?.companyName ? (
            <span dir="auto" className="text-body-sm text-fg-muted">
              {customer.companyName}
            </span>
          ) : null}
          {customer?.email ? (
            <bdi dir="ltr" className="text-body-sm text-fg-muted">
              {customer.email}
            </bdi>
          ) : null}
        </Card>
        {mode === "project" ? (
          <Card padding="sm" className="flex flex-col gap-1">
            <span className="text-caption text-fg-muted">{t("projectSection")}</span>
            <span dir="auto" className="text-body font-semibold text-fg">
              {values.projectName || "—"}
            </span>
            <span className="text-body-sm text-fg-muted">{tp(`priority.${values.priority}`)}</span>
          </Card>
        ) : values.note ? (
          <Card padding="sm" className="flex flex-col gap-1">
            <span className="text-caption text-fg-muted">{t("noteLabel")}</span>
            <p dir="auto" className="text-body-sm whitespace-pre-line text-fg">
              {values.note}
            </p>
          </Card>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-card border border-line">
        <PaginatedTable><table className="w-full border-collapse text-body-sm">
          <caption className="sr-only">{t("reviewPlans")}</caption>
          <thead>
            <tr className="border-b border-line text-caption text-fg-muted">
              <th scope="col" className="px-4 py-2 text-start font-semibold">
                {t("colPlan")}
              </th>
              <th scope="col" className="px-4 py-2 text-start font-semibold">
                {t("colTerms")}
              </th>
              <th scope="col" className="px-4 py-2 text-end font-semibold">
                {t("colAmount")}
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.key} className="border-b border-line last:border-0">
                <td className="px-4 py-2 align-top">
                  <span dir="auto" className="font-semibold text-fg">
                    {l.name}
                  </span>
                  <span className="block text-caption text-fg-muted">{l.isCustom ? t("customBadge") : t("standardBadge")}</span>
                </td>
                <td className="px-4 py-2 align-top text-fg-muted">
                  {t("monthsCount", { months: l.months })}
                  {l.discountPercent && !l.kept ? ` · ${t("discountOff", { discount: fmt.percent(l.discountPercent, 0) })}` : ""}
                  <span className="block">
                    {l.payment === "installment" && l.installmentMonths
                      ? t("monthlyTimes", { months: l.installmentMonths, amount: fmt.money(l.monthlyInstallment ?? 0, currency) })
                      : t("payUpfront")}
                  </span>
                </td>
                <td className="px-4 py-2 text-end align-top tabular-nums text-fg">
                  {fmt.money(l.total, currency)}
                  {l.markup ? <span className="block text-caption text-fg-muted">{t("plusMarkup", { amount: fmt.money(l.markup, currency) })}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table></PaginatedTable>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_minmax(16rem,22rem)]">
        <div className="flex flex-col gap-2 text-body-sm text-fg-muted">
          <p className="flex items-start gap-2">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            {t("previewNote")}
          </p>
          {unpriced ? (
            <p role="alert" className="flex items-start gap-2 text-danger">
              <WarningCircle aria-hidden weight="fill" className="mt-0.5 size-4 shrink-0" />
              {t("unpriced", { count: unpriced })}
            </p>
          ) : null}
          {mode === "project" && values.couponCode.trim() ? (
            <p className="flex items-start gap-2">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
              {t("couponOnSave", { code: values.couponCode.trim() })}
            </p>
          ) : null}
          {signedContract ? (
            <p role="note" className="flex items-start gap-2 text-fg">
              <WarningCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
              {t("resignNote")}
            </p>
          ) : null}
        </div>
        <Card padding="sm">
          <DealTotals totals={totals} vatCountry={values.vatCountryCode === NO_VAT ? null : (vat ? names.country(vat.code) : null)} />
        </Card>
      </div>
    </div>
  );
}
