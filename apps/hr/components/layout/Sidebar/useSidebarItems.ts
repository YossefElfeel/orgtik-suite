"use client";

import { useUserRoles } from "@/hooks/useUserRoles";
import { usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";

import { SidebarItem } from "@/types/sidebar";
import { rolesFor } from "@/constants/route-roles";
import { useCallback, useMemo } from "react";

export const useSidebarItems = () => {
  const pathname = usePathname();
  const { roles: userRoles } = useUserRoles();
  const t = useTranslations("sidebar");
  const SIDEBAR_ITEMS: SidebarItem[] = [
    {
      titleKey: "sections.main",
      items: [
        {
          labelKey: "items.attendance",
          path: "/attendance",
        },
        {
          labelKey: "items.calendar",
          path: "/calendar",
          roles: [
            "hr",
            "manager",
            "super_admin",
            "employee",
            "finance_manager",
          ],
        },
        {
          labelKey: "items.employee",
          path: "/employees",
          roles: ["hr", "super_admin"],
        },
        {
          labelKey: "items.projects",
          path: "/projects",
          roles: ["hr", "super_admin"],
        },
        {
          labelKey: "items.department",
          path: "/department",
          roles: ["hr", "super_admin"],
        },
      ],
    },
    {
      titleKey: "sections.management",

      items: [
        {
          labelKey: "items.timeOff",
          path: "/time-off",
          roles: ["hr", "manager", "super_admin"],
        },
        {
          labelKey: "items.payroll",
          path: "/payroll",
          roles: ["hr", "super_admin"],
        },
        {
          labelKey: "items.myPayslips",
          path: "/my-payslips",
          roles: ["employee", "hr", "manager", "finance_manager"],
        },
        {
          labelKey: "items.loans",
          path: "/loans",
          roles: ["hr", "super_admin","finance_manager"],
        },
      ],
    },
    {
      titleKey: "sections.hiring",
      items: [
        {
          labelKey: "items.overall",
          path: "/hiring/overall",
          roles: ["hr", "super_admin"],
        },
        {
          labelKey: "items.jobHiring",
          path: "/hiring/jobs",
          roles: ["hr", "super_admin"],
        },
        {
          labelKey: "items.candidates",
          path: "/candidates",
          roles: ["hr", "super_admin"],
        },
        {
          labelKey: "items.rejected",
          path: "/rejected",
          roles: ["hr", "super_admin"],
        },
      ],
    },

    {
      titleKey: "sections.communication",
      items: [
        {
          labelKey: "items.tickets",
          path: "/tickets",
        },
      ],
    },
    {
      titleKey: "sections.settings",

      items: [
        {
          labelKey: "items.configuration",
          path: "/configuration",
          roles: ["hr", "super_admin"],
        },
      ],
    },
    {
      titleKey: "sections.finance",
      items: [
        {
          labelKey: "items.financeQueue",
          path: "/finance-queue",
          roles: ["finance_manager", "super_admin"],
        },
      ],
    },
  ];

  const isActive = ({ path }: { path: string }) => pathname === path;

  const filteredSidebarItems = useMemo(() => {
    return SIDEBAR_ITEMS.map((section) => ({
      ...section,
      title: section.titleKey ? t(section.titleKey) : section.title,
      items: section.items
        .filter((item) => {
          // The same table as the pages (constants/route-roles), so a hidden link is also a closed page.
          const needed = rolesFor(item.path) ?? item.roles;
          if (!needed || needed.length === 0) return true;
          return needed.some((role) => userRoles.some((mine) => mine === role));
        })
        .map((item) => ({
          ...item,
          label: item.labelKey ? t(item.labelKey) : item.label,
        })),
    })).filter((section) => section.items.length > 0);
  }, [userRoles, SIDEBAR_ITEMS, t]);

  const isActiveStartsWith = useCallback(
    ({ path }: { path: string }) => {
      if (path === "/") return pathname === "/";

      const splitPathName = pathname.split("/").filter(Boolean);
      const splitPath = path.split("/").filter(Boolean);

      return splitPath.every((part, i) => splitPathName[i] === part);
    },
    [pathname],
  );

  return {
    sidebarItems: filteredSidebarItems,
    isActiveStartsWith,
  };
};

export default useSidebarItems;
