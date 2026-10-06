"use client";

// Loyalty, by role. Admins: the programme, its rewards and the customers' points (one tab each, the
// tab in the address). Managers: the customers' points, read-only. Customers: their portal (points,
// rewards to redeem, their coupons and history). Every part reads the API and has its own states.
import { useTranslations } from "next-intl";
import { LoadingState, PageHeader, Tabs, TabsList, TabsPanel } from "@orgtik/ui";
import { useRole } from "@/hooks/useRole";
import LoyaltyOverview from "@/components/pages/loyalty/LoyaltyOverview";
import LoyaltyProgramForm from "@/components/pages/loyalty/LoyaltyProgramForm";
import LoyaltyRewards from "@/components/pages/loyalty/LoyaltyRewards";
import LoyaltyCustomers from "@/components/pages/loyalty/LoyaltyCustomers";
import CustomerLoyaltyStats from "@/components/pages/loyalty/CustomerLoyaltyStats";
import CustomerLoyaltyRedeem from "@/components/pages/loyalty/CustomerLoyaltyRedeem";
import CustomerLoyaltyCoupons from "@/components/pages/loyalty/CustomerLoyaltyCoupons";
import CustomerLoyaltyHistory from "@/components/pages/loyalty/CustomerLoyaltyHistory";
import { useUrlState } from "@/lib/commissions";
import type { LoyaltyPortalTab, LoyaltyTab } from "@/types/loyalty";

const ADMIN_TABS: readonly LoyaltyTab[] = ["program", "rewards", "customers"];
const PORTAL_TABS: readonly LoyaltyPortalTab[] = ["rewards", "coupons", "history"];

export default function LoyaltyPage() {
  const t = useTranslations("Team.loyalty");
  const { isReady, isAdmin, isCustomer } = useRole();
  const url = useUrlState();
  const raw = url.get("tab");
  const switchTab = (value: string, first: string) => url.set({ tab: value === first ? null : value, history: null });

  if (!isReady) {
    return (
      <section className="flex flex-col gap-6">
        <PageHeader title={t("title")} />
        <LoadingState rows={4} label={t("title")} />
      </section>
    );
  }

  if (isCustomer) {
    const tab: LoyaltyPortalTab = (PORTAL_TABS as readonly string[]).includes(raw) ? (raw as LoyaltyPortalTab) : "rewards";
    return (
      <section className="flex flex-col gap-6">
        <PageHeader title={t("titleCustomer")} description={t("descriptionCustomer")} />
        <CustomerLoyaltyStats />
        <Tabs value={tab} onValueChange={(v) => switchTab(String(v), "rewards")}>
          <TabsList items={PORTAL_TABS.map((v) => ({ value: v, label: t(`portalTab.${v}`) }))} />
          <TabsPanel value="rewards" className="pt-6">
            {tab === "rewards" ? <CustomerLoyaltyRedeem /> : null}
          </TabsPanel>
          <TabsPanel value="coupons" className="pt-6">
            {tab === "coupons" ? <CustomerLoyaltyCoupons /> : null}
          </TabsPanel>
          <TabsPanel value="history" className="pt-6">
            {tab === "history" ? <CustomerLoyaltyHistory /> : null}
          </TabsPanel>
        </Tabs>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="flex flex-col gap-6">
        <PageHeader title={t("title")} description={t("descriptionManager")} />
        <LoyaltyOverview />
        <LoyaltyCustomers />
      </section>
    );
  }

  const tab: LoyaltyTab = (ADMIN_TABS as readonly string[]).includes(raw) ? (raw as LoyaltyTab) : "program";
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("descriptionAdmin")} />
      <LoyaltyOverview />
      <Tabs value={tab} onValueChange={(v) => switchTab(String(v), "program")}>
        <TabsList items={ADMIN_TABS.map((v) => ({ value: v, label: t(`adminTab.${v}`) }))} />
        <TabsPanel value="program" className="pt-6">
          {tab === "program" ? <LoyaltyProgramForm /> : null}
        </TabsPanel>
        <TabsPanel value="rewards" className="pt-6">
          {tab === "rewards" ? <LoyaltyRewards /> : null}
        </TabsPanel>
        <TabsPanel value="customers" className="pt-6">
          {tab === "customers" ? <LoyaltyCustomers /> : null}
        </TabsPanel>
      </Tabs>
    </section>
  );
}
