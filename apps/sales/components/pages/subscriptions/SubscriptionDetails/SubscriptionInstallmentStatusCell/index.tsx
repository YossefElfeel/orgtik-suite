import type { SubscriptionInstallmentStatus } from "@/types/subscriptions";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

const statusStyles: Record<
  SubscriptionInstallmentStatus,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  paid: "ghost-green",
  overdue: "ghost-red",
  pending: "ghost-yellow",
  upcoming: "ghost-blue",
};

const statusLabels: Record<SubscriptionInstallmentStatus, string> = {
  paid: "Paid",
  overdue: "Over Due",
  pending: "Pending",
  upcoming: "Upcoming",
};

type Props = {
  status: string;
};

export default function SubscriptionInstallmentStatusCell({ status }: Props) {
  const typedStatus = status as SubscriptionInstallmentStatus;
  return (
    <Badge variant={statusStyles[typedStatus] ?? "ghost"}>
      {statusLabels[typedStatus] ?? status}
    </Badge>
  );
}
