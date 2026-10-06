"use client";

import type { SubscriptionDetailDto } from "@/types/subscriptions";
import { displayLocalizedText } from "@/types/subscriptions";
import MainHeader from "@/components/shared/MainHeader";
import SubscriptionStatusCell from "@/components/pages/subscriptions/SubscriptionStatusCell";
import SubscriptionPaymentCell from "@/components/pages/subscriptions/SubscriptionPaymentCell";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import SubscriptionDetailsSummary from "./SubscriptionDetailsSummary";
import SubscriptionDetailsMeta from "./SubscriptionDetailsMeta";
import SubscriptionDetailsAutoRenew from "./SubscriptionDetailsAutoRenew";
import SubscriptionInstallmentSchedule from "./SubscriptionInstallmentSchedule";
import SubscriptionPaymentHistory from "./SubscriptionPaymentHistory";
import SubscriptionDetailsActions from "./SubscriptionDetailsActions";

type Props = {
  subscription: SubscriptionDetailDto;
};

export default function SubscriptionDetails({ subscription }: Props) {
  const hasInstallments = (subscription.installments ?? []).length > 0;
  const t = useTranslations("subscriptions");
  const tCommon = useTranslations("common");

  return (
    <section className="flex flex-col gap-6">
      <MainHeader
        title={t("detailsTitle")}
        backLink={{
          href: "/subscriptions",
          label: t("backToSubscriptions"),
        }}
        subChildren={
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-secondary">
                {displayLocalizedText(subscription.projectName)} ·{" "}
                {subscription.subscriptionNumber}
              </h2>
              <SubscriptionStatusCell status={subscription.lifecycleStatus} />
              <SubscriptionPaymentCell payment={subscription.paymentStatus} />
              {hasInstallments ? (
                <Badge variant="ghost-primary" className="min-w-0">
                  {tCommon("installment")}
                </Badge>
              ) : null}
            </div>
          </div>
        }
      />

      <section className="flex flex-col gap-5 rounded-xl border border-border bg-white px-5 py-4">
        <SubscriptionDetailsSummary subscription={subscription} />
        <SubscriptionDetailsMeta subscription={subscription} />
        <SubscriptionDetailsAutoRenew
          id={subscription.id}
          autoRenew={subscription.autoRenew}
        />
      </section>

      {hasInstallments ? (
        <SubscriptionInstallmentSchedule items={subscription.installments} />
      ) : null}

      <SubscriptionPaymentHistory
        subscriptionId={subscription.id}
        items={subscription.invoices ?? []}
      />
      <SubscriptionDetailsActions subscription={subscription} />
    </section>
  );
}
