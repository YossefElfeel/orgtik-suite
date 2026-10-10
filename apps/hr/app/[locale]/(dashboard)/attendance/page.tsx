"use client";
import MainHeader from "@/components/layout/ResourceHeader";
import AddTimeDialog from "@/components/pages/attendance/AddTimeDialog";
import AttendanceCard from "@/components/pages/attendance/AttendanceCard/Attendance";
import AttendanceTable from "@/components/pages/attendance/AttendanceTable";
import Insight from "@/components/pages/attendance/Insight";
import StatsCard from "@/components/pages/attendance/StatsCard";
import WorkingHourPerformance from "@/components/pages/attendance/WorkingHourPerformance";
import { useTranslations } from "next-intl";
import { useGetAttendanceSummaryQuery } from "@/redux/features/attendance/attendanceApi";
import { useState } from "react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { useGetRole } from "@/hooks/useGetRole";
import { AddNewTicketDialog } from "@/components/pages/tickets/AddNewTicketDialog";

function Attendance() {
  const t = useTranslations("attendance");
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(
    undefined,
  );
  const { data: response, isLoading } = useGetAttendanceSummaryQuery({
    departmentId: selectedDeptId,
  });
  const summary = response?.data;

  return (
    <div>
      <MainHeader
        title={t("pageTitle")}
        children={
          <div
            key="attendance-header-actions"
            className="flex items-center gap-2.5  "
          >
            <RoleGuard allowedRoles={["hr", "manager", "super_admin"]}>
              <AddTimeDialog />
            </RoleGuard>
            <RoleGuard allowedRoles={["employee", "finance_manager"]}>
              <AddNewTicketDialog />
            </RoleGuard>
          </div>
        }
      />
      <div className="main-padding ">
        <div className="min-h-96">
          <div className="grid-attendance-layout">
            {/* Left */}
            <div className="h-full">
              <AttendanceCard data={summary} isLoading={isLoading} />
            </div>

            {/* Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-[1fr_1.3fr] gap-3 h-full">
              {/* <RoleGuard allowedRoles={["employee"]}> */}
              <RoleGuard allowedRoles={["hr", "manager", "super_admin"]}>
                <StatsCard data={summary} isLoading={isLoading} />
              </RoleGuard>

              <div className="h-full">
                <WorkingHourPerformance
                  data={summary}
                  isLoading={isLoading}
                  onDepartmentChange={setSelectedDeptId}
                />
              </div>
            </div>
          </div>
          <div className="py-4 ">
            <Insight data={summary} isLoading={isLoading} />
          </div>
        </div>
      </div>

      <AttendanceTable />
    </div>
  );
}

export default Attendance;
