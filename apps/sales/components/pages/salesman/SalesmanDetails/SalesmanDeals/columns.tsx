"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, Circle } from "@phosphor-icons/react";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import { SalesStatus } from "@/components/shared/SalesStatus";
import { amountFromText, useTeamFormat } from "@/lib/commissions";
import type { SalesmanContract } from "@/types/salesman";

const currencyOf = (c: SalesmanContract) => c.currency || /^[A-Z]{3}/.exec(c.grandTotal ?? "")?.[0] || "USD";

/** A salesperson's deals (contracts): money in the deal's currency, the project linked (SAL-096). */
export function useSalesmanDealColumns(): ColumnDef<SalesmanContract>[] {
  const t = useTranslations("Team.salespeople");
  const f = useTeamFormat();
  return useMemo<ColumnDef<SalesmanContract>[]>(
    () => [
      {
        id: "project",
        header: t("colProject"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <Link href={`/projects/${row.original.projectId}`} dir="auto" className="font-semibold rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {row.original.projectName || t("untitledProject")}
          </Link>
        ),
      },
      {
        id: "plans",
        header: t("colPlans"),
        cell: ({ row }) => {
          const plans = row.original.plans ?? [];
          if (!plans.length) return "—";
          const first = plans[0].planName || plans[0].name?.en || "—";
          return (
            <span dir="auto">
              {first}
              {plans.length > 1 ? <span className="ms-1 text-fg-subtle">{t("morePlans", { more: f.number(plans.length - 1) })}</span> : null}
            </span>
          );
        },
      },
      {
        id: "total",
        header: t("colTotal"),
        meta: { numeric: true },
        cell: ({ row }) => f.money(amountFromText(row.original.grandTotal), currencyOf(row.original)),
      },
      {
        id: "commission",
        header: t("colCommission"),
        meta: { numeric: true },
        cell: ({ row }) => {
          const c = row.original;
          // The money for a rate is worked out on approval (on the total before VAT), so a rate
          // is shown as a rate here, never a guessed amount.
          if (c.commissionMode === "percentage") return t("rateOfContract", { rate: f.percent(amountFromText(c.commissionPercentage)) });
          return f.money(amountFromText(c.commissionValue), currencyOf(c));
        },
      },
      {
        id: "status",
        header: t("colStatus"),
        cell: ({ row }) => <SalesStatus kind="project" value={row.original.status} size="sm" />,
      },
      {
        id: "signed",
        header: t("colSigned"),
        cell: ({ row }) =>
          row.original.isSigntuerd ? (
            <span className="inline-flex items-center gap-1.5 text-fg">
              <CheckCircle aria-hidden weight="fill" className="size-4 text-success" />
              {t("signedYes")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-fg-muted">
              <Circle aria-hidden className="size-4" />
              {t("signedNo")}
            </span>
          ),
      },
      {
        id: "created",
        header: t("colCreated"),
        cell: ({ row }) => f.date(row.original.createdAt) ?? "—",
      },
    ],
    [t, f],
  );
}
