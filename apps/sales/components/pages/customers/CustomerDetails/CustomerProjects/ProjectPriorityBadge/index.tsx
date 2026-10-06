"use client";

// A project's priority, in the reader's language, with an icon so it doesn't rest on colour.
import { useTranslations } from "next-intl";
import { CaretDoubleUp, CaretDown, Equals } from "@phosphor-icons/react";
import { Badge } from "@orgtik/ui";
import type { ProjectPriority } from "@/types/customer-projects";

const LOOK = {
  high: ["danger", CaretDoubleUp],
  medium: ["warning", Equals],
  low: ["neutral", CaretDown],
} as const;

type Props = {
  priority: ProjectPriority | string | null | undefined;
  className?: string;
};

export function ProjectPriorityBadge({ priority, className }: Props) {
  const t = useTranslations("Customers.priority");
  const key = priority === "high" || priority === "low" ? priority : "medium";
  const [tone, Icon] = LOOK[key];
  return (
    <Badge tone={tone} size="sm" icon={<Icon weight="bold" />} className={className}>
      {t(key)}
    </Badge>
  );
}

export default ProjectPriorityBadge;
