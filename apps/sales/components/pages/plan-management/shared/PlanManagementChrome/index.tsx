"use client";

import { usePathname } from "@/i18n/routing";
import MainHeader from "@/components/shared/MainHeader";
import { PlanManagementTabs } from "@/components/pages/plan-management/shared/PlanManagementTabs";
import { useRole } from "@/hooks/useRole";
import { useTranslations } from "next-intl";

const LIST_SEGMENTS = new Set([
  "plan-management",
  "departments",
  "categories",
  "features",
  "duration",
  "zones",
]);

export function PlanManagementChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isCustomer, isReady } = useRole();
  const t = useTranslations("planManagement.chrome");
  const segment = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const isDetailPage = segment !== "" && !LIST_SEGMENTS.has(segment);

  if (!isReady) {
    return <>{children}</>;
  }

  // Customers browse plans only — no admin chrome / section tabs.
  if (isCustomer || isDetailPage) {
    return <>{children}</>;
  }

  return (
    <section className="flex min-w-0 flex-col gap-6">
      <MainHeader
        title={t("planManagement")}
        description={t("planManagementDesc")}
      />
      <PlanManagementTabs />
      {children}
    </section>
  );
}
