"use client";
import { useTranslations } from "next-intl";
import { Flag } from "@phosphor-icons/react";
import { Badge, type Tone } from "@orgtik/ui";

export type IPriority = "high" | "medium" | "low" | "urgent";
export type BadgeSize = "xs" | "sm" | "md" | "lg";

// One tone per priority, in words too (colour is never the only signal). The old badge used four
// palette colours and English labels.
const TONE: Record<IPriority, Tone> = { urgent: "danger", high: "warning", medium: "info", low: "neutral" };

function PriorityBadge({ priority, size = "md", className }: { priority: IPriority; size?: BadgeSize; className?: string }) {
  const t = useTranslations("Priority");
  if (!TONE[priority]) return null;
  return (
    <Badge tone={TONE[priority]} emphasis="subtle" size={size === "md" || size === "lg" ? "md" : "sm"} icon={<Flag weight="fill" />} className={className}>
      {t(priority)}
    </Badge>
  );
}

export default PriorityBadge;
