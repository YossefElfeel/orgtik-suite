"use client";
import { useTranslations } from "next-intl";
import { OnboardingChecklist, useSuite } from "@orgtik/ui";
import {
  useMarketingBootstrapQuery,
  useMarketingSendersQuery,
} from "@/redux/features/marketing-v3/marketingApi";
export default function MarketingOnboarding() {
  const t = useTranslations("MarketingV3"),
    suite = useSuite(),
    query = useMarketingBootstrapQuery(),
    senders = useMarketingSendersQuery(undefined, {
      skip: !query.data?.project,
    });
  if (!query.data) return null;
  const steps = [
    {
      id: "brand",
      title: t("brand"),
      complete: Boolean(query.data.data?.brandKit),
      href: "/settings/brand",
    },
    {
      id: "sender",
      title: t("senders"),
      complete: Boolean(senders.data?.some((row) => row.domain)),
      href: "/settings/senders",
    },
    {
      id: "connections",
      title: t("reviewConnections"),
      complete:
        suite.canConnect("marketing", "crm") &&
        suite.canConnect("marketing", "tasks"),
      href: suite.canAdmin("marketing") ? "/admin/connections" : undefined,
    },
    {
      id: "campaign",
      title: t("campaign"),
      complete: query.data.campaigns.some((row) => row.isComplete),
      href: "/campaigns",
    },
  ];
  if (steps.every((row) => row.complete)) return null;
  return (
    <details className="flex flex-col gap-3"><summary className="cursor-pointer text-body-sm font-semibold">{t("onboarding")}</summary>
      <p className="max-w-prose text-body-sm text-fg-muted">
        {t("onboardingHint")}
      </p>
      <OnboardingChecklist title={t("onboarding")} steps={steps} />
    </details>
  );
}
