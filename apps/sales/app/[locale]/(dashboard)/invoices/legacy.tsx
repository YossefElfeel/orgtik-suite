"use client";

import { useMemo, useState } from "react";
import MainHeader from "@/components/shared/MainHeader";
import SearchField from "@/components/shared/SearchField";
import { Filters } from "@/components/shared/Filters";
import DataTable from "@/components/shared/Table";
import PillTabs from "@/components/shared/PillTabs";
import { SectionCard } from "@/components/shared/SectionCard";
import InvoiceStats from "@/components/pages/invoices/InvoiceStats";
import { Button } from "@/components/ui/button";
import CreateInvoiceDialog from "@/components/dialogs/invoices/CreateInvoiceDialog";
import CreateCustomInvoiceDialog from "@/components/dialogs/invoices/CreateCustomInvoiceDialog";
import { useRole } from "@/hooks/useRole";
import type {
  AdminInvoiceTab,
  CustomInvoiceStatus,
  InvoiceStatus,
  InvoiceType,
} from "@/types/invoices";
import {
  useGetCustomInvoicesQuery,
  useGetInvoiceStatusSummaryQuery,
  useGetInvoiceTableCountsQuery,
  useGetInvoicesQuery,
} from "@/redux/features/invoices/invoicesApi";
import { pickDisplayData } from "@/lib/api-display";
import {
  useCustomerInvoiceColumns,
  useCustomInvoiceColumns,
  useSalesInvoiceColumns,
  useSubscriptionInvoiceColumns,
} from "./columns";
import { useTranslations } from "next-intl";

export default function InvoicesPage() {
  const { isCustomer, isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState<AdminInvoiceTab>("subscription");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>();
  const [customStatus, setCustomStatus] = useState<CustomInvoiceStatus>();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const statusOptions: { id: InvoiceStatus; label: string }[] = useMemo(
    () => [
      { id: "paid", label: t("statusPaid") },
      { id: "partial", label: t("statusPartial") },
      { id: "pending", label: t("statusPending") },
      { id: "overdue", label: t("statusOverdue") },
      { id: "void", label: t("statusVoid") },
    ],
    [t],
  );

  const customStatusOptions: { id: CustomInvoiceStatus; label: string }[] =
    useMemo(
      () => [
        { id: "paid", label: t("statusPaid") },
        { id: "pending", label: t("statusPending") },
        { id: "overdue", label: t("statusOverdue") },
      ],
      [t],
    );

  const isCustomTab = activeTab === "custom";
  const invoiceType: InvoiceType = isCustomer
    ? "subscription"
    : isCustomTab
      ? "subscription"
      : activeTab;

  const { data: statusResponse, isFetching: isStatusLoading } =
    useGetInvoiceStatusSummaryQuery(undefined, { skip: isCustomTab });
  const { data: tableCountsResponse } = useGetInvoiceTableCountsQuery(
    undefined,
    { skip: isCustomer },
  );
  const { data: listResponse, isFetching: isListLoading } = useGetInvoicesQuery(
    {
      type: invoiceType,
      page: currentPage,
      limit,
      q: search || undefined,
    },
    { skip: isCustomer || isCustomTab },
  );
  const {
    data: customListResponse,
    isFetching: isCustomListLoading,
    refetch: refetchCustomInvoices,
  } = useGetCustomInvoicesQuery(
    {
      page: currentPage,
      limit,
      search: search || undefined,
    },
    { skip: isCustomer || !isCustomTab },
  );

  const stats = pickDisplayData(statusResponse);
  const listPayload = pickDisplayData(listResponse);
  const meta = listPayload?.meta;
  const items = listPayload?.items ?? [];
  const customPayload = pickDisplayData(customListResponse);
  const customMeta = customPayload?.meta;
  const customItems = customPayload?.items ?? [];
  const tableCounts = tableCountsResponse?.data;

  const filteredItems = useMemo(() => {
    if (!status) return items;
    return items.filter((invoice) => invoice.status === status);
  }, [items, status]);

  const filteredCustomItems = useMemo(() => {
    if (!customStatus) return customItems;
    return customItems.filter((invoice) => invoice.status === customStatus);
  }, [customItems, customStatus]);

  const subscriptionInvoices = useMemo(
    () =>
      filteredItems.filter(
        (
          invoice,
        ): invoice is Extract<
          (typeof filteredItems)[number],
          { type: "subscription" }
        > => invoice.type === "subscription",
      ),
    [filteredItems],
  );

  const salesInvoices = useMemo(
    () =>
      filteredItems.filter(
        (
          invoice,
        ): invoice is Extract<
          (typeof filteredItems)[number],
          { type: "salesman" }
        > => invoice.type === "salesman",
      ),
    [filteredItems],
  );

  const customerInvoiceColumns = useCustomerInvoiceColumns();
  const subscriptionInvoiceColumns = useSubscriptionInvoiceColumns();
  const salesInvoiceColumns = useSalesInvoiceColumns();

  const customInvoiceColumns = useCustomInvoiceColumns();

  const resetPaging = () => setCurrentPage(1);

  const standardPagination = {
    currentPage: meta?.page ?? currentPage,
    totalPages: meta?.totalPages ?? 1,
    limit: meta?.limit ?? limit,
    totalItems: meta?.total ?? 0,
    onPageChange: setCurrentPage,
    onLimitChange: (nextLimit: number) => {
      setLimit(nextLimit);
      resetPaging();
    },
  };

  const customPagination = {
    currentPage: customMeta?.page ?? currentPage,
    totalPages: customMeta?.totalPages ?? 1,
    limit: customMeta?.limit ?? limit,
    totalItems: customMeta?.total ?? 0,
    onPageChange: setCurrentPage,
    onLimitChange: (nextLimit: number) => {
      setLimit(nextLimit);
      resetPaging();
    },
  };

  const adminTabs = [
    {
      id: "subscription" as const,
      label: t("tabSubscriptions"),
      count: tableCounts?.subscriptions ?? meta?.subscriptionTotal,
    },
    {
      id: "salesman" as const,
      label: t("tabSalesMan"),
      count: tableCounts?.salesMan ?? meta?.salesmanTotal,
    },
    ...(isAdmin
      ? [
          {
            id: "custom" as const,
            label: t("tabCustomInvoices"),
            count: tableCounts?.customInvoices,
          },
        ]
      : []),
  ];

  return (
    <section className="flex flex-col gap-6">
      <MainHeader
        title={t("title")}
        description={
          isCustomer ? t("descriptionCustomer") : t("descriptionStaff")
        }
      >
        {isCustomer ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <CreateInvoiceDialog
              trigger={
                <Button icon="solar:add-circle-linear">
                  {t("createInvoice")}
                </Button>
              }
            />
            {isAdmin ? (
              <CreateCustomInvoiceDialog
                onSuccess={() => {
                  if (isCustomTab) {
                    void refetchCustomInvoices();
                  }
                }}
                trigger={
                  <Button variant="outline" icon="solar:document-add-linear">
                    {t("createCustomInvoice")}
                  </Button>
                }
              />
            ) : null}
          </div>
        )}
      </MainHeader>

      {!isCustomTab ? (
        <InvoiceStats stats={stats} isLoading={isStatusLoading} />
      ) : null}

      {isCustomer ? (
        <SectionCard title={t("title")}>
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <SearchField
                search={{
                  placeholder: t("searchSubscription"),
                  setSearchValue: (value) => {
                    setSearch(value);
                    resetPaging();
                  },
                }}
              />
              <Filters
                options={statusOptions}
                selectedId={status}
                onSelectedChange={(id) => {
                  setStatus(id as InvoiceStatus | undefined);
                  resetPaging();
                }}
                triggerLabel={
                  status
                    ? tCommon("filterSelected", {
                        filter: tCommon("status"),
                        value:
                          statusOptions.find((o) => o.id === status)?.label ??
                          "",
                      })
                    : tCommon("filterAll", { filter: tCommon("status") })
                }
              />
            </div>

            <DataTable
              columns={customerInvoiceColumns}
              data={subscriptionInvoices}
              isLoading={isListLoading}
              pagination={standardPagination}
            />
          </div>
        </SectionCard>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SearchField
              search={{
                placeholder: isCustomTab
                  ? t("searchCustom")
                  : t("searchSubscription"),
                setSearchValue: (value) => {
                  setSearch(value);
                  resetPaging();
                },
              }}
            />
            {isCustomTab ? (
              <Filters
                options={customStatusOptions}
                selectedId={customStatus}
                onSelectedChange={(id) => {
                  setCustomStatus(id as CustomInvoiceStatus | undefined);
                  resetPaging();
                }}
                triggerLabel={
                  customStatus
                    ? tCommon("filterSelected", {
                        filter: tCommon("status"),
                        value:
                          customStatusOptions.find((o) => o.id === customStatus)
                            ?.label ?? "",
                      })
                    : tCommon("filterAll", { filter: tCommon("status") })
                }
              />
            ) : (
              <Filters
                options={statusOptions}
                selectedId={status}
                onSelectedChange={(id) => {
                  setStatus(id as InvoiceStatus | undefined);
                  resetPaging();
                }}
                triggerLabel={
                  status
                    ? tCommon("filterSelected", {
                        filter: tCommon("status"),
                        value:
                          statusOptions.find((o) => o.id === status)?.label ??
                          "",
                      })
                    : tCommon("filterAll", { filter: tCommon("status") })
                }
              />
            )}
          </div>

          <PillTabs
            items={adminTabs}
            value={activeTab}
            onValueChange={(id) => {
              setActiveTab(id as AdminInvoiceTab);
              setStatus(undefined);
              setCustomStatus(undefined);
              resetPaging();
            }}
            equalWidth={false}
            size="sm"
            ariaLabel={t("invoiceTypes")}
          />

          {activeTab === "subscription" ? (
            <DataTable
              columns={subscriptionInvoiceColumns}
              data={subscriptionInvoices}
              isLoading={isListLoading}
              pagination={standardPagination}
            />
          ) : null}

          {activeTab === "salesman" ? (
            <DataTable
              columns={salesInvoiceColumns}
              data={salesInvoices}
              isLoading={isListLoading}
              pagination={standardPagination}
            />
          ) : null}

          {activeTab === "custom" ? (
            <DataTable
              columns={customInvoiceColumns}
              data={filteredCustomItems}
              isLoading={isCustomListLoading}
              pagination={customPagination}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
