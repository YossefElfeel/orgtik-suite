"use client";

// The deal's terms: the VAT country (its rate, as a percent of the net) and, for an offer, a note to
// the customer; for a project, an optional coupon. An edit keeps the VAT country it was saved with
// (it was reset to CH, SAL-009).
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { Combobox, Input, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useDealFormat } from "@/lib/deals/format";
import { useDisplayNames } from "@/components/pages/customers/leads";
import type { DealCatalog } from "@/lib/deals/catalog";
import { NO_VAT, type DealFormValues, type DealMode } from "@/schemas/offers";

type Props = {
  form: UseFormReturn<DealFormValues>;
  mode: DealMode;
  catalog: DealCatalog;
  lockedReason: string | null;
};

export default function DealTermsStep({ form, mode, catalog, lockedReason }: Props) {
  const t = useTranslations("Deal");
  const fmt = useDealFormat();
  const names = useDisplayNames();
  // A new deal starts with the VAT of the customer's country, when it has one.
  const { getValues, setValue } = form;
  useEffect(() => {
    if (getValues("vatCountryCode")) return;
    const country = getValues("countryCode");
    if (country && catalog.vat.some((v) => v.code === country)) setValue("vatCountryCode", country, { shouldDirty: true });
  }, [catalog.vat, getValues, setValue]);
  const options = [
    { value: NO_VAT, label: t("noVat") },
    ...catalog.vat.map((v) => ({ value: v.code, label: t("vatOption", { country: names.country(v.code), rate: fmt.percent(v.vatRate, 2) }), hint: v.code })),
  ];

  return (
    <div className="flex flex-col gap-5">
      <RHFField
        control={form.control}
        name="vatCountryCode"
        label={t("vatLabel")}
        description={lockedReason ?? t("vatHint")}
        required
        render={(f) => (
          <Combobox
            value={f.value || null}
            onValueChange={(v) => f.onChange(v ?? "")}
            options={options}
            placeholder={t("vatPlaceholder")}
            aria-label={t("vatLabel")}
            disabled={Boolean(lockedReason)}
            className="sm:max-w-md"
          />
        )}
      />
      {mode === "offer" ? (
        <RHFField
          control={form.control}
          name="note"
          label={t("noteLabel")}
          description={t("noteHint")}
          optional
          render={(f) => <Textarea {...f} dir="auto" rows={4} />}
        />
      ) : (
        <RHFField
          control={form.control}
          name="couponCode"
          label={t("couponLabel")}
          description={t("couponHint")}
          optional
          render={(f) => <Input {...f} autoComplete="off" spellCheck={false} className="sm:max-w-xs" />}
        />
      )}
    </div>
  );
}
