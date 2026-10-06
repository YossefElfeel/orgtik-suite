"use client";

// Projects by stage, in the CRM's project-status words, with a table view. It replaces the pie
// chart with eleven hex colours and English stage names (SAL-179 for the same chart on a salesperson).
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { BarChart } from "@orgtik/ui/charts";
import { useSalesStatusLabel } from "@/components/shared/SalesStatus";
import type { StatusBreakdown } from "@/types/dashboard";

const ORDER = ["pending", "confirmed", "approved", "in_progress", "testing", "completed", "rejected"];

type Props = {
  breakdown: StatusBreakdown[] | undefined;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  className?: string;
};

export default function ProjectStageChart({ breakdown, loading, error, onRetry, className }: Props) {
  const t = useTranslations("SalesHome");
  const label = useSalesStatusLabel();

  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of breakdown ?? []) {
      const s = b.status === "inProgress" ? "in_progress" : b.status;
      counts.set(s, (counts.get(s) ?? 0) + (b.count ?? 0));
    }
    const known = ORDER.filter((s) => counts.has(s));
    const other = [...counts.keys()].filter((s) => !ORDER.includes(s));
    return [...known, ...other].map((s) => ({ stage: label("project", s), count: counts.get(s) ?? 0 }));
  }, [breakdown, label]);

  return (
    <BarChart
      className={className}
      title={t("stagesTitle")}
      description={t("stagesBody")}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyText={t("stagesEmpty")}
      data={rows.some((r) => r.count) ? rows : []}
      x={{ key: "stage", label: t("stage") }}
      series={[{ key: "count", label: t("projects"), color: 3 }]}
      valueFormat={{ maximumFractionDigits: 0 }}
    />
  );
}
