"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@orgtik/ui/table";
import { SalesStatus } from "@/components/shared/SalesStatus";
import OfferRowActions from "@/components/pages/offers/OfferRowActions";
import { Link } from "@/i18n/routing";
import { useDealFormat } from "@/lib/deals/format";
import type { Offer } from "@/types/offers";

export function useOfferColumns({ showCustomer, canManage }: { showCustomer: boolean; canManage: boolean }) {
  const t = useTranslations("Offers");
  const fmt = useDealFormat();
  return useMemo<ColumnDef<Offer>[]>(() => {
    const cols: ColumnDef<Offer>[] = [
      {
        id: "name",
        header: t("colOffer"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <Link href={`/offers/${row.original.id}`} className="font-semibold text-fg hover:text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            <span dir="auto">{row.original.name}</span>
          </Link>
        ),
      },
    ];
    if (showCustomer)
      cols.push({
        id: "customer",
        header: t("colCustomer"),
        meta: { truncate: true },
        cell: ({ row }) => <span dir="auto">{row.original.customerName ?? "—"}</span>,
      });
    cols.push(
      {
        id: "plans",
        header: t("colPlans"),
        meta: { numeric: true },
        cell: ({ row }) => t("plansCount", { count: row.original.planCount }),
      },
      {
        id: "total",
        // The agreed total: the counter once one was accepted, else the quote.
        header: t("colTotal"),
        meta: { numeric: true },
        cell: ({ row }) => fmt.money(row.original.total, row.original.currencyCode),
      },
      {
        id: "status",
        header: t("colStatus"),
        cell: ({ row }) => <SalesStatus kind="offer" value={row.original.status} size="sm" />,
      },
      {
        id: "submitted",
        header: t("colSubmitted"),
        meta: { numeric: true },
        cell: ({ row }) => fmt.date(row.original.submittedAt),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("colActions")}</span>,
        meta: { width: "1%" },
        cell: ({ row }) => <OfferRowActions offer={row.original} canManage={canManage} />,
      },
    );
    return cols;
  }, [t, fmt, showCustomer, canManage]);
}
