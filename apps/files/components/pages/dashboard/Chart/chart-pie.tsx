"use client";

// Storage by kind of file (FS-FILES-10), on the library's DonutChart: the palette, a table view of
// the same numbers, and sizes in the reader's language (the old chart said "MB" and "Used" in
// English whatever the language).
import * as React from "react";
import { useTranslations } from "next-intl";
import { DonutChart } from "@orgtik/ui/charts";
import { useDashboardOverviewQuery } from "@/redux/features/file/fileApi";

const KINDS = ["documents", "images", "videos", "other"] as const;

export function ChartPieDonutText() {
  const t = useTranslations("Common");
  const td = useTranslations("Dashboard");
  const { data, isLoading, isError, refetch } = useDashboardOverviewQuery();
  const grouped = data?.data?.grouped || [];
  const chartData = React.useMemo(
    () =>
      grouped.map((item: { key: string; totalStorage: number }) => ({
        key: item.key,
        label: (KINDS as readonly string[]).includes(item.key) ? t(item.key as (typeof KINDS)[number]) : t("other"),
        value: Math.round((item.totalStorage / (1024 * 1024)) * 10) / 10,
      })),
    [grouped, t],
  );
  return (
    <DonutChart
      title={td("fileStorage")}
      loading={isLoading}
      error={isError}
      onRetry={refetch}
      data={chartData}
      totalLabel={td("usedLabel")}
      categoryLabel={td("storageType")}
      valueLabel={td("storageLabel")}
      valueFormat={{ style: "unit", unit: "megabyte", maximumFractionDigits: 1 }}
    />
  );
}
