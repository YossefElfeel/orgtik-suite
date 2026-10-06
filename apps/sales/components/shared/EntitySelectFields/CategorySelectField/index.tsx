"use client";

import { useCallback, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import ServerEntitySelect from "@/components/shared/EntitySelectFields/ServerEntitySelect";
import { useGetCategoriesListQuery } from "@/redux/features/categories/categoriesApi";
import type { EntitySelectFieldProps } from "@/types/entity-select";

export default function CategorySelectField<T extends FieldValues>({
  form,
  name,
  enabled,
  label = "Category",
  placeholder = "Choose category",
  searchPlaceholder = "Search categories...",
  optional,
  required,
}: EntitySelectFieldProps<T>) {
  const displayText = useCatalogDisplayText();
  const [search, setSearch] = useState("");
  const handleSearchChange = useCallback((value: string) => setSearch(value), []);

  const { data, isFetching } = useGetCategoriesListQuery(
    {
      page: 1,
      limit: 50,
      ...(search ? { search } : {}),
    },
    { skip: !enabled },
  );

  const items = (data?.data?.items ?? []).map((category) => ({
    id: category.id,
    label: displayText(category.name),
    searchText: displayText(category.name),
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
