"use client";

import { useCallback, useState } from "react";
import type { FieldValues } from "react-hook-form";
import ServerEntitySelect from "@/components/shared/EntitySelectFields/ServerEntitySelect";
import { useGetZonesListQuery } from "@/redux/features/zones/zonesApi";
import type { EntitySelectFieldProps } from "@/types/entity-select";

export default function ZoneSelectField<T extends FieldValues>({
  form,
  name,
  enabled,
  label = "Zone",
  placeholder = "Select zone",
  searchPlaceholder = "Search zones...",
  optional,
  required,
}: EntitySelectFieldProps<T>) {
  const [search, setSearch] = useState("");
  const handleSearchChange = useCallback((value: string) => setSearch(value), []);

  const { data, isFetching } = useGetZonesListQuery(
    {
      page: 1,
      limit: 20,
      ...(search ? { search } : {}),
    },
    { skip: !enabled },
  );

  const items = (data?.data?.items ?? []).map((zone) => ({
    id: zone.id,
    label: zone.name,
  }));

  return (
    <ServerEntitySelect
      form={form}
      name={name}
      enabled={enabled}
      items={items}
      isSearching={isFetching}
      onSearchChange={handleSearchChange}
      label={label}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      optional={optional}
      required={required}
    />
  );
}
