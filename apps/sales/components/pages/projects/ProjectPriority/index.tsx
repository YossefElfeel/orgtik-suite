"use client";

import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Minus } from "@phosphor-icons/react";
import { Badge } from "@orgtik/ui";
import type { ProjectPriority as Priority } from "@/types/projects";

/** A project's priority in words, with an icon, never by colour alone. */
export default function ProjectPriority({ value, size = "md" }: { value: Priority | null | undefined; size?: "sm" | "md" }) {
  const t = useTranslations("Projects");
  if (!value) return null;
  const icon = value === "high" ? <ArrowUp /> : value === "low" ? <ArrowDown /> : <Minus />;
  return (
    <Badge tone={value === "high" ? "warning" : "neutral"} icon={icon} size={size}>
      {t(`priority.${value}`)}
    </Badge>
  );
}
