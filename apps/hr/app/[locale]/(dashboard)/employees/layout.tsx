"use client";
import { Plus, TreeStructure as Network, Users } from "@phosphor-icons/react";

import MainHeader from "@/components/layout/ResourceHeader";
import { MenuTabItem, TabMenu } from "@/components/shared/TabMenu";
import { CreateUpdateEmployeeSheet } from "@/components/sheets/CreateUpdateEmployeeSheet";
import { ExportEmployeesButton } from "@/components/pages/employee/ExportEmployeesButton";
import { Button } from "@orgtik/ui";
import React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

function isEmployeeDetailRoute(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  // Check if it's /employees/[id] but not /employees/org-chart
  return (
    segments.length >= 3 &&
    (segments[1] === "employees" || segments[1] === "employee") &&
    segments[2] !== "org-chart"
  );
}

function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tEmployee = useTranslations("createUpdateEmployee");
  const t = useTranslations("employees");
  const normalizedPath = pathname.replace(/\/+$/, "");

  const TABS: MenuTabItem[] = [
    {
      key: "people",
      label: t("tabs.people"),
      icon: <Users className="size-4" />,
      path: "/employees",
    },
    {
      key: "org",
      label: t("tabs.org"),
      icon: <Network className="size-4" />,
      path: "/employees/org-chart",
    },
  ];

  const showViewToggle =
    !normalizedPath.includes("/employees/org-chart") &&
    !normalizedPath.includes("/employee/org-chart");
  const isDetail = isEmployeeDetailRoute(pathname);

  if (isDetail) {
    return <>{children}</>;
  }

  return (
    <>
      <MainHeader title={t("title")}>
        <div className="flex items-center gap-3">
          <ExportEmployeesButton className="h-10 gap-1.5 rounded-lg border-line bg-raised px-4 text-sm font-medium text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)] hover:bg-raised" />
          <CreateUpdateEmployeeSheet mode="create">
            <Button
              type="button"
              className="h-10 gap-1.5 rounded-lg px-4 text-sm font-medium"
            >
              <Plus className="size-4" />
              {tEmployee("addEmployee")}
            </Button>
          </CreateUpdateEmployeeSheet>
        </div>
      </MainHeader>

      <div className="flex items-end h-13 px-4">
        <TabMenu
          items={TABS}
          showViewToggle={showViewToggle}
          viewDefault="table"
        />
      </div>

      {children}
    </>
  );
}

export default EmployeeLayout;
