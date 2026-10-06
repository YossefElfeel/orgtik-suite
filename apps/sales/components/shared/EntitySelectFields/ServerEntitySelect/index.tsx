"use client";

import { useEffect, useMemo, useState } from "react";
import type { FieldValues } from "react-hook-form";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import type { ServerEntitySelectProps } from "@/types/entity-select";

export default function ServerEntitySelect<T extends FieldValues>({
  form,
  name,
  enabled,
  items,
  isSearching,
  onSearchChange,
  label,
  placeholder,
  searchPlaceholder,
  optional,
  required,
  clearable,
}: ServerEntitySelectProps<T>) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const watchedValue = form.watch(name);
  const selectedId = typeof watchedValue === "string" ? watchedValue : "";

  const options = useMemo(() => {
    const nextOptions = items.map((item) => ({
      value: item.id,
      label: item.label,
      searchText: item.searchText ?? item.label,
    }));

    if (
      selectedId &&
      selectedLabel &&
      !nextOptions.some((option) => option.value === selectedId)
    ) {
      nextOptions.unshift({
        value: selectedId,
        label: selectedLabel,
        searchText: selectedLabel,
      });
    }

    return nextOptions;
  }, [items, selectedId, selectedLabel]);

  useEffect(() => {
    if (!enabled) {
      onSearchChange("");
      setSelectedLabel(null);
    }
  }, [enabled, onSearchChange]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedLabel(null);
      return;
    }

    const selectedItem = items.find((item) => item.id === selectedId);
    if (selectedItem) setSelectedLabel(selectedItem.label);
  }, [items, selectedId]);

  return (
    <ComboboxFormEle
      form={form}
      name={name}
      label={label}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      options={options}
      onSearchChange={onSearchChange}
      isSearching={isSearching}
      optional={optional}
      required={required}
      clearable={clearable}
    />
  );
}
