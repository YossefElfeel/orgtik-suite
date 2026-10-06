"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ICoupon } from "@/types/coupons";
import { CouponStatusCell } from "@/components/pages/coupons/CouponStatusCell";
import {
  ActionCell,
  ActionItem,
} from "@/components/shared/Table/cell/ActionCell";
import { DeleteDialog } from "@/components/dialogs/shared/DeleteDialog";
import { ShareCouponDialog } from "@/components/dialogs/coupons/ShareCouponDialog";
import CreateUpdateCouponDialog from "@/components/dialogs/coupons/CreateUpdateCouponDialog";
import { CopyCouponAction } from "@/components/pages/coupons/CopyCouponAction";
import CurrencyAmount from "@/components/shared/CurrencyAmount";
import { formatDate } from "@/lib/format-date";
import { useRole } from "@/hooks/useRole";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
type ColumnCallbacks = {
  categoryMap: Record<string, string>;
  onDelete: (id: string) => void;
};

function formatDiscount(coupon: ICoupon) {
  if (coupon.discountType === "percentage") {
    return `${parseFloat(coupon.discountValue)}%`;
  }
  return <CurrencyAmount amount={parseFloat(coupon.discountValue)} />;
}

function ActionsCellWrapper({ row, onDelete }: { row: any; onDelete: (id: string) => void }) {
  const { isSalesman } = useRole();
  const tCommon = useTranslations("common");
  const t = useTranslations("coupons");
  return (
    <ActionCell>
      <CopyCouponAction code={row.original.code} />
      <ShareCouponDialog
        id={row.original.id}
        code={row.original.code}
        trigger={<ActionItem icon="solar:share-linear" label={tCommon("share", { fallback: "Share" })} />}
      />
      
      {!isSalesman && (
        <>
          <CreateUpdateCouponDialog
            id={row.original.id}
            trigger={<ActionItem icon="solar:pen-linear" label={tCommon("edit", { fallback: "Edit" })} />}
          />
          <DeleteDialog
            title={t("deleteCoupon", { code: row.original.code })}
            onConfirm={() => onDelete(row.original.id)}
            trigger={
              <ActionItem
                icon="solar:trash-bin-trash-linear"
                label={tCommon("delete", { fallback: "Delete" })}
                destructive
              />
            }
          />
        </>
      )}
    </ActionCell>
  );
}

export function useCouponColumns({
  categoryMap,
  onDelete,
}: ColumnCallbacks): ColumnDef<ICoupon>[] {
  const t = useTranslations("coupons");
  const tCommon = useTranslations("common");

  return useMemo(() => [
  {
    accessorKey: "code",
    header: t("columnCode"),
    cell: ({ row }) => (
      <span className="font-semibold">{row.original.code}</span>
    ),
  },
  {
    accessorKey: "categoryId",
    header: t("columnCategory"),
    cell: ({ row }) => {
      const catId = row.original.categoryId;
      return categoryMap[catId] || catId;
    },
  },
  {
    id: "discount",
    header: t("columnAmountPercentage"),
    cell: ({ row }) => formatDiscount(row.original),
  },
  {
    id: "usageLimit",
    header: t("columnUsageLimit"),
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.usageCount}/{row.original.usageLimit ?? "∞"}
      </span>
    ),
  },
  {
    id: "perUserLimit",
    header: t("columnPerUser"),
    cell: ({ row }) => {
      if (!row.original.hasPerUserLimit || !row.original.perUserLimit) {
        return tCommon("unlimited", { fallback: "Unlimited" });
      }
      return `${row.original.perUserLimit} ${
        row.original.perUserLimit === 1 ? tCommon("time", { fallback: "time" }) : tCommon("times", { fallback: "times" })
      }`;
    },
  },
  {
    accessorKey: "status",
    header: t("columnStatus"),
    cell: ({ row }) => <CouponStatusCell status={row.original.status} />,
  },
  {
    accessorKey: "startDate",
    header: t("columnStartDate"),
    cell: ({ row }) => formatDate(row.original.startDate),
  },
  {
    accessorKey: "endDate",
    header: t("columnEndDate"),
    cell: ({ row }) => formatDate(row.original.endDate),
  },
  {
    id: "actions",
    header: t("columnActions"),
    cell: ({ row }) => <ActionsCellWrapper row={row} onDelete={onDelete} />,
  },
  ], [categoryMap, onDelete, t, tCommon]);
}

