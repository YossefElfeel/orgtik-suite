"use client";

import type {
  InvoiceStats as InvoiceStatsData,
} from "@/types/invoices";
import { StatsCards, type StatItem } from "@/components/shared/StatCard";
import ZoneMoneyStack from "@/components/shared/ZoneMoneyStack";
import { useRole } from "@/hooks/useRole";
import Skeleton from "@/components/shared/Skeleton";
import { useTranslations } from "next-intl";

type Props = {
  stats?: InvoiceStatsData;
  isLoading?: boolean;
};

export default function InvoiceStats({ stats, isLoading = false }: Props) {
  const { isCustomer } = useRole();
  const t = useTranslations("invoices");

  if (isLoading || !stats) {
    const count = isCustomer ? 4 : 5;

    return (
      <div className="flex flex-col gap-4">
        <div
          className={
            isCustomer
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
              : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4"
          }
        >
          {Array.from({ length: count }).map((_, index) => (
            <Skeleton key={index} className="min-h-[140px] w-full rounded-2xl" />
          ))}
        </div>
        {isCustomer ? null : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <Skeleton className="min-h-[140px] w-full rounded-2xl" />
            <Skeleton className="min-h-[140px] w-full rounded-2xl" />
          </div>
        )}
      </div>
    );
  }

  if (isCustomer) {
    const items: StatItem[] = [
      {
        id: "total-invoices",
        label: t("totalInvoices"),
        value: stats.totalInvoices,
        variant: "primary",
      },
      {
        id: "total-amount",
        label: t("totalAmount"),
        value: (
          <ZoneMoneyStack
            groups={stats.totalRevenue}
            amountClassName="text-inherit text-2xl font-medium"
            className="w-full"
          />
        ),
      },
      {
        id: "paid",
        label: t("statusPaid"),
        value: stats.paidSubscriptions,
      },
      {
        id: "installment-plans",
        label: t("openSubscriptions"),
        value: stats.pendingSubscriptions + stats.overdueSubscriptions,
      },
    ];

    return (
      <StatsCards
        stats={items}
        className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      />
    );
  }

  const countStats: StatItem[] = [
    {
      id: "total-invoices",
      label: t("totalInvoices"),
      value: stats.totalInvoices,
      variant: "primary",
    },
    {
      id: "paid-subscriptions",
      label: t("paidSubscriptions"),
      value: stats.paidSubscriptions,
    },
    {
      id: "pending-subscriptions",
      label: t("pendingSubscriptions"),
      value: stats.pendingSubscriptions,
    },
    {
      id: "overdue-subscriptions",
      label: t("overdueSubscriptions"),
      value: stats.overdueSubscriptions,
    },
    {
      id: "void-subscriptions",
      label: t("voidSubscriptions"),
      value: stats.voidSubscriptions,
    },
  ];

  const moneyStats: StatItem[] = [
    {
      id: "total-revenue",
      label: t("totalRevenue"),
      value: (
        <ZoneMoneyStack
          groups={stats.totalRevenue}
          amountClassName="text-inherit text-2xl font-medium"
          className="w-full"
        />
      ),
    },
    {
      id: "total-commission",
      label: t("totalCommission"),
      value: (
        <ZoneMoneyStack
          groups={stats.totalCommissions}
          amountClassName="text-inherit text-2xl font-medium"
          className="w-full"
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <StatsCards stats={countStats} />
      <StatsCards
        stats={moneyStats}
        className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
      />
    </div>
  );
}
