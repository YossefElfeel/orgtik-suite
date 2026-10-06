"use client";

import { useCallback, useState } from "react";
import type { FieldValues } from "react-hook-form";
import ServerEntitySelect from "@/components/shared/EntitySelectFields/ServerEntitySelect";
import { useGetSalesmenQuery } from "@/redux/features/salesman/salesmanApi";
import type { EntitySelectFieldProps } from "@/types/entity-select";

export default function SalesmanSelectField<T extends FieldValues>({
  form,
  name,
  enabled,
  label = "Assigned Salesman",
  placeholder = "Select salesman",
  searchPlaceholder = "Search salesmen...",
  optional,
  required,
}: EntitySelectFieldProps<T>) {
  const [search, setSearch] = useState("");
  const handleSearchChange = useCallback((value: string) => setSearch(value), []);

  const { data, isFetching } = useGetSalesmenQuery(
    {
      page: 1,
      limit: 50,
      ...(search ? { search } : {}),
    },
    { skip: !enabled },
  );

  const items = (data?.data?.items ?? []).map((salesman) => ({
    id: salesman.id,
    label: salesman.fullName,
    searchText: `${salesman.fullName} ${salesman.email}`,
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
