"use client";

import { useTranslations } from "next-intl";
import { Badge, type Tone } from "@orgtik/ui";
import type { SalesmanPerformanceLabel } from "@/types/salesman";

const TONES: Record<SalesmanPerformanceLabel, Tone> = {
  top_performance: "success",
  on_track: "info",
  under_performance: "warning",
  inactive: "neutral",
};

/** How a salesperson is doing, in words (the old cell was an English-only listbox: SAL-114). */
export default function PerformanceBadge({ value }: { value: SalesmanPerformanceLabel | null | undefined }) {
  const t = useTranslations("Team.salespeople");
  if (!value || !(value in TONES)) return <span className="text-fg-subtle">—</span>;
  return (
    <Badge tone={TONES[value]} size="sm">
      {t(`performance.${value}`)}
    </Badge>
  );
}
