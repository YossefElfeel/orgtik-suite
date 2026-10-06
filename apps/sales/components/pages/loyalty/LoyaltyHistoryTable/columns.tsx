"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Badge, type Tone } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { useTeamFormat } from "@/lib/commissions";
import type { LoyaltyTransaction } from "@/types/loyalty";

const KINDS = ["earned", "redeemed", "adjusted", "expired"] as const;
type Kind = (typeof KINDS)[number];
const TONES: Record<Kind, Tone> = { earned: "success", redeemed: "brand", adjusted: "info", expired: "neutral" };
/** Expiry is recorded as an adjustment; say what it is. */
const kindOf = (tx: LoyaltyTransaction): Kind => (tx.source === "expiry" ? "expired" : (KINDS as readonly string[]).includes(tx.type) ? (tx.type as Kind) : "adjusted");

/** A points history: when, what, the reason, the points (signed) and the balance after. */
export function useHistoryColumns(): ColumnDef<LoyaltyTransaction>[] {
  const t = useTranslations("Team.loyalty");
  const f = useTeamFormat();
  return useMemo<ColumnDef<LoyaltyTransaction>[]>(
    () => [
      { id: "date", header: t("colDate"), cell: ({ row }) => f.date(row.original.createdAt) ?? "—" },
      {
        id: "type",
        header: t("colType"),
        cell: ({ row }) => {
          const k = kindOf(row.original);
          return (
            <Badge tone={TONES[k]} size="sm">
              {t(`historyType.${k}`)}
            </Badge>
          );
        },
      },
      { id: "reason", header: t("colReason"), meta: { wrap: true }, cell: ({ row }) => <span dir="auto">{row.original.reason || "—"}</span> },
      {
        id: "points",
        header: t("colPoints"),
        meta: { numeric: true },
        cell: ({ row }) => {
          const p = row.original.points;
          return <span className={p > 0 ? "font-semibold text-success" : "font-semibold text-fg"}>{f.number(p, { signDisplay: "exceptZero" })}</span>;
        },
      },
      { id: "balance", header: t("colBalanceAfter"), meta: { numeric: true }, cell: ({ row }) => f.number(row.original.remainingPoints ?? 0) },
      { id: "expires", header: t("colExpires"), cell: ({ row }) => (row.original.expiresAt ? f.date(row.original.expiresAt) : "—") },
    ],
    [t, f],
  );
}
