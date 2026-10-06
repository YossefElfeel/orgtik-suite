"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Copy } from "@phosphor-icons/react";
import { Badge, IconButton, toast, type Tone } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { useTeamFormat } from "@/lib/commissions";
import type { CustomerLoyaltyCouponStatus, LoyaltyMeCoupon } from "@/types/loyalty";

const TONES: Record<CustomerLoyaltyCouponStatus, Tone> = { active: "success", used: "neutral", expired: "warning" };

/** The customer's reward coupons: the code (with copy), what it gives, until when, and its state. */
export function useCouponColumns(baseCurrency: string): ColumnDef<LoyaltyMeCoupon>[] {
  const t = useTranslations("Team.loyalty");
  const f = useTeamFormat();
  return useMemo<ColumnDef<LoyaltyMeCoupon>[]>(
    () => [
      {
        id: "code",
        header: t("colCode"),
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1">
            <bdi dir="ltr" className="font-mono font-semibold">
              {row.original.couponCode}
            </bdi>
            {row.original.status === "active" ? (
              <IconButton
                size="sm"
                label={t("copyCodeAria", { code: row.original.couponCode })}
                icon={<Copy />}
                onClick={() => {
                  navigator.clipboard.writeText(row.original.couponCode).then(
                    () => toast.success(t("copied")),
                    () => toast.error(t("copyFailed")),
                  );
                }}
              />
            ) : null}
          </span>
        ),
      },
      { id: "reward", header: t("colReward"), meta: { truncate: true }, cell: ({ row }) => <span dir="auto">{row.original.rewardName}</span> },
      { id: "discount", header: t("colDiscount"), meta: { numeric: true }, cell: ({ row }) => f.discount(row.original.discountType, row.original.discountValue, baseCurrency) },
      { id: "category", header: t("colCategory"), cell: ({ row }) => (row.original.categoryName ? <span dir="auto">{row.original.categoryName}</span> : t("anyCategory")) },
      { id: "expires", header: t("colExpires"), cell: ({ row }) => f.date(row.original.expiresAt) ?? "—" },
      {
        id: "status",
        header: t("colStatus"),
        cell: ({ row }) => (
          <Badge tone={TONES[row.original.status] ?? "neutral"} size="sm">
            {t(`couponStatus.${row.original.status}`)}
          </Badge>
        ),
      },
    ],
    [t, f, baseCurrency],
  );
}
