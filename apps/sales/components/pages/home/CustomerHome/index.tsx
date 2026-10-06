"use client";

// A customer's dashboard (FS-SAL-10): their projects, the offers waiting for their answer, and
// their loyalty points. It used to show invoice and subscription money (frozen modules that move to
// the customer's own portal, D-011) in tiles with decorative blobs over the figures, and English dates.
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, CrownSimple, FileText } from "@phosphor-icons/react";
import { Stat, useFormatter } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useRole } from "@/hooks/useRole";
import { canAccessRoute } from "@/lib/role-access";
import LatestProjects from "@/components/pages/home/LatestProjects";
import OffersAwaiting from "@/components/pages/home/OffersAwaiting";
import { ORG_TIME_ZONE } from "@/components/pages/activity-feed/feed";
import { useGetDashboardLoyaltyQuery, useGetDashboardOffersAwaitingQuery } from "@/redux/features/dashboard/dashboardApi";
import type { CustomerDashboardData } from "@/types/dashboard";

const linkClass = "text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export default function CustomerHome({ data, loading }: { data: CustomerDashboardData | undefined; loading: boolean }) {
  const t = useTranslations("SalesHome");
  const f = useFormatter();
  const { role } = useRole();
  const offers = useGetDashboardOffersAwaitingQuery({ limit: 5 });
  const loyalty = useGetDashboardLoyaltyQuery();
  const account = loyalty.data?.data;
  const canRewards = canAccessRoute(role, "/loyalty");

  let loyaltyHint: ReactNode = null;
  if (loyalty.isError && !account) loyaltyHint = t("loyaltyError");
  else if (account && !account.programActive) loyaltyHint = t("loyaltyPaused");
  else if (account?.expiringSoon && account.nextExpiryAt) {
    loyaltyHint = t("loyaltyExpiring", {
      count: account.expiringSoon,
      date: f.date(account.nextExpiryAt, { dateStyle: "medium", timeZone: ORG_TIME_ZONE }),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat icon={<Briefcase />} label={t("kpiMyProjects")} loading={loading} value={f.number(data?.totalProjects ?? 0)} />
          <Stat
            icon={<FileText />}
            label={t("kpiOffersAwaiting")}
            loading={offers.isLoading}
            value={offers.isError && !offers.data ? "—" : f.number(offers.data?.data?.meta?.total ?? 0)}
            hint={offers.isError && !offers.data ? t("listError") : undefined}
          />
          <Stat
            icon={<CrownSimple />}
            label={t("kpiPoints")}
            loading={loyalty.isLoading}
            value={account ? f.number(account.balance) : "—"}
            hint={
              <span className="flex flex-col gap-1">
                {loyaltyHint ? <span>{loyaltyHint}</span> : null}
                {canRewards ? (
                  <Link href="/loyalty" className={linkClass}>
                    {t("openRewards")}
                  </Link>
                ) : null}
              </span>
            }
          />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <OffersAwaiting />
        <LatestProjects />
      </div>
    </div>
  );
}
