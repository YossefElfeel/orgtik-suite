"use client";

import MainHeader from "@/components/layout/ResourceHeader";
import AddTimeDialog from "@/components/pages/attendance/AddTimeDialog";
import { ScheduleMeetingDialog } from "@/components/pages/time-off/ScheduleMeetingDialog";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { useTranslations } from "next-intl";

export const CalendarLayoutHeader = () => {
  const t = useTranslations("calendar");

  return (
    <MainHeader title={t("title")}>
      <div className="flex items-center gap-3">
        <RoleGuard allowedRoles={["employee"]}>
          <AddTimeDialog />
        </RoleGuard>
        <RoleGuard allowedRoles={["hr", "manager", "super_admin"]}>
          <ScheduleMeetingDialog />
        </RoleGuard>
      </div>
    </MainHeader>
  );
};

export default CalendarLayoutHeader;
