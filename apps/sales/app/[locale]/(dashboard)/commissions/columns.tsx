"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Receipt } from "@phosphor-icons/react";
import { Avatar, Button, buttonVariants } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import { SalesStatus } from "@/components/shared/SalesStatus";
import PayoutDialog from "@/components/dialogs/salesman/PayoutDialog";
import { commissionDue, isPercentCommission, toAmount, useTeamFormat } from "@/lib/commissions";
import type { Commission } from "@/types/commissions";

/**
 * The commission columns. Amounts are money in the contract's currency; a percentage commission
 * shows the computed amount with its rate as a hint, not the bare rate (SAL-019). Due is
 * amount − paid (SAL-018). Pay is for admins only (SAL-017).
 */
export function useCommissionColumns({ showSalesperson, canPay }: { showSalesperson: boolean; canPay: boolean }): ColumnDef<Commission>[] {
  const t = useTranslations("Team.commissions");
  const f = useTeamFormat();

  return useMemo(() => {
    const cols: ColumnDef<Commission>[] = [
      {
        id: "reference",
        header: t("colReference"),
        cell: ({ row }) => (
          <bdi dir="ltr" className="font-semibold">
            {row.original.reference}
          </bdi>
        ),
      },
    ];
    if (showSalesperson) {
      cols.push({
        id: "salesperson",
        header: t("colSalesperson"),
        cell: ({ row }) => (
          <Link href={`/salesman/${row.original.salesmanId}`} className="inline-flex items-center gap-2 rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            <Avatar size="sm" name={row.original.salesmanName || "?"} src={row.original.salesmanAvatarUrl} decorative />
            <span dir="auto">{row.original.salesmanName}</span>
          </Link>
        ),
      });
    }
    cols.push(
      {
        id: "project",
        header: t("colProject"),
        meta: { truncate: true },
        cell: ({ row }) =>
          row.original.projectId ? (
            <Link href={`/projects/${row.original.projectId}`} dir="auto" className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-focus">
              {row.original.projectName || t("untitledProject")}
            </Link>
          ) : (
            <span dir="auto">{row.original.projectName || "—"}</span>
          ),
      },
      {
        id: "amount",
        header: t("colAmount"),
        meta: { numeric: true },
        cell: ({ row }) => (
          <span className="flex flex-col items-end">
            <span>{f.money(row.original.amount, row.original.currency)}</span>
            {isPercentCommission(row.original) ? (
              <span className="text-caption text-fg-subtle">{t("rateHint", { rate: f.percent(row.original.commissionRate) })}</span>
            ) : null}
          </span>
        ),
      },
      {
        id: "paid",
        header: t("colPaid"),
        meta: { numeric: true },
        cell: ({ row }) => f.money(toAmount(row.original.paidAmount), row.original.currency),
      },
      {
        id: "due",
        header: t("colDue"),
        meta: { numeric: true },
        cell: ({ row }) => <span className="font-semibold">{f.money(commissionDue(row.original), row.original.currency)}</span>,
      },
      {
        id: "status",
        header: t("colStatus"),
        cell: ({ row }) => <SalesStatus kind="commission" value={row.original.payoutStatus} size="sm" />,
      },
      {
        id: "earned",
        header: t("colEarned"),
        cell: ({ row }) => f.date(row.original.earnedAt || row.original.createdAt) ?? "—",
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("colActions")}</span>,
        meta: { width: "1%" },
        cell: ({ row }) => {
          const c = row.original;
          const due = commissionDue(c);
          return (
            <span className="flex items-center justify-end gap-2">
              {c.receiptUrl ? (
                <a
                  href={c.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("receiptAria", { reference: c.reference })}
                  title={t("receipt")}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  <Receipt aria-hidden className="size-4" />
                </a>
              ) : null}
              {canPay && due > 0 ? (
                <PayoutDialog
                  target={{ kind: "commission", commission: c }}
                  trigger={
                    <Button size="sm" variant="secondary" aria-label={t("payAria", { reference: c.reference })}>
                      {t("pay")}
                    </Button>
                  }
                />
              ) : null}
            </span>
          );
        },
      },
    );
    return cols;
  }, [t, f, showSalesperson, canPay]);
}
