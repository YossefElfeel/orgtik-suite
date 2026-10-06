"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { LoadingState, PageHeader, Tabs, TabsList, TabsPanel } from "@orgtik/ui";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { Gateways } from "@/components/commerce/Gateways";
import { TaxRules } from "@/components/commerce/TaxRules";
import { useUrlState } from "@/components/system/kit";

function Tax() {
  const t = useTranslations("Commerce");
  const url = useUrlState();
  const tab = url.get("tab") === "gateways" ? "gateways" : "rules";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("tax.title")} description={t("tax.description")} />
      <Tabs value={tab} onValueChange={(v) => url.set({ tab: v === "gateways" ? "gateways" : null })}>
        <TabsList
          items={[
            { value: "rules", label: t("tax.tabRules") },
            { value: "gateways", label: t("tax.tabGateways") },
          ]}
        />
        <TabsPanel value="rules" className="pt-6">
          <TaxRules />
        </TabsPanel>
        <TabsPanel value="gateways" className="pt-6">
          <Gateways />
        </TabsPanel>
      </Tabs>
    </div>
  );
}

export default function TaxPage() {
  return (
    <RequirePermission permission="tax:view">
      <Suspense fallback={<LoadingState />}>
        <Tax />
      </Suspense>
    </RequirePermission>
  );
}
