"use client";

import type { PlanListItem, PlanStatus } from "@/types/plans";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";

const statusStyles: Record<
  PlanStatus,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  active: "ghost-green",
  review: "ghost-yellow",
  hidden: "ghost-red",
};

export function resolvePlanStatus(
  plan: Pick<
    PlanListItem,
    "isActive" | "activationRequested" | "completion"
  >,
): PlanStatus {
  if (plan.isActive) return "active";
  if (plan.activationRequested || !plan.completion.isComplete) return "review";
  return "hidden";
}

type Props = {
  plan: Pick<
    PlanListItem,
    "isActive" | "activationRequested" | "completion"
  >;
};

export function PlanStatusCell({ plan }: Props) {
  const status = resolvePlanStatus(plan);
  const tCommon = useTranslations("common");
  return <Badge variant={statusStyles[status]}>{tCommon(status)}</Badge>;
}
