"use client";

// The payout summary as Stat tiles: for a salesperson their own commissions, for managers and
// admins everyone's (SAL-171). Money stays per currency (one line per zone).
import { useTranslations } from "next-intl";
import { CheckCircle, ClockCountdown, Coins, Wallet } from "@phosphor-icons/react";
import { ErrorState, Stat } from "@orgtik/ui";
import MoneyList from "@/components/pages/commissions/MoneyList";
import { useTeamFormat } from "@/lib/commissions";
import type { CommissionSummaryStats, CommissionZoneSummary } from "@/types/commissions";

type Props = {
  stats: CommissionSummaryStats | undefined;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
};

const amounts = (zones: CommissionZoneSummary[], pick: (z: CommissionZoneSummary) => number) =>
  zones.filter((z) => pick(z) !== 0 || zones.length === 1).map((z) => ({ currency: z.currencyCode, amount: pick(z), label: z.zoneName }));

export default function CommissionStats({ stats, loading, error, onRetry }: Props) {
  const t = useTranslations("Team.commissions");
  const f = useTeamFormat();
  if (error) {
    return (
      <div className="rounded-card border border-line bg-raised">
        <ErrorState size="compact" title={t("summaryError")} onRetry={onRetry} />
      </div>
    );
  }
  const zones = stats?.zones ?? [];
  const single = zones.length === 1 ? zones[0] : null;
  return (
    <section aria-label={t("summary")} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat
        icon={<ClockCountdown />}
        label={t("statDueCount")}
        loading={loading}
        value={f.number(stats?.pendingPayoutCount ?? 0)}
        hint={stats ? t("statDueCountHint", { count: stats.paidCount, paid: f.number(stats.paidCount) }) : undefined}
      />
      <Stat icon={<Wallet />} label={t("statDueAmount")} loading={loading} value={<MoneyList amounts={amounts(zones, (z) => z.pendingPayoutAmount)} />} />
      <Stat icon={<CheckCircle />} label={t("statPaid")} loading={loading} value={<MoneyList amounts={amounts(zones, (z) => z.totalPaid)} />} />
      <Stat
        icon={<Coins />}
        label={t("statEarned")}
        loading={loading}
        value={<MoneyList amounts={amounts(zones, (z) => z.totalEarned)} />}
        hint={single ? t("statEarnedHint", { percent: f.percent(single.collectedPercent) }) : undefined}
      />
    </section>
  );
}
