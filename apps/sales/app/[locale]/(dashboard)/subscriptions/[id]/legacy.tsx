"use client";

import { useParams } from "next/navigation";
import MainHeader from "@/components/shared/MainHeader";
import SubscriptionDetails from "@/components/pages/subscriptions/SubscriptionDetails";
import SubscriptionDetailsHeaderSkeleton from "@/components/pages/subscriptions/SubscriptionDetailsHeaderSkeleton";
import SubscriptionDetailsSkeleton from "@/components/pages/subscriptions/SubscriptionDetailsSkeleton";
import { useRole } from "@/hooks/useRole";
import {
  useGetAdminSubscriptionQuery,
  useGetCustomerSubscriptionQuery,
} from "@/redux/features/subscriptions/subscriptionsApi";
import { pickDisplayData } from "@/lib/api-display";
import { useTranslations } from "next-intl";

export default function SubscriptionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { isCustomer } = useRole();
  const t = useTranslations("subscriptions");
  const adminQuery = useGetAdminSubscriptionQuery(id, {
    skip: !id || isCustomer,
  });
  const customerQuery = useGetCustomerSubscriptionQuery(id, {
    skip: !id || !isCustomer,
  });
  const query = isCustomer ? customerQuery : adminQuery;
  const subscription = pickDisplayData(query.data);

  if (query.isError || (!query.isLoading && !subscription)) {
    return (
      <section className="flex flex-col gap-6">
        <MainHeader
          title={t("unavailableTitle")}
          description={t("unavailableDescription")}
          backLink={{ href: "/subscriptions", label: t("backToSubscriptions") }}
        />
      </section>
    );
  }

  if (!subscription) {
    return (
      <section className="flex flex-col gap-6">
        <MainHeader
          title={t("detailsTitle")}
          backLink={{ href: "/subscriptions", label: t("backToSubscriptions") }}
          subChildren={<SubscriptionDetailsHeaderSkeleton />}
        />
        <SubscriptionDetailsSkeleton />
      </section>
    );
  }

  return <SubscriptionDetails subscription={subscription} />;
}
