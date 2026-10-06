"use client";

import { useEffect, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import { useGetZoneCountriesQuery } from "@/redux/features/zones/zonesApi";
import type {
  ZoneCatalogCountry,
  ZoneCountryFieldProps,
} from "@/types/zones";

export default function ZoneCountryField({
  form,
  enabled,
  initialCountries,
  onCountriesLoaded,
}: ZoneCountryFieldProps) {
  const t = useTranslations("planManagement.zones");
  const [search, setSearch] = useState("");
  const [knownCountries, setKnownCountries] = useState<
    Record<string, ZoneCatalogCountry>
  >({});
  const selectedCodes = useWatch({
    control: form.control,
    name: "countryCodes",
  });

  const { data, isFetching } = useGetZoneCountriesQuery(
    {
      page: 1,
      limit: 20,
      ...(search ? { search } : {}),
    },
    { skip: !enabled },
  );
  const countries = data?.data.items;

  useEffect(() => {
    if (!enabled) {
      setSearch("");
      setKnownCountries((current) =>
        Object.keys(current).length > 0 ? {} : current,
      );
      return;
    }

    if (!countries?.length) return;

    setKnownCountries((current) => {
      const next = { ...current };
      for (const country of countries) {
        next[country.code] = country;
      }
      return next;
    });
    onCountriesLoaded(countries);
  }, [countries, enabled, onCountriesLoaded]);

  const options = useMemo(() => {
    const optionsByCode = new Map(
      (countries ?? []).map((country) => [
        country.code,
        {
          value: country.code,
          label: country.name,
          searchText: `${country.code} ${country.name} ${country.nativeName}`,
        },
      ]),
    );

    for (const code of selectedCodes ?? []) {
      const country = knownCountries[code];
      const initialCountry = initialCountries?.find(
        (item) => item.code === code,
      );
      if (!country && !initialCountry) continue;

      optionsByCode.set(code, {
        value: code,
        label: country?.name ?? initialCountry?.name ?? code,
        searchText: country
          ? `${country.code} ${country.name} ${country.nativeName}`
          : `${code} ${initialCountry?.name ?? ""}`,
      });
    }

    return Array.from(optionsByCode.values());
  }, [countries, initialCountries, knownCountries, selectedCodes]);

  return (
    <div className="space-y-2">
      <ComboboxFormEle
        form={form}
        name="countryCodes"
        label={t("countries")}
        placeholder={`+ ${t("selectCountry")}`}
        searchPlaceholder={t("searchCountries")}
        options={options}
        multiple
        maxSelectedDisplay={12}
        onSearchChange={setSearch}
        isSearching={isFetching}
      />
      <p className="text-12 leading-5 text-muted-foreground">
        {t("selectedCountries", { count: selectedCodes?.length ?? 0 })}
      </p>
    </div>
  );
}
