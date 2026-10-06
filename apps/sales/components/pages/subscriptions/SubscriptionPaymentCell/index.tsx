import type { SubscriptionPaymentStatus } from "@/types/subscriptions";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";

const paymentStyles: Record<
  SubscriptionPaymentStatus,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  paid: "ghost-green",
  unpaid: "ghost-yellow",
  partially_paid: "ghost-blue",
  partial_paid: "ghost-blue",
  pending: "ghost-yellow",
  overdue: "ghost-red",
  refunded: "ghost",
};

type Props = {
  payment: string;
};

export default function SubscriptionPaymentCell({ payment }: Props) {
  const typedPayment = payment as SubscriptionPaymentStatus;
  const tCommon = useTranslations("common");

  const getLabel = () => {
    switch (typedPayment) {
      case "paid":
        return tCommon("paid");
      case "unpaid":
        return tCommon("unpaid");
      case "partially_paid":
      case "partial_paid":
        return tCommon("partiallyPaid");
      case "pending":
        return tCommon("pending");
      case "overdue":
        return tCommon("overdue");
      case "refunded":
        return tCommon("refunded");
      default:
        return payment;
    }
  };

  return (
    <Badge variant={paymentStyles[typedPayment] ?? "ghost-yellow"}>
      {getLabel()}
    </Badge>
  );
}
