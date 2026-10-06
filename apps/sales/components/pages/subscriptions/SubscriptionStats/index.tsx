"use client";

import type {
  AdminSubscriptionsSummaryDto,
  CustomerSubscriptionsSummaryDto,
} from "@/types/subscriptions";
import type { ZoneMoneyGroup } from "@/types/money";
import { StatsCards, type StatItem } from "@/components/shared/StatCard";
import ZoneMoneyStack from "@/components/shared/ZoneMoneyStack";
import { useRole } from "@/hooks/useRole";
import { formatShortDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type Props = {
  stats?: AdminSubscriptionsSummaryDto;
  customerStats?: CustomerSubscriptionsSummaryDto;
  isLoading?: boolean;
};

function StatsSkeleton({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
          className="flex min-h-[140px] flex-col gap-4 rounded-2xl  px-5 py-4"
        >
          <div
            style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
            className="h-6 w-32 animate-pulse rounded-md bg-muted-foreground"
          />
          <div
            style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
            className="h-10 w-24 animate-pulse rounded-md bg-muted-foreground"
          />
        </div>
      ))}
    </div>
  );
}

function moneyStackValue(groups: ZoneMoneyGroup[] | null | undefined): ReactNode {
  return (
    <ZoneMoneyStack
      groups={groups}
      amountClassName="text-inherit text-2xl font-medium"
      className="w-full"
    />
  );
}

export default function SubscriptionStats({
  stats,
  customerStats,
  isLoading = false,
}: Props) {
  const { isCustomer } = useRole();
  const tDashboard = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tSub = useTranslations("subscriptions");

  if (isCustomer) {
    if (isLoading || !customerStats) {
      return <StatsSkeleton count={6} className="lg:grid-cols-3" />;
    }

    const nextPaymentLabel = customerStats.nextInstallmentPayment
      ? formatShortDate(customerStats.nextInstallmentPayment)
      : "—";

    const items: StatItem[] = [
      {
        id: "total-subscriptions",
        label: tDashboard("totalSubscriptions"),
        value: customerStats.totalSubscriptions,
        variant: "primary",
      },
      {
        id: "total-cost",
        label: tDashboard("totalCost"),
        value: moneyStackValue(customerStats.totalCost),
      },
      {
        id: "paid-subscriptions",
        label: tDashboard("paidSubscriptions"),
        value: customerStats.paidSubscriptions,
      },
      {
        id: "pending-payments",
        label: tDashboard("pendingPayments"),
        value: moneyStackValue(customerStats.pendingPayments),
      },
      {
        id: "installment-plans",
        label: tDashboard("installmentPlans"),
        value: customerStats.installmentPlans,
      },
      {
        id: "next-installment-payment",
        label: tDashboard("nextInstallmentPayment"),
        value: nextPaymentLabel,
      },
    ];

    return (
      <StatsCards
        stats={items}
        className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      />
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col gap-4">
        <StatsSkeleton count={4} />
        <StatsSkeleton count={4} />
      </div>
    );
  }

  const countStats: StatItem[] = [
    {
      id: "total-subscriptions",
      label: tDashboard("totalSubscriptions"),
      value: stats.totalSubscriptions,
      variant: "primary",
    },
    {
      id: "active",
      label: tSub("activeSubscriptions"),
      value: stats.activeSubscriptions,
    },
    {
      id: "expiring",
      label: tSub("expiringSoon"),
      value: stats.expiringSoon,
    },
    {
      id: "expired",
      label: tSub("expiredSubscriptions"),
      value: stats.expiredSubscriptions,
    },
  ];

  const moneyStats: StatItem[] = [
    {
      id: "total-value",
      label: tSub("totalValue"),
      value: moneyStackValue(stats.totalValue),
    },
    {
      id: "paid",
      label: tCommon("paid"),
      value: moneyStackValue(stats.paidAmount),
    },
    {
      id: "pending",
      label: tCommon("pending"),
      value: moneyStackValue(stats.pendingPayments),
    },
    {
      id: "cancelled",
      label: tSub("cancelledSubscriptions"),
      value: stats.cancelled,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <StatsCards
        stats={countStats}
        className="sm:grid-cols-2 lg:grid-cols-4"
      />
      <StatsCards
        stats={moneyStats}
        className="sm:grid-cols-2 lg:grid-cols-4"
      />
    </div>
  );
}
