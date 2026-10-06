"use client";

import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Sidebar } from "../Sidebar";
import { ProfileDropdown } from "./profile-dropdown";
import { NotificationDropdown } from "./notification-dropdown";
import LocaleSwitcher from "@/components/shared/Locale/LocaleSwitcher";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between bg-white h-[72px] border border-gray-200 rounded-lg mt-2 md:mx-3 px-3 sticky top-0 z-50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/*  Mobile */}
        <div className="lg:hidden">
          <Sidebar />
        </div>

        {/* Breadcrumb  */}
        <div className="truncate hidden lg:block">
          <Breadcrumb />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <LocaleSwitcher />

        {/* <NotificationDropdown /> */}

        <ProfileDropdown />
      </div>
    </header>
  );
}
