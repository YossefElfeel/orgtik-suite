"use client";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@orgtik/ui";
import { RoleGate } from "@/components/shared/RoleGate";
import { PageTabs } from "@/components/shared/PageTabs";

// My tasks lists what's assigned to the person; viewers are never assigned (FS-TASKS-4).
export default function MyTasksLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("MyWork");
  return (
    <RoleGate allow={(p) => !p.isViewerOnly}>
      <section className="flex flex-col gap-6">
        <PageHeader title={t("title")} description={t("description")} />
        <PageTabs
          label={t("views")}
          tabs={[
            { href: "/my-tasks/overview", label: t("tabs.overview") },
            { href: "/my-tasks/lists", label: t("tabs.lists") },
            { href: "/my-tasks/calendar", label: t("tabs.calendar") },
          ]}
        />
        {children}
      </section>
    </RoleGate>
  );
}
