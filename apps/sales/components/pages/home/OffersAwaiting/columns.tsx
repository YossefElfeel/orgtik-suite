"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFormatter } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import { ORG_TIME_ZONE } from "@/components/pages/activity-feed/feed";
import type { DashboardOfferRow } from "@/types/dashboard";

/** Offers waiting for the customer: the offer (a link to answer it), its total and when it was sent. */
export function useOffersAwaitingColumns(): ColumnDef<DashboardOfferRow>[] {
  const t = useTranslations("SalesHome");
  const f = useFormatter();
  return useMemo<ColumnDef<DashboardOfferRow>[]>(
    () => [
      {
        id: "offer",
        header: t("columnOffer"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <Link
            href={`/offers/${encodeURIComponent(row.original.id)}`}
            dir="auto"
            className="font-medium text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "total",
        header: t("columnTotal"),
        meta: { numeric: true },
        cell: ({ row }) => {
          const n = Number(row.original.total);
          return Number.isFinite(n) && row.original.currencyCode ? f.money(n, row.original.currencyCode) : "—";
        },
      },
      {
        id: "sent",
        header: t("columnSent"),
        meta: { numeric: true, width: "1%" },
        cell: ({ row }) =>
          row.original.submittedAt ? (
            <time dateTime={row.original.submittedAt} className="text-fg-muted">
              {f.date(row.original.submittedAt, { dateStyle: "medium", timeZone: ORG_TIME_ZONE })}
            </time>
          ) : (
            <span className="text-fg-muted">—</span>
          ),
      },
    ],
    [f, t],
  );
}
