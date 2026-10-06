"use client";

import React from "react";
import { usePathname } from "next/navigation";
import CalendarLayoutHeader from "@/components/pages/calendar/CalendarLayoutHeader";
import CalendarLayoutTabs from "@/components/pages/calendar/CalendarLayoutTabs";

function isEmployeeDetailRoute(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return (
    segments.length >= 3 &&
    segments[1] === "ui-refrence" &&
    segments[2] !== "calendar" &&
    segments[2] !== "leave-balances"
  );
}

function EmployeeLayout({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const isDetail = isEmployeeDetailRoute(pathname);

  if (isDetail) {
    return <>{children}</>;
  }

  return (
    <>
      <CalendarLayoutHeader />
      <CalendarLayoutTabs />
      {children}
    </>
  );
}

export default EmployeeLayout;
