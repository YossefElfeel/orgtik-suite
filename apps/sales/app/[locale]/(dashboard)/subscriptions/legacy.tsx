"use client";

import { useMemo, useState } from "react";
import MainHeader from "@/components/shared/MainHeader";
import SearchField from "@/components/shared/SearchField";
import PillTabs from "@/components/shared/PillTabs";
import DataTable from "@/components/shared/Table";
import SubscriptionStats from "@/components/pages/subscriptions/SubscriptionStats";
import { useRole } from "@/hooks/useRole";
import {
  useGetAdminSubscriptionsQuery,
  useGetAdminSubscriptionsSummaryQuery,
  useGetCustomerSubscriptionsQuery,
  useGetCustomerSubscriptionsSummaryQuery,
} from "@/redux/features/subscriptions/subscriptionsApi";
import {
  subscriptionStatuses,
  customerSubscriptionListStatuses,
  subscriptionStatusLabels,
  type SubscriptionFilterTab,
} from "@/types/subscriptions";
import { pickDisplayData } from "@/lib/api-display";
import { useSubscriptionColumns } from "./columns";
import { useTranslations } from "next-intl";

export default function SubscriptionsPage() {
  const { isCustomer } = useRole();
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<SubscriptionFilterTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const t = useTranslations("subscriptions");
  const tCommon = useTranslations("common");
  const subscriptionColumns = useSubscriptionColumns();

  const listStatuses = isCustomer
    ? customerSubscriptionListStatuses
    : subscriptionStatuses;
  const pagination = {
    page: currentPage,
    limit,
    search: search || undefined,
    status: statusTab === "all" ? undefined : statusTab,
  };

  const adminList = useGetAdminSubscriptionsQuery(pagination, {
    skip: isCustomer,
  });
  const customerList = useGetCustomerSubscriptionsQuery(pagination, {
    skip: !isCustomer,
  });
  const adminSummary = useGetAdminSubscriptionsSummaryQuery(undefined, {
    skip: isCustomer,
  });
  const customerSummary = useGetCustomerSubscriptionsSummaryQuery(undefined, {
    skip: !isCustomer,
  });

  const listQuery = isCustomer ? customerList : adminList;
  const listPayload = pickDisplayData(listQuery.data);
  const subscriptions = listPayload?.items ?? [];
  const meta = listPayload?.meta;

  const filterTabs = useMemo(
    () => [
      { id: "all", label: tCommon("all") },
      ...listStatuses.map((item) => ({
        id: item,
        label: t(`status${item.charAt(0).toUpperCase() + item.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())}`),
      })),
    ],
    [listStatuses],
  );

  return (
    <section className="flex flex-col gap-6">
      <MainHeader
        title={t("title")}
        description={
          isCustomer
            ? t("descriptionCustomer")
            : t("descriptionStaff")
        }
      />

      <SubscriptionStats
        stats={adminSummary.data?.data}
        customerStats={customerSummary.data?.data}
        isLoading={
          isCustomer ? customerSummary.isFetching : adminSummary.isFetching
        }
      />

      <div className="space-y-5">
        <SearchField
          search={{
            placeholder: t("searchPlaceholder"),
            setSearchValue: (value) => {
              setSearch(value);
              setCurrentPage(1);
            },
          }}
        />

        <PillTabs
          items={filterTabs}
          value={statusTab}
          onValueChange={(id) => {
            setStatusTab(id as SubscriptionFilterTab);
            setCurrentPage(1);
          }}
          equalWidth={false}
          size="sm"
          ariaLabel={t("subscriptionStatusFilters")}
          navClassName="bg-white"
        />

        <DataTable
          columns={subscriptionColumns}
          data={subscriptions}
          isLoading={listQuery.isFetching}
          pagination={{
            currentPage: meta?.page ?? currentPage,
            totalPages: meta?.totalPages ?? 1,
            limit: meta?.limit ?? limit,
            totalItems: meta?.total ?? 0,
            onPageChange: setCurrentPage,
            onLimitChange: (nextLimit) => {
              setLimit(nextLimit);
              setCurrentPage(1);
            },
          }}
        />
      </div>
    </section>
  );
}
