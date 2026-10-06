"use client";

import { useCallback, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import ServerEntitySelect from "@/components/shared/EntitySelectFields/ServerEntitySelect";
import { useGetDepartmentsListQuery } from "@/redux/features/departments/departmentsApi";
import type { EntitySelectFieldProps } from "@/types/entity-select";

export default function DepartmentSelectField<T extends FieldValues>({
  form,
  name,
  enabled,
  label = "Department",
  placeholder = "Select department",
  searchPlaceholder = "Search departments...",
  optional,
  required,
}: EntitySelectFieldProps<T>) {
  const displayText = useCatalogDisplayText();
  const [search, setSearch] = useState("");
  const handleSearchChange = useCallback((value: string) => setSearch(value), []);

  const { data, isFetching } = useGetDepartmentsListQuery(
    {
      page: 1,
      limit: 20,
      ...(search ? { search } : {}),
    },
    { skip: !enabled },
  );

  const items = (data?.data?.items ?? []).map((department) => ({
    id: department.id,
    label: displayText(department.name),
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
