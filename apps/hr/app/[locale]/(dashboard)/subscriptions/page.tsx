"use client";

import MainHeader from "@/components/layout/MainHeader";
import SubscriptionManagement from "@/components/pages/subscriptions/SubscriptionManagement";
import { SUBSCRIPTIONS_DATA, useColumns } from "./columns";
import DataTable from "@/components/shared/Table";
import { useFormatter, useTranslations } from "next-intl";

export default function SubscriptionsPage() {
  const t = useTranslations("subscriptions");
  const format = useFormatter();
  const columns = useColumns();

  return (
    <>
      <MainHeader title={t("pageTitle")}>
        <SubscriptionManagement />
      </MainHeader>

      <section className="main-padding grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          {
            title: t("stats.totalSubscription"),
            value: format.number(29),
          },
          {
            title: t("stats.totalPrice"),
            value: format.number(1000, { style: "currency", currency: "USD" }),
          },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border p-5">
            <span className="text-body text-secondary">{item.title}</span>
            <h5 className="text-title-lg font-semibold ">{item.value}</h5>
          </div>
        ))}
      </section>
      <DataTable columns={columns} data={SUBSCRIPTIONS_DATA} />
    </>
  );
}
