"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import { ReactNode } from "react";
import { useGetEmployeeSelectOptionsQuery } from "@/redux/features/employee/employeeApi";
import ComboboxFormEle from "./combobox-form-element";

interface EmployeeComboBoxProps<T extends FieldValues> {
  form: UseFormReturn<T, any, any>;
  name: Path<T>;
  label?: string | ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  labelClassName?: string;
  triggerClassName?: string;
  disabled?: boolean;
  emptyMessage?: string;
  multiple?: boolean;
  maxSelectedDisplay?: number;
  triggerIcon?: ReactNode;
  handlelSelectAll?: () => void;
  badgeClassName?: string;
  open?: boolean; // Optional parent dialog/sheet open state to reset pagination
  initialOptions?: { value: string; label: string }[];
}

export default function EmployeeComboBox<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  searchPlaceholder,
  className,
  labelClassName,
  triggerClassName,
  disabled,
  emptyMessage,
  multiple,
  maxSelectedDisplay,
  triggerIcon,
  handlelSelectAll,
  badgeClassName,
  open,
  initialOptions = [],
}: EmployeeComboBoxProps<T>) {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [totalEmployees, setTotalEmployees] = useState<any[]>([]);

  // Debounce search input to avoid hitting backend API on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isFetching } = useGetEmployeeSelectOptionsQuery({
    limit: 10,
    page,
    search: debouncedSearch || undefined,
  });

  const isLastPage = data?.data?.meta?.page === data?.data?.meta?.totalPages;

  // Memoize initialOptions using JSON serialization to avoid reference changes triggering effect loops
  const serializedInitial = JSON.stringify(initialOptions);
  const memoizedInitial = useMemo(() => initialOptions, [serializedInitial]);

  // Handle appending of paginated employee options
  useEffect(() => {
    if (!data?.data?.items) {
      if (memoizedInitial.length > 0 && totalEmployees.length === 0) {
        setTotalEmployees(memoizedInitial);
      }
      return;
    }
    const employees = data.data.items.map((employee) => ({
      value: String(employee.id),
      label: employee.fullName,
    }));
    setTotalEmployees((prev) => {
      if (data?.data?.meta?.page === 1) {
        // Merge initialOptions and first page, deduplicating them
        const merged = [...memoizedInitial, ...employees];
        const seen = new Set();
        return merged.filter((item) => {
          if (seen.has(item.value)) return false;
          seen.add(item.value);
          return true;
        });
      }
      return [...prev, ...employees];
    });
  }, [data, memoizedInitial]);

  // Reset pagination state when parent opens/closes
  useEffect(() => {
    if (open !== undefined) {
      if (open) {
        setPage(1);
      } else {
        setPage(1);
        setTotalEmployees([]);
        setSearch("");
        setDebouncedSearch("");
      }
    }
  }, [open]);

  return (
    <ComboboxFormEle
      form={form}
      name={name}
      label={label}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      className={className}
      labelClassName={labelClassName}
      triggerClassName={triggerClassName}
      disabled={disabled}
      emptyMessage={emptyMessage}
      multiple={multiple}
      maxSelectedDisplay={maxSelectedDisplay}
      triggerIcon={triggerIcon}
      handlelSelectAll={handlelSelectAll}
      badgeClassName={badgeClassName}
      options={totalEmployees}
      isLoading={isFetching}
      isShowMore={!isLastPage}
      onShowMore={() => setPage((p) => p + 1)}
      onSearchChange={(val) => setSearch(val)}
    />
  );
}
