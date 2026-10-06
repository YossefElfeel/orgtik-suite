"use client";

// The customer's points: balance, earned, spent and what expires soon. When the programme is paused
// it says so, since rewards can't be redeemed then.
import { useTranslations } from "next-intl";
import { Coins, HourglassMedium, PauseCircle, ShoppingBag, Star } from "@phosphor-icons/react";
import { ErrorState, Stat } from "@orgtik/ui";
import { useGetMeLoyaltyOverviewQuery } from "@/redux/features/loyalty/loyaltyApi";
import { useTeamFormat } from "@/lib/commissions";

export default function CustomerLoyaltyStats() {
  const t = useTranslations("Team.loyalty");
  const f = useTeamFormat();
  const overview = useGetMeLoyaltyOverviewQuery();
  const o = overview.data?.data;
  if (overview.isError) {
    return (
      <div className="rounded-card border border-line bg-raised">
        <ErrorState size="compact" title={t("myPointsError")} onRetry={() => void overview.refetch()} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {o && !o.programActive ? (
        <p role="status" className="flex items-start gap-2 rounded-card border border-line bg-sunken px-4 py-3 text-body-sm text-fg-muted">
          <PauseCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-brand" />
          {t("programPaused")}
        </p>
      ) : null}
      <section aria-label={t("myPoints")} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<Coins />}
          label={t("statBalance")}
          loading={overview.isLoading}
          value={f.number(o?.balance ?? 0)}
          hint={o ? t("earnHint", { points: f.number(Number(o.pointsPerUnit) || 0, { maximumFractionDigits: 2 }), currency: o.baseCurrency }) : undefined}
        />
        <Stat icon={<Star />} label={t("statLifetimeEarned")} loading={overview.isLoading} value={f.number(o?.lifetimeEarned ?? 0)} />
        <Stat icon={<ShoppingBag />} label={t("statLifetimeRedeemed")} loading={overview.isLoading} value={f.number(o?.lifetimeRedeemed ?? 0)} />
        <Stat
          icon={<HourglassMedium />}
          label={t("statExpiring")}
          loading={overview.isLoading}
          value={f.number(o?.expiringSoon ?? 0)}
          hint={o?.nextExpiryAt ? t("nextExpiry", { date: f.date(o.nextExpiryAt) ?? "" }) : t("nothingExpiring")}
        />
      </section>
    </div>
  );
}
