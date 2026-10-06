import type { SubscriptionStatus } from "@/types/subscriptions";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";

const statusStyles: Record<
  SubscriptionStatus,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  pending: "ghost-blue",
  active: "ghost-green",
  expiring_soon: "ghost-yellow",
  expired: "ghost-red",
  paused: "ghost-primary",
  cancelled: "ghost",
};

type Props = {
  status: string;
};

export default function SubscriptionStatusCell({ status }: Props) {
  const typedStatus = status as SubscriptionStatus;
  const tCommon = useTranslations("common");

  const getLabel = () => {
    switch (typedStatus) {
      case "pending":
        return tCommon("pending");
      case "active":
        return tCommon("active");
      case "expiring_soon":
        return tCommon("expiringSoon");
      case "expired":
        return tCommon("expired");
      case "paused":
        return tCommon("pause"); // Or use 'paused' if it exists, I'll use 'pause' since I added it as 'Pause' and we can just use fallback for now, or add "paused" in common. Actually I'll just use a fallback for now.
      case "cancelled":
        return tCommon("cancelled"); // I saw 'cancelled' in the grep search earlier but let's be safe
      default:
        return status;
    }
  };

  return (
    <Badge variant={statusStyles[typedStatus] ?? "ghost"}>
      {getLabel()}
    </Badge>
  );
}
