"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { SubscriptionListItemDto } from "@/types/subscriptions";
import { displayLocalizedText } from "@/types/subscriptions";
import { formatShortDate } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import SubscriptionStatusCell from "@/components/pages/subscriptions/SubscriptionStatusCell";
import SubscriptionPaymentCell from "@/components/pages/subscriptions/SubscriptionPaymentCell";
import SubscriptionPlanCell from "@/components/pages/subscriptions/SubscriptionPlanCell";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

function SubscriptionActions({
  subscription,
}: {
  subscription: SubscriptionListItemDto;
}) {
  const tCommon = useTranslations("common");
  return (
    <div className="flex items-center justify-center gap-1.5">
      <Button
        type="button"
        variant="ghost-primary"
        size="icon"
        aria-label={tCommon("viewDetails")}
        icon="solar:eye-linear"
        nativeButton={false}
        render={<Link href={`/subscriptions/${subscription.id}`} />}
      />
    </div>
  );
}

export function useSubscriptionColumns(): ColumnDef<SubscriptionListItemDto>[] {
  const t = useTranslations("subscriptions");

  return useMemo(() => [
    {
      accessorKey: "projectName",
      header: t("columnProjectName"),
      cell: ({ row }) => (
        <span
          className="block max-w-44 truncate"
          title={row.original.projectName}
        >
          {row.original.projectName}
        </span>
      ),
    },
    {
      accessorKey: "planName",
      header: t("columnPlan"),
      cell: ({ row }) => (
        <SubscriptionPlanCell plan={displayLocalizedText(row.original.planName)} />
      ),
    },
    {
      accessorKey: "totalPrice",
      header: t("columnTotal"),
      cell: ({ row }) => row.original.totalPrice,
    },
    {
      accessorKey: "status",
      header: t("columnStatus"),
      cell: ({ row }) => <SubscriptionStatusCell status={row.original.status} />,
    },
    {
      accessorKey: "paymentStatus",
      header: t("columnPayment"),
      cell: ({ row }) => (
        <SubscriptionPaymentCell payment={row.original.paymentStatus} />
      ),
    },
    {
      accessorKey: "endDate",
      header: t("columnEnds"),
      cell: ({ row }) =>
        row.original.endDate ? formatShortDate(row.original.endDate) : "—",
    },
    {
      id: "actions",
      header: t("columnActions"),
      cell: ({ row }) => <SubscriptionActions subscription={row.original} />,
    },
  ], [t]);
}
