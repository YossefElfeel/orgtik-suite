"use client";
import { ChartPie as PieChart } from "@phosphor-icons/react";
import { useState } from "react";
import { IAttendanceSummary } from "@/types/attendance";
import { useGetDepartmentsOptionsQuery } from "@/redux/features/department/departmentApi";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { useTranslations } from "next-intl";

interface WorkingHourPerformanceProps {
  data?: IAttendanceSummary;
  isLoading: boolean;
  onDepartmentChange: (id: number | undefined) => void;
}

const WorkingHourPerformance = ({
  data,
  isLoading,
  onDepartmentChange,
}: WorkingHourPerformanceProps) => {
  const t = useTranslations("workingHourPerformance");
  const { data: responseDept } = useGetDepartmentsOptionsQuery();
  const [activeTab, setActiveTab] = useState<number | string>("all");

  const score = data?.workCompletionRate || 0;
  const workingHours = data?.totalWorkLabel || "00:00:00";

  const statusText =
    score >= 90 ? t("status.excellentPerformance") : t("status.needsImprovement");

  const totalSegments = 20;
  const activeSegments = Math.round(
    totalSegments * (Math.min(score, 100) / 100),
  );

  const handleTabClick = (id: number | string) => {
    setActiveTab(id);
    if (id === "all") {
      onDepartmentChange(undefined);
    } else {
      onDepartmentChange(Number(id));
    }
  };

  if (isLoading) {
    return <WorkingHourPerformanceSkeleton />;
  }

  return (
    <div className="w-full border rounded-[10px] p-3 flex flex-col h-full min-h-[376px] bg-raised">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 border rounded-[8px] bg-sunken">
          <PieChart size={20} className="text-fg-muted" />
        </div>
        <h3 className="font-medium text-[16px] text-fg">
          {t("title")}
        </h3>
      </div>
      <RoleGuard allowedRoles={["hr", "manager", "super_admin"]}>
        {/* Tabs / Categories */}
        <div role="group" aria-label={t("title")} className="flex gap-1 overflow-x-auto mb-4 no-scrollbar bg-sunken p-1 rounded-[8px]">
          <button
            type="button"
            aria-pressed={activeTab === "all"}
            onClick={() => handleTabClick("all")}
            className={`flex-1 px-4 py-1.5 rounded-[6px] text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "all"
                ? "bg-raised text-fg shadow-sm"
                : "text-fg-subtle hover:text-fg-muted"
            }`}
          >
            {t("allDepartments")}
          </button>

          {responseDept?.data?.data?.map((dept: any) => (
            <button
              key={dept.id}
              type="button"
              aria-pressed={activeTab === dept.id}
              onClick={() => handleTabClick(dept.id)}
              className={`flex-1 px-4 py-1.5 rounded-[6px] text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === dept.id
                  ? "bg-raised text-fg shadow-sm"
                  : "text-fg-subtle hover:text-fg-muted"
              }`}
            >
              <bdi>{dept.name}</bdi>
            </button>
          ))}
        </div>
      </RoleGuard>

      {/* Gauge Chart */}
      <div className="relative flex-1 flex flex-col items-center justify-center mb-5">
        <svg viewBox="0 0 200 120" className="w-full max-w-[280px]">
          {[...Array(totalSegments)].map((_, i) => {
            const angle = -90 + (i * 180) / (totalSegments - 1);
            const isActive = i < activeSegments;
            return (
              <rect
                key={i}
                x="94"
                y="5"
                width="10"
                height="32"
                rx="6"
                transform={`rotate(${angle}, 100, 100)`}
                fill={isActive ? "var(--ot-viz-1)" : "var(--ot-bg-sunken)"}
              />
            );
          })}
        </svg>

        <div className="absolute bottom-4 text-center">
          <h2 className="text-2xl font-bold text-fg">
            {data?.workCompletionRateLabel || "0%"}
          </h2>
          <p className="text-fg-subtle text-xs font-medium mt-1 uppercase tracking-wider">
            {statusText}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        <div className="bg-sunken p-3 rounded-[10px] border border-line">
          <p className="text-fg-subtle text-xs mb-1 font-medium">
            {t("employeePerf")}
          </p>
          <p className="text-lg font-semibold text-fg">
            {data?.attendanceRateLabel || "0%"}
          </p>
        </div>
        <div className="bg-sunken p-3 rounded-[10px] border border-line">
          <p className="text-fg-subtle text-xs mb-1 font-medium">
            {t("workingHour")}
          </p>
          <p className="text-lg font-semibold text-fg">{workingHours}</p>
        </div>
      </div>
    </div>
  );
};

export default WorkingHourPerformance;

// Skeleton remain unchanged but with text removal simulation
function WorkingHourPerformanceSkeleton() {
  return (
    <div className="w-full border rounded-[10px] p-3 flex flex-col h-full min-h-[376px] animate-pulse bg-raised">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 border rounded-[8px] bg-sunken" />
        <div className="h-5 w-40 bg-line rounded-md" />
      </div>
      <div className="flex gap-1 mb-4 bg-sunken p-1 rounded-[8px]">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-1 h-8 bg-line rounded-[6px]" />
        ))}
      </div>
      <div className="relative flex-1 flex flex-col items-center justify-center mb-5">
        <div className="w-full max-w-[200px] aspect-[2/1] border-[10px] border-b-0 border-line rounded-t-full relative" />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-auto">
        <div className="h-16 bg-sunken rounded-[10px]" />
        <div className="h-16 bg-sunken rounded-[10px]" />
      </div>
    </div>
  );
}
