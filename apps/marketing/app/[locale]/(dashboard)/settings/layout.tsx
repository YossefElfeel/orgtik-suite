"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@orgtik/ui";
import SettingsSidebar from "@/components/layout/SettingsSidebar";

// Settings: the project's details and its team (FS-MKT-5). One column on phones, the section nav
// beside the content from md up; the shell scrolls the page, so there is no second scrollbar
// (MKT-038). The permissions, preferences and notifications stubs are gone (MKT-035).
export default function SettingsLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("SettingsNav"),
    tv = useTranslations("MarketingV3");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <SettingsSidebar
          label={t("label")}
          settingsItems={[
            { label: t("project"), path: "/settings" },
            { label: t("team"), path: "/settings/teams" },
            { label: tv("brand"), path: "/settings/brand" },
            { label: tv("senders"), path: "/settings/senders" },
            { label: tv("utmSettings"), path: "/settings/utm" },
          ]}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
