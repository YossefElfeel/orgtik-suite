"use client";

// The programme at a glance, for admins and managers: whether it runs, how points are earned, the
// points customers hold and how many customers hold some. From the API, with its own states.
import { useTranslations } from "next-intl";
import { Coins, Power, Star, UsersThree } from "@phosphor-icons/react";
import { ErrorState, Stat } from "@orgtik/ui";
import { useGetLoyaltyOverviewQuery, useGetLoyaltySettingsQuery } from "@/redux/features/loyalty/loyaltyApi";
import { useTeamFormat } from "@/lib/commissions";

export default function LoyaltyOverview() {
  const t = useTranslations("Team.loyalty");
  const f = useTeamFormat();
  const overview = useGetLoyaltyOverviewQuery();
  const settings = useGetLoyaltySettingsQuery();
  if (overview.isError || settings.isError) {
    return (
      <div className="rounded-card border border-line bg-raised">
        <ErrorState
          size="compact"
          title={t("overviewError")}
          onRetry={() => {
            void overview.refetch();
            void settings.refetch();
          }}
        />
      </div>
    );
  }
  const s = settings.data?.data;
  const o = overview.data?.data;
  return (
    <section aria-label={t("overviewLabel")} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={<Power />} label={t("statProgram")} loading={settings.isLoading} value={s?.isActive ? t("programOn") : t("programOff")} />
      <Stat
        icon={<Star />}
        label={t("statEarning")}
        loading={settings.isLoading}
        value={s ? t("earningValue", { points: f.number(Number(s.pointsPerUnit) || 0, { maximumFractionDigits: 2 }), currency: s.baseCurrency }) : "—"}
        hint={s ? t("earningHint", { count: s.pointsExpireAfterMonths, months: f.number(s.pointsExpireAfterMonths) }) : undefined}
      />
      <Stat icon={<Coins />} label={t("statOutstanding")} loading={overview.isLoading} value={f.number(o?.outstandingPoints ?? 0)} />
      <Stat icon={<UsersThree />} label={t("statWithBalance")} loading={overview.isLoading} value={f.number(o?.customersWithBalance ?? 0)} />
    </section>
  );
}
