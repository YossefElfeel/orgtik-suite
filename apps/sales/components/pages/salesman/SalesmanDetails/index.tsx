"use client";

// A salesperson: money, details, deals, customers, performance and notes, one tab each (the tab is
// in the address). Admins edit, pay and open SOS's View as; managers read. "Sign in as" is gone
// (SAL-004). Not-found, no-access and error each have their own state; never an endless spinner.
import { useTranslations } from "next-intl";
import { PencilSimple } from "@phosphor-icons/react";
import { Button, EmptyState, ErrorState, LoadingState, NoPermissionState, PageHeader, Tabs, TabsList, TabsPanel } from "@orgtik/ui";
import { useRole } from "@/hooks/useRole";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { SalesStatus } from "@/components/shared/SalesStatus";
import SalesmanDialog from "@/components/dialogs/salesman/SalesmanDialog";
import ViewAsLink from "@/components/pages/user-management/ViewAsLink";
import { useGetSalesmanQuery } from "@/redux/features/salesman/salesmanApi";
import { errorStatus, useUrlState } from "@/lib/commissions";
import SalesmanFinance from "./SalesmanFinance";
import PersonalDetails from "./PersonalDetails";
import SalesmanDeals from "./SalesmanDeals";
import LatestCustomers from "./LatestCustomers";
import SalesmanPerformance from "./SalesmanPerformance";
import SalesmanNotes from "./SalesmanNotes";
import DeleteSalesmanAction from "./DeleteSalesmanAction";

const TABS = ["overview", "deals", "customers", "performance", "notes"] as const;
type Tab = (typeof TABS)[number];

export default function SalesmanDetails({ id }: { id: string }) {
  const t = useTranslations("Team.salespeople");
  const { isAdmin, canEdit } = useRole();
  const url = useUrlState();
  const tab: Tab = (TABS as readonly string[]).includes(url.get("tab")) ? (url.get("tab") as Tab) : "overview";
  const { data, isLoading, isError, error, refetch } = useGetSalesmanQuery(id);
  const salesman = data?.data;
  const back = [{ label: t("title"), href: "/salesman" }];

  if (isLoading) {
    return (
      <section className="flex flex-col gap-6">
        <PageHeader title={t("detailLoading")} breadcrumb={back} />
        <LoadingState rows={6} label={t("detailLoading")} />
      </section>
    );
  }
  if (isError || !salesman) {
    const code = errorStatus(error);
    return (
      <section className="flex flex-col gap-6">
        <PageHeader title={t("title")} breadcrumb={back} />
        {code === 404 || (!isError && !salesman) ? (
          <EmptyState
            title={t("notFoundTitle")}
            description={t("notFoundBody")}
            action={
              <ButtonLink href="/salesman" variant="secondary">
                {t("backToList")}
              </ButtonLink>
            }
          />
        ) : code === 403 ? (
          <NoPermissionState title={t("noAccessTitle")} description={t("noAccessBody")} />
        ) : (
          <ErrorState title={t("detailErrorTitle")} description={t("errorBody")} onRetry={() => void refetch()} />
        )}
      </section>
    );
  }

  const admin = isAdmin && canEdit;
  const tabs = TABS.map((value) => ({ value, label: t(`tab.${value}`) }));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={<span dir="auto">{salesman.fullName}</span>}
        breadcrumb={[...back, { label: salesman.fullName }]}
        status={<SalesStatus kind="access" value={salesman.access ?? (salesman.hasAccount ? "active" : "no_account")} />}
        actions={
          <>
            {admin && !salesman.hasAccount ? <DeleteSalesmanAction id={salesman.id} fullName={salesman.fullName} customers={salesman.stats?.totalCustomers ?? 0} /> : null}
            <ViewAsLink authUserId={salesman.hasAccount ? salesman.authUserId : null} name={salesman.fullName} />
            {admin ? (
              <SalesmanDialog
                id={salesman.id}
                trigger={
                  <Button variant="secondary" startIcon={<PencilSimple />}>
                    {t("edit")}
                  </Button>
                }
              />
            ) : null}
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => url.set({ tab: v === "overview" ? null : String(v), q: null, status: null })}>
        <TabsList items={tabs} />
        <TabsPanel value="overview" className="flex flex-col gap-6 pt-6">
          <SalesmanFinance salesman={salesman} />
          <PersonalDetails salesman={salesman} />
        </TabsPanel>
        <TabsPanel value="deals" className="pt-6">
          {tab === "deals" ? <SalesmanDeals salesmanId={salesman.id} /> : null}
        </TabsPanel>
        <TabsPanel value="customers" className="pt-6">
          {tab === "customers" ? <LatestCustomers salesmanId={salesman.id} /> : null}
        </TabsPanel>
        <TabsPanel value="performance" className="pt-6">
          {tab === "performance" ? <SalesmanPerformance salesman={salesman} /> : null}
        </TabsPanel>
        <TabsPanel value="notes" className="pt-6">
          {tab === "notes" ? <SalesmanNotes salesmanId={salesman.id} /> : null}
        </TabsPanel>
      </Tabs>
    </section>
  );
}
