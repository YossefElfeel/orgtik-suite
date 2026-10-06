"use client";

import { useCallback, useMemo, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import ServerEntitySelect from "@/components/shared/EntitySelectFields/ServerEntitySelect";
import { useGetZoneCountriesQuery } from "@/redux/features/zones/zonesApi";
import type { EntitySelectFieldProps } from "@/types/entity-select";
import type { ZoneCatalogCountry } from "@/types/zones";

function toCountryItem(country: ZoneCatalogCountry) {
  return {
    id: country.code,
    label: country.name,
    searchText: `${country.code} ${country.name} ${country.nativeName}`,
  };
}

export default function CountrySelectField<T extends FieldValues>({
  form,
  name,
  enabled,
  label,
  placeholder,
  searchPlaceholder,
  optional,
  required,
}: EntitySelectFieldProps<T>) {
  const t = useTranslations("customers");
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const handleSearchChange = useCallback(
    (value: string) => setSearch(value),
    [],
  );

  const selectedCodeRaw = useWatch({ control: form.control, name });
  const selectedCode =
    typeof selectedCodeRaw === "string" ? selectedCodeRaw.trim() : "";

  const { data, isFetching, isSuccess } = useGetZoneCountriesQuery(
    {
      page: 1,
      limit: 50,
      ...(search ? { search } : {}),
    },
    { skip: !enabled },
  );

  const listItems = data?.data?.items ?? [];
  const selectedInList = listItems.some(
    (country) => country.code === selectedCode,
  );

  const { data: selectedCountryData, isFetching: isFetchingSelected } =
    useGetZoneCountriesQuery(
      {
        page: 1,
        limit: 50,
        search: selectedCode,
      },
      {
        skip: !enabled || !selectedCode || !isSuccess || selectedInList,
      },
    );

  const items = useMemo(() => {
    const byCode = new Map(
      listItems.map((country) => [country.code, toCountryItem(country)]),
    );

    const selectedMatch = selectedCountryData?.data?.items?.find(
      (country) => country.code === selectedCode,
    );
    if (selectedMatch && !byCode.has(selectedMatch.code)) {
      byCode.set(selectedMatch.code, toCountryItem(selectedMatch));
    }

    return Array.from(byCode.values());
  }, [listItems, selectedCode, selectedCountryData]);

  return (
    <ServerEntitySelect
      form={form}
      name={name}
      enabled={enabled}
      items={items}
      isSearching={isFetching || isFetchingSelected}
      onSearchChange={handleSearchChange}
      label={label ?? t("country")}
      placeholder={placeholder ?? t("selectCountry")}
      searchPlaceholder={searchPlaceholder ?? tCommon("search")}
      optional={optional}
      required={required}
    />
  );
}
