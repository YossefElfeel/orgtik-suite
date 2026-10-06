"use client";

import { useEffect, useMemo } from "react";
import { useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import type { ZoneCurrencyFieldProps } from "@/types/zones";

export default function ZoneCurrencyField({
  form,
  countries,
}: ZoneCurrencyFieldProps) {
  const t = useTranslations("planManagement.zones");
  const selectedCountryCodes = useWatch({
    control: form.control,
    name: "countryCodes",
  });
  const defaultCurrencyCode = useWatch({
    control: form.control,
    name: "defaultCurrencyCode",
  });

  const currencyCodes = useMemo(() => {
    const selected = new Set(selectedCountryCodes ?? []);
    const codes = new Set<string>();
    let matchedCountries = 0;

    for (const country of countries) {
      if (!selected.has(country.code)) continue;
      matchedCountries += 1;
      for (const code of country.currencyCodes) {
        codes.add(code);
      }
    }

    if (matchedCountries === 0 && defaultCurrencyCode) {
      codes.add(defaultCurrencyCode);
    }

    return Array.from(codes).sort();
  }, [countries, defaultCurrencyCode, selectedCountryCodes]);

  useEffect(() => {
    if (!defaultCurrencyCode || currencyCodes.includes(defaultCurrencyCode)) {
      return;
    }

    form.setValue("defaultCurrencyCode", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [currencyCodes, defaultCurrencyCode, form]);

  return (
    <div className="space-y-2">
      <ComboboxFormEle
        form={form}
        name="defaultCurrencyCode"
        label={t("defaultCurrency")}
        placeholder={t("selectCurrency")}
        options={currencyCodes.map((code) => ({
          value: code,
          label: code,
        }))}
        disabled={(selectedCountryCodes?.length ?? 0) === 0}
        emptyMessage={t("selectCountriesFirst")}
      />
      <p className="text-12 leading-5 text-muted-foreground">
        {t("currencyHint")}
      </p>
    </div>
  );
}
