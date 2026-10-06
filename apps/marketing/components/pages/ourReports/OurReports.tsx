"use client";

// Reports: the project's figures for a period, as an overview and per profile. The period and the
// tab are in the URL; both tabs read the same period (the Overview had no period control, MKT-065).
import { useTranslations } from "next-intl";
import { PageHeader, Tabs, TabsList, TabsPanel } from "@orgtik/ui";
import { PeriodControl } from "./shared/PeriodControl";
import { useReportPeriod, useSearchState } from "./shared/period";
import { ReportOverview } from "./ReportOverview";
import { ProfilesReport } from "./ProfilesReport";

export function OurReports() {
  const t = useTranslations("Reports");
  const period = useReportPeriod();
  const { params, set } = useSearchState();
  const tab = params.get("tab") === "profiles" ? "profiles" : "overview";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} actions={<PeriodControl period={period} />} />
      <Tabs value={tab} onValueChange={(v) => set({ tab: v === "profiles" ? "profiles" : null, sort: null, dir: null })}>
        <TabsList
          items={[
            { value: "overview", label: t("tabOverview") },
            { value: "profiles", label: t("tabProfiles") },
          ]}
        />
        <TabsPanel value="overview" className="pt-5">
          <ReportOverview period={period} fileLabel="report" />
        </TabsPanel>
        <TabsPanel value="profiles" className="pt-5">
          <ProfilesReport period={period} />
        </TabsPanel>
      </Tabs>
    </div>
  );
}
