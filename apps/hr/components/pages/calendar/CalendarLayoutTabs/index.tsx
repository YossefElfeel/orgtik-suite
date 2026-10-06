"use client";
import { TreeStructure as Network, Users } from "@phosphor-icons/react";

import { MenuTabItem, TabMenu } from "@/components/shared/TabMenu";
import { useTranslations } from "next-intl";

export const CalendarLayoutTabs = () => {
  const t = useTranslations("calendar");

  const TABS: MenuTabItem[] = [
    {
      key: "calendar",
      label: t("tabs.calendar"),
      icon: <Users className="size-4" />,
      path: "/calendar",
    },
    {
      key: "leave-balances",
      label: t("tabs.leaveBalances"),
      icon: <Network className="size-4" />,
      path: "/calendar/leave-balances",
    },
  ];

  return (
    <div className="flex items-end h-13 px-4">
      <TabMenu items={TABS} viewDefault="table" />
    </div>
  );
};

export default CalendarLayoutTabs;
