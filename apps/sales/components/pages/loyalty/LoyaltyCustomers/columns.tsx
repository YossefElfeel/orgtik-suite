"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ClockCounterClockwise, PlusMinus } from "@phosphor-icons/react";
import { IconButton } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import AdjustLoyaltyPointsDialog from "@/components/dialogs/loyalty/AdjustLoyaltyPointsDialog";
import { useTeamFormat } from "@/lib/commissions";
import { isolate } from "@/lib/bidi";
import type { LoyaltyCustomerRow } from "@/types/loyalty";

/**
 * Customers in the programme. Admins see the lifetime figures and adjust points; managers see the
 * balance and the history (read-only).
 */
export function useLoyaltyCustomerColumns({ full, canAdjust, onHistory }: { full: boolean; canAdjust: boolean; onHistory: (row: LoyaltyCustomerRow) => void }): ColumnDef<LoyaltyCustomerRow>[] {
  const t = useTranslations("Team.loyalty");
  const f = useTeamFormat();
  return useMemo<ColumnDef<LoyaltyCustomerRow>[]>(() => {
    const cols: ColumnDef<LoyaltyCustomerRow>[] = [
      {
        id: "customer",
        header: t("colCustomer"),
        cell: ({ row }) => (
          <Link href={`/customers/${row.original.customerId}`} dir="auto" className="font-semibold rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {row.original.customerName}
          </Link>
        ),
      },
      { id: "company", header: t("colCompany"), meta: { truncate: true }, cell: ({ row }) => (row.original.companyName ? <span dir="auto">{row.original.companyName}</span> : "—") },
    ];
    if (full) cols.push({ id: "email", header: t("colEmail"), cell: ({ row }) => (row.original.email ? <bdi dir="ltr">{row.original.email}</bdi> : "—") });
    cols.push({ id: "points", header: t("colBalance"), meta: { numeric: true }, cell: ({ row }) => <span className="font-semibold">{f.number(row.original.points)}</span> });
    if (full) {
      cols.push(
        { id: "earned", header: t("colEarned"), meta: { numeric: true }, cell: ({ row }) => f.number(row.original.lifetimeEarned ?? 0) },
        { id: "redeemed", header: t("colRedeemed"), meta: { numeric: true }, cell: ({ row }) => f.number(row.original.lifetimeRedeemed ?? 0) },
      );
    }
    cols.push({
      id: "actions",
      header: () => <span className="sr-only">{t("colActions")}</span>,
      meta: { width: "1%" },
      cell: ({ row }) => (
        <span className="flex items-center justify-end gap-1">
          <IconButton label={t("historyAria", { name: isolate(row.original.customerName) })} icon={<ClockCounterClockwise />} size="sm" onClick={() => onHistory(row.original)} />
          {canAdjust ? (
            <AdjustLoyaltyPointsDialog
              customerId={row.original.customerId}
              customerName={row.original.customerName}
              points={row.original.points}
              trigger={<IconButton label={t("adjustAria", { name: isolate(row.original.customerName) })} icon={<PlusMinus />} size="sm" />}
            />
          ) : null}
        </span>
      ),
    });
    return cols;
  }, [t, f, full, canAdjust, onHistory]);
}
