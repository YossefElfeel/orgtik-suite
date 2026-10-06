"use client";

import type { CouponStatus } from "@/types/coupons";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { VariantProps } from "class-variance-authority";

const statusStyles: Record<
  CouponStatus,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  upcoming_soon: "ghost-yellow",
  active: "ghost-green",
  expired_soon: "ghost-primary",
  expired: "ghost-red",
  exhausted: "ghost-red",
};

const statusLabels: Record<CouponStatus, string> = {
  upcoming_soon: "Upcoming Soon",
  active: "Active",
  expired_soon: "Expired Soon",
  expired: "Expired",
  exhausted: "Exhausted",
};

type Props = {
  status: CouponStatus;
};

export function CouponStatusCell({ status }: Props) {
  return (
    <Badge variant={statusStyles[status]}>{statusLabels[status]}</Badge>
  );
}
