"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { Badge, ConfirmDialog, IconButton } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import RewardDialog from "@/components/dialogs/loyalty/RewardDialog";
import { useDeleteLoyaltyRewardMutation } from "@/redux/features/loyalty/loyaltyApi";
import { useTeamFormat } from "@/lib/commissions";
import { isolate } from "@/lib/bidi";
import type { LoyaltyReward } from "@/types/loyalty";

/** The rewards table (admins). Edit and Delete per row; Delete asks first. */
export function useRewardColumns(baseCurrency: string, canEdit: boolean): ColumnDef<LoyaltyReward>[] {
  const t = useTranslations("Team.loyalty");
  const f = useTeamFormat();
  const [remove] = useDeleteLoyaltyRewardMutation();
  return useMemo<ColumnDef<LoyaltyReward>[]>(() => {
    const cols: ColumnDef<LoyaltyReward>[] = [
      { id: "name", header: t("colReward"), meta: { truncate: true }, cell: ({ row }) => <span dir="auto" className="font-semibold">{row.original.name}</span> },
      { id: "cost", header: t("colCost"), meta: { numeric: true }, cell: ({ row }) => t("pointsValue", { count: row.original.pointCost, points: f.number(row.original.pointCost) }) },
      { id: "discount", header: t("colDiscount"), meta: { numeric: true }, cell: ({ row }) => f.discount(row.original.discountType, row.original.discountValue, baseCurrency) },
      { id: "category", header: t("colCategory"), cell: ({ row }) => (row.original.categoryName ? <span dir="auto">{row.original.categoryName}</span> : t("anyCategory")) },
      { id: "valid", header: t("colValid"), meta: { numeric: true }, cell: ({ row }) => t("daysValue", { count: row.original.validForDays, days: f.number(row.original.validForDays) }) },
      { id: "prefix", header: t("colPrefix"), cell: ({ row }) => <bdi dir="ltr">{row.original.couponCodePrefix}</bdi> },
      { id: "redemptions", header: t("colRedemptions"), meta: { numeric: true }, cell: ({ row }) => f.number(row.original.redemptionCount ?? 0) },
      {
        id: "status",
        header: t("colStatus"),
        cell: ({ row }) => (
          <Badge tone={row.original.isActive ? "success" : "neutral"} size="sm">
            {row.original.isActive ? t("rewardOn") : t("rewardOff")}
          </Badge>
        ),
      },
    ];
    if (canEdit) {
      cols.push({
        id: "actions",
        header: () => <span className="sr-only">{t("colActions")}</span>,
        meta: { width: "1%" },
        cell: ({ row }) => (
          <span className="flex items-center justify-end gap-1">
            <RewardDialog id={row.original.id} baseCurrency={baseCurrency} trigger={<IconButton label={t("editRewardAria", { name: isolate(row.original.name) })} icon={<PencilSimple />} size="sm" />} />
            <ConfirmDialog
              trigger={<IconButton label={t("deleteRewardAria", { name: isolate(row.original.name) })} icon={<Trash />} size="sm" />}
              title={t("deleteRewardTitle", { name: isolate(row.original.name) })}
              impact={t("deleteRewardImpact")}
              irreversible
              confirmLabel={t("deleteReward")}
              onConfirm={() => remove(row.original.id).unwrap()}
            />
          </span>
        ),
      });
    }
    return cols;
  }, [t, f, baseCurrency, canEdit, remove]);
}
