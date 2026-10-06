"use client";

import { useTranslations } from "next-intl";
import { Badge, type Tone } from "@orgtik/ui";
import type { PlanStatus } from "@/store/catalog";

const TONE: Record<PlanStatus, Tone> = { draft: "neutral", active: "success", archived: "warning" };

/** A plan's status (ADM-07: draft, active, archived). Not in the status matrix: tone and words. */
export function PlanStatusBadge({ status }: { status: PlanStatus }) {
  const t = useTranslations("Catalog.plans.status");
  return (
    <Badge size="sm" tone={TONE[status] ?? "neutral"}>
      {t(status)}
    </Badge>
  );
}
