import type { SubscriptionDetailDto } from "@/types/subscriptions";
import { Badge } from "@/components/ui/badge";
import { DetailField } from "@/components/shared/SectionCard";
import { formatShortDate } from "@/lib/format-date";
import { useTranslations } from "next-intl";

function getDaysAgoLabel(dateStr: string | null, tSub: any) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days <= 0) return null;
  return tSub("daysAgoLabel", { days });
}

type Props = {
  subscription: SubscriptionDetailDto;
};

export default function SubscriptionDetailsMeta({ subscription }: Props) {
  const tCommon = useTranslations("common");
  const tSub = useTranslations("subscriptions");

  const installments = subscription.installments ?? [];
  const endAgoLabel =
    subscription.lifecycleStatus === "expired"
      ? getDaysAgoLabel(subscription.endDate, tSub)
      : null;
  const paymentMethod = installments.length
    ? tCommon("installment")
    : subscription.invoices.find((invoice) => invoice.paymentMethod)
        ?.paymentMethod;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <DetailField label={tCommon("startDate")}>
        {formatShortDate(subscription.startDate)}
      </DetailField>

      <DetailField label={tCommon("endDate")}>
        <div className="flex flex-wrap items-center gap-2">
          <span>
            {subscription.endDate
              ? formatShortDate(subscription.endDate)
              : "—"}
          </span>
          {endAgoLabel ? (
            <Badge variant="ghost-red" className="min-w-0">
              {endAgoLabel}
            </Badge>
          ) : null}
        </div>
      </DetailField>

      <DetailField label={tCommon("paymentMethod")}>
        {paymentMethod || "—"}
      </DetailField>

      {installments.length > 0 ? (
        <DetailField label={tCommon("installment")}>
          {tSub("monthsProgress", {
            paid: installments.filter((item) => item.status === "paid").length,
            total: installments.length
          })}
        </DetailField>
      ) : (
        <DetailField label={tCommon("duration")}>
          {subscription.daysLeft == null
            ? "—"
            : tSub("daysLeft", { days: subscription.daysLeft })}
        </DetailField>
      )}
    </div>
  );
}
