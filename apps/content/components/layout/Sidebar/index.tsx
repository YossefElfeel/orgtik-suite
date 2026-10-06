"use client";

import { UnifiedSidebar } from "@/components/special-shared/UnifiedSidebar";
import { useSidebarItems } from "./useSidebarItems";

export type { SidebarItem, SidebarChild } from "./useSidebarItems";

export function Sidebar() {
  const { sidebarItems, isActive, isActiveStartsWith } = useSidebarItems();

  return (
    <UnifiedSidebar
      filteredItems={sidebarItems}
      isActive={isActive}
      isActiveStartsWith={isActiveStartsWith}
      logo={{ src: "/logo-3.svg", alt: "logo", width: 160, height: 160 }}
    />
  );
}

export default Sidebar;
