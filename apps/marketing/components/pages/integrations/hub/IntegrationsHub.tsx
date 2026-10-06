"use client";

// The connected accounts hub (FS-MKT-11). The tab is in the address (?tab=), so Back from a detail
// page or the wizard returns to the same tab (MKT-070). Connecting is offered only to the roles that
// may connect (manageIntegrations).
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader, Tabs, TabsList, TabsPanel } from "@orgtik/ui";
import { usePathname, useRouter } from "@/i18n/routing";
import { useMarketingRoles } from "@/lib/permissions";
import { useGetAllIntegrationsQuery } from "@/redux/features/integrations/integrationsApi";
import { ConnectedAccounts } from "./ConnectedAccounts";
import { AvailablePlatforms } from "./AvailablePlatforms";

export type HubTab = "accounts" | "add";

export function IntegrationsHub() {
  const t = useTranslations("Integrations");
  const can = useMarketingRoles();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const accounts = useGetAllIntegrationsQuery({});
  const count = Array.isArray(accounts.data?.data) ? accounts.data.data.length : undefined;

  const requested = params.get("tab");
  const tab: HubTab = requested === "add" && can.manageIntegrations ? "add" : "accounts";
  const setTab = (next: HubTab) => {
    const q = new URLSearchParams(params.toString());
    if (next === "accounts") q.delete("tab");
    else q.set("tab", next);
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const items = [
    { value: "accounts", label: t("tabAccounts"), count },
    ...(can.manageIntegrations ? [{ value: "add", label: t("tabAdd") }] : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <Tabs value={tab} onValueChange={(v) => setTab(v as HubTab)}>
        <TabsList items={items} />
        <TabsPanel value="accounts" className="pt-5">
          <ConnectedAccounts onAdd={can.manageIntegrations ? () => setTab("add") : undefined} />
        </TabsPanel>
        {can.manageIntegrations ? (
          <TabsPanel value="add" className="pt-5">
            <AvailablePlatforms />
          </TabsPanel>
        ) : null}
      </Tabs>
    </div>
  );
}
