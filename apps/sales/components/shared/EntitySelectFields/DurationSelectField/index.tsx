"use client";

import { useCallback } from "react";
import type { FieldValues } from "react-hook-form";
import ServerEntitySelect from "@/components/shared/EntitySelectFields/ServerEntitySelect";
import Skeleton from "@/components/shared/Skeleton";
import { useGetSubscriptionRenewalDurationsQuery } from "@/redux/features/subscriptions/subscriptionsApi";
import type { DurationSelectFieldProps } from "@/types/entity-select";
import type { AdminRenewalDurationOption } from "@/types/subscriptions";

function durationLabel(duration: AdminRenewalDurationOption) {
  const label =
    duration.months === 1 ? "1 Month" : `${duration.months} Months`;
  if (duration.percentage && duration.percentage !== "0.00") {
    return `${label} (-${duration.percentage}%)`;
  }
  return label;
}

export default function DurationSelectField<T extends FieldValues>({
  form,
  name,
  enabled,
  subscriptionId,
  label = "Duration",
  placeholder = "Select duration",
  searchPlaceholder = "Search durations...",
  optional,
  required,
}: DurationSelectFieldProps<T>) {
  const handleSearchChange = useCallback(() => {}, []);
  const { data, isLoading, isFetching } =
    useGetSubscriptionRenewalDurationsQuery(subscriptionId, {
      skip: !enabled || !subscriptionId,
    });

  const items = (data?.data.durations ?? [])
    .filter((duration) => duration.isActive)
    .map((duration) => {
      const label = durationLabel(duration);
      return {
        id: duration.id,
        label,
        searchText: label,
      };
    });

  if (enabled && isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

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
