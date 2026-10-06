"use client";

import { useCallback, useState } from "react";
import type { FieldValues } from "react-hook-form";
import ServerEntitySelect from "@/components/shared/EntitySelectFields/ServerEntitySelect";
import { useGetCustomersQuery } from "@/redux/features/customers/customersApi";
import type { EntitySelectFieldProps } from "@/types/entity-select";

export default function CustomerSelectField<T extends FieldValues>({
  form,
  name,
  enabled,
  label = "Customer",
  placeholder = "Select customer",
  searchPlaceholder = "Search customers...",
  optional,
  required,
  clearable,
}: EntitySelectFieldProps<T>) {
  const [search, setSearch] = useState("");
  const handleSearchChange = useCallback((value: string) => setSearch(value), []);

  const { data, isFetching } = useGetCustomersQuery(
    {
      page: 1,
      limit: 20,
      ...(search ? { search } : {}),
    },
    { skip: !enabled },
  );

  const items = (data?.data?.items ?? []).map((customer) => ({
    id: customer.id,
    label: customer.fullName,
    searchText: `${customer.fullName} ${customer.email}`,
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
      clearable={clearable}
    />
  );
}
