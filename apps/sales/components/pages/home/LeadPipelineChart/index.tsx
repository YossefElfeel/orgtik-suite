"use client";

// Leads by stage of the D-028 pipeline, in the library's lead-status words, with a table view. It
// replaces the "qualified vs unqualified" radial chart, which had no text alternative.
// "Scheduled" isn't a stage any more (it's a meeting), so its leads count as contacted, as
// <LeadStatus> shows them. Stages the API doesn't report aren't drawn as zero.
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useStatusLabel } from "@orgtik/ui";
import { BarChart } from "@orgtik/ui/charts";
import { leadStates, type LeadState } from "@/components/shared/SalesStatus";
import type { StatusBreakdown } from "@/types/dashboard";

type Props = {
  breakdown: StatusBreakdown[] | undefined;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  className?: string;
};

export default function LeadPipelineChart({ breakdown, loading, error, onRetry, className }: Props) {
  const t = useTranslations("SalesHome");
  const label = useStatusLabel();

  const rows = useMemo(() => {
    const counts = new Map<LeadState, number>();
    for (const b of breakdown ?? []) {
      const s = (b.status === "scheduled" ? "contacted" : b.status) as LeadState;
      if (!(leadStates as readonly string[]).includes(s)) continue;
      counts.set(s, (counts.get(s) ?? 0) + (b.count ?? 0));
    }
    return leadStates.filter((s) => counts.has(s)).map((s) => ({ stage: label("lead", s), count: counts.get(s) ?? 0 }));
  }, [breakdown, label]);

  return (
    <BarChart
      layout="rows"
      className={className}
      title={t("pipelineTitle")}
      description={t("pipelineBody")}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyText={t("pipelineEmpty")}
      data={rows.some((r) => r.count) ? rows : []}
      x={{ key: "stage", label: t("stage") }}
      series={[{ key: "count", label: t("leads"), color: 1 }]}
      valueFormat={{ maximumFractionDigits: 0 }}
    />
  );
}
