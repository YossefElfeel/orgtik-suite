"use client";

// The dashboard (FS-SAL-10), per role, all from the API:
// - admins and managers: the team's figures (library Stat tiles whose change says its direction in
//   words), totals per currency that say they aren't converted, sales over twelve months, the lead
//   pipeline by D-028 stage, projects by stage (charts with table views), what needs attention, and
//   the newest customers and projects;
// - salespeople: the same for their own customers and deals;
// - customers: their projects, the offers waiting for their answer, and their loyalty points.
// What changed (SAL-039, SAL-042, SAL-139, SAL-161, SAL-164):
// - an API error shows an error with Retry instead of a skeleton forever, and a refetch (a language
//   switch, a pushed event) keeps the figures on screen instead of blanking the page;
// - the decorative blobs that sat over the figures and the low-contrast labels on the purple card
//   are gone with the old StatCard;
// - "New salesman" did nothing: it now opens the salespeople page's form, and "New project" the
//   projects page's (both pages read `?new=1`);
// - months, numbers and money read in the reader's language; "Welcome Back, Mona!!" is one sentence.
import { useTranslations } from "next-intl";
import { Briefcase, Package, Plus, UsersThree, IdentificationBadge, Wallet, CurrencyCircleDollar, ChartLineUp } from "@phosphor-icons/react";
import { ErrorState, PageHeader, Stat, useFormatter } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useRole } from "@/hooks/useRole";
import { isolate } from "@/lib/bidi";
import { canAccessRoute } from "@/lib/role-access";
import CustomerHome from "@/components/pages/home/CustomerHome";
import LatestCustomers from "@/components/pages/home/LatestCustomers";
import LatestProjects from "@/components/pages/home/LatestProjects";
import LeadPipelineChart from "@/components/pages/home/LeadPipelineChart";
import MoneyTile from "@/components/pages/home/MoneyTile";
import NeedsAttention from "@/components/pages/home/NeedsAttention";
import ProjectStageChart from "@/components/pages/home/ProjectStageChart";
import SalesTrendChart from "@/components/pages/home/SalesTrendChart";
import { growthChange, periodKey, type Growth } from "@/components/pages/home/growth";
import { useGetDashboardStatsQuery } from "@/redux/features/dashboard/dashboardApi";
import { isCustomerDashboardData, type DashboardData } from "@/types/dashboard";

export default function DashboardPage() {
  const t = useTranslations("SalesHome");
  const f = useFormatter();
  const { role, isAdmin, isManager, isSalesman, isCustomer, fullName, user, canEdit } = useRole();
  const q = useGetDashboardStatsQuery();
  const raw = q.data?.data;
  const loading = q.isLoading || (q.isFetching && !raw);
  const failed = q.isError && !raw;

  const firstName = (typeof user?.firstName === "string" && user.firstName) || fullName || "";
  const title = firstName ? t("welcome", { name: isolate(firstName) }) : t("welcomeNoName");
  const description = isCustomer ? t("descriptionCustomer") : isSalesman ? t("descriptionSalesman") : t("descriptionTeam");

  const actions =
    canEdit && !isCustomer ? (
      <>
        {isAdmin && canAccessRoute(role, "/salesman") ? (
          <ButtonLink href="/salesman?new=1" variant="secondary">
            <Plus aria-hidden="true" className="size-4" />
            {t("newSalesman")}
          </ButtonLink>
        ) : null}
        {isSalesman && canAccessRoute(role, "/customers") ? (
          <ButtonLink href="/customers?new=1" variant="secondary">
            <Plus aria-hidden="true" className="size-4" />
            {t("newCustomer")}
          </ButtonLink>
        ) : null}
        {canAccessRoute(role, "/projects") ? (
          <ButtonLink href="/projects?new=1">
            <Plus aria-hidden="true" className="size-4" />
            {t("newProject")}
          </ButtonLink>
        ) : null}
      </>
    ) : undefined;

  const header = <PageHeader title={title} description={description} actions={actions} />;

  if (failed) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <ErrorState title={t("loadError")} description={t("loadErrorBody")} onRetry={() => void q.refetch()} />
      </div>
    );
  }

  if (isCustomer) {
    const data = raw && isCustomerDashboardData(raw) ? raw : undefined;
    return (
      <div className="flex flex-col gap-6">
        {header}
        <CustomerHome data={data} loading={loading} />
      </div>
    );
  }

  const d: DashboardData | undefined = raw && !isCustomerDashboardData(raw) ? raw : undefined;
  const team = isAdmin || isManager;
  const against = (m: Growth | undefined) => t(`againstNew.${periodKey(m?.comparisonPeriod)}`, { count: m?.currentPeriod ?? 0 });
  const count = (m: Growth & { total: number } | undefined) => f.number(m?.total ?? 0);
  const chartState = { loading, error: false };

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<Briefcase />}
          label={isSalesman ? t("kpiMyDeals") : t("kpiProjects")}
          loading={loading}
          value={count(d?.totalProjects)}
          change={growthChange(d?.totalProjects, against(d?.totalProjects))}
        />
        <Stat
          icon={<UsersThree />}
          label={isSalesman ? t("kpiMyCustomers") : t("kpiCustomers")}
          loading={loading}
          value={count(d?.totalCustomers)}
          change={growthChange(d?.totalCustomers, against(d?.totalCustomers))}
        />
        {team ? (
          <Stat
            icon={<IdentificationBadge />}
            label={t("kpiSalespeople")}
            loading={loading}
            value={count(d?.totalSalesmen)}
            change={growthChange(d?.totalSalesmen, against(d?.totalSalesmen))}
          />
        ) : null}
        <Stat
          icon={<Package />}
          label={t("kpiPlansSold")}
          loading={loading}
          value={count(d?.totalPlanSales)}
          change={growthChange(d?.totalPlanSales, against(d?.totalPlanSales))}
        />
        <MoneyTile icon={<ChartLineUp />} label={isSalesman ? t("kpiMySales") : t("kpiSales")} groups={d?.totalSales} loading={loading} />
        <MoneyTile icon={<Wallet />} label={isSalesman ? t("kpiMyCommissions") : t("kpiCommissions")} groups={d?.totalCommission} loading={loading} />
        {team ? <MoneyTile icon={<CurrencyCircleDollar />} label={t("kpiNet")} groups={d?.netProfit} loading={loading} /> : null}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SalesTrendChart
          className={team ? "xl:col-span-2" : "xl:col-span-3"}
          title={isSalesman ? t("mySalesTrendTitle") : undefined}
          series={d?.salesTrend?.series}
          from={d?.salesTrend?.from}
          {...chartState}
        />
        {team ? <NeedsAttention data={d?.needAttention} loading={loading} /> : null}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <LeadPipelineChart breakdown={d?.customerStatus?.breakdown} {...chartState} />
        <ProjectStageChart breakdown={d?.projectStageBreakdown} {...chartState} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <LatestCustomers />
        <LatestProjects />
      </div>
    </div>
  );
}
