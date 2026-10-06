"use client";

// How the salesperson is doing, on the library's charts: each chart can switch to a table of the
// same numbers (SAL-179), and money is drawn one currency at a time (a zone switch picks it).
import { useTranslations } from "next-intl";
import { Briefcase, Package, UsersThree } from "@phosphor-icons/react";
import { EmptyState, Select, Stat, useStatusLabel } from "@orgtik/ui";
import { BarChart, DonutChart, LineChart } from "@orgtik/ui/charts";
import { useSalesStatusLabel } from "@/components/shared/SalesStatus";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { useTeamFormat, useUrlState } from "@/lib/commissions";
import type { SalesmanDetail } from "@/types/salesman";
import type { GrowthMetric } from "@/types/dashboard";

const LEAD = ["new", "contacted", "qualified", "quoted", "won", "lost", "unqualified", "spam", "duplicate"] as const;
type Lead = (typeof LEAD)[number];

export default function SalesmanPerformance({ salesman }: { salesman: SalesmanDetail }) {
  const t = useTranslations("Team.salespeople");
  const f = useTeamFormat();
  const display = useCatalogDisplayText();
  const statusLabel = useSalesStatusLabel();
  const leadLabel = useStatusLabel();
  const url = useUrlState();
  const p = salesman.performance;

  if (!p) {
    return <EmptyState title={t("performanceEmptyTitle")} description={t("performanceEmptyBody")} />;
  }

  const series = p.salesTrend12Months ?? [];
  const zoneKey = (z: { zoneId: string | null; currencyCode: string }) => z.zoneId ?? z.currencyCode;
  const zone = series.find((s) => zoneKey(s) === url.get("zone")) ?? series[0];
  const currency = zone?.currencyCode ?? salesman.finance?.currencyCode ?? "USD";
  const money: Intl.NumberFormatOptions = { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 };
  const plans = (p.topPlansByRevenue?.length ? p.topPlansByRevenue : p.topPlans ?? []).find((g) => zone && zoneKey(g) === zoneKey(zone));

  const change = (m: GrowthMetric | undefined) => (m ? { value: (m.growthPercent ?? 0) / 100, against: t("vsLastMonth") } : undefined);

  // Old customer records can still say "scheduled"; a meeting is an activity on a contacted lead (D-028).
  const customerCounts = new Map<Lead, number>();
  for (const b of p.customerStatusBreakdown ?? p.customerStatus?.breakdown ?? []) {
    const s = (b.status === "scheduled" ? "contacted" : b.status) as Lead;
    if ((LEAD as readonly string[]).includes(s)) customerCounts.set(s, (customerCounts.get(s) ?? 0) + b.count);
  }

  const zoneSwitch =
    series.length > 1 ? (
      <Select
        aria-label={t("zoneSwitch")}
        size="sm"
        value={zone ? zoneKey(zone) : undefined}
        onValueChange={(v) => url.set({ zone: v })}
        options={series.map((s) => ({ value: zoneKey(s), label: `${s.zoneName} · ${s.currencyCode}` }))}
        className="w-48"
      />
    ) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat icon={<Briefcase />} label={t("statProjects")} value={f.number(p.totalProjects?.total ?? 0)} change={change(p.totalProjects)} />
        <Stat icon={<UsersThree />} label={t("statCustomers")} value={f.number(p.totalCustomers?.total ?? 0)} change={change(p.totalCustomers)} />
        <Stat icon={<Package />} label={t("statPlans")} value={f.number(p.totalPlanSales?.total ?? 0)} change={change(p.totalPlanSales)} />
      </div>

      <LineChart
        area
        title={t("chartSales")}
        description={zone ? t("chartSalesHint", { zone: zone.zoneName, currency }) : undefined}
        actions={zoneSwitch}
        data={(zone?.points ?? []).map((pt) => ({ month: pt.month, amount: pt.amount }))}
        x={{ key: "month", label: t("chartMonth"), format: (v) => f.month(String(v)) }}
        series={[{ key: "amount", label: t("chartSalesSeries") }]}
        valueFormat={money}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DonutChart
          title={t("chartDeals")}
          data={(p.dealStageBreakdown ?? []).map((b) => ({ key: b.status, label: statusLabel("contract", b.status), value: b.count }))}
          totalLabel={t("chartDealsTotal")}
          categoryLabel={t("chartStage")}
          valueLabel={t("chartDealsCount")}
        />
        <DonutChart
          title={t("chartCustomers")}
          data={[...customerCounts.entries()].filter(([, n]) => n > 0).map(([s, n]) => ({ key: s, label: leadLabel("lead", s), value: n }))}
          totalLabel={t("chartCustomersTotal")}
          categoryLabel={t("chartStage")}
          valueLabel={t("chartCustomersCount")}
        />
      </div>

      <BarChart
        layout="rows"
        title={t("chartPlans")}
        description={zone ? t("chartSalesHint", { zone: zone.zoneName, currency }) : undefined}
        data={(plans?.plans ?? []).map((pl) => ({ plan: display(pl.name), revenue: pl.revenue }))}
        x={{ key: "plan", label: t("chartPlan") }}
        series={[{ key: "revenue", label: t("chartRevenue"), color: 2 }]}
        valueFormat={money}
      />
    </div>
  );
}
