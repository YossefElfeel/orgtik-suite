"use client";
import { Clock, TrendDown as TrendingDown, TrendUp as TrendingUp, Users } from "@phosphor-icons/react";
import { IAttendanceSummary } from "@/types/attendance";
import { useFormatter, useTranslations } from "next-intl";

const StatsCardSkeleton = () => (
  <div className="flex flex-col w-full gap-3 h-full min-h-[376px] animate-pulse">
    {[1, 2].map((i) => (
      <div
        key={i}
        className="w-full rounded-[10px] p-3 border flex-1 flex flex-col bg-raised"
      >
        <div className="flex items-center gap-2 mb-7">
          <div className="p-2 border rounded-[8px] bg-sunken w-9 h-9" />
          <div className="h-4 bg-line rounded w-32" />
        </div>

        <div className="h-full flex-1 flex flex-col justify-end">
          <div className="lg:mb-0.5 md:mb-2 mb-1 flex items-baseline gap-1">
            <div className="h-8 bg-line rounded w-16" />
            <div className="h-5 bg-sunken rounded w-12" />
          </div>

          <div className="flex items-center justify-between bg-sunken rounded-[8px] p-2 mt-1">
            <div className="h-4 bg-line rounded w-16" />
            <div className="h-6 bg-line rounded w-14" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const StatsCard = ({
  data,
  isLoading,
}: {
  data?: IAttendanceSummary;
  isLoading: boolean;
}) => {
  const t = useTranslations("statsCard");
  const format = useFormatter();

  if (isLoading) return <StatsCardSkeleton />;

  const dashboardStats = [
    {
      id: 1,
      title: t("employeeAttend"),
      currentValue: data?.employeeAttendance?.presentDays?.toString() || "0",
      totalValue: data?.employeeAttendance?.workingDays?.toString() || "0",
      trend: data?.employeeAttendance?.lastWeekPercentageDelta || 0,
      isPositive: (data?.employeeAttendance?.lastWeekPercentageDelta || 0) >= 0,
      icon: "users",
    },
    {
      id: 2,
      title: t("totalLogHours"),
      currentValue: data?.totalLogHours?.totalWorkLabel || "00:00:00",
      totalValue: data?.totalLogHours?.expectedWorkLabel || "00:00:00",
      trend: data?.totalLogHours?.lastWeekPercentageDelta || 0,
      isPositive: (data?.totalLogHours?.lastWeekPercentageDelta || 0) >= 0,
      icon: "clock",
    },
  ];

  return (
    <div className="flex flex-col w-full gap-3 h-full min-h-[376px]">
      {dashboardStats.map((stat) => (
        <div
          key={stat.id}
          className="w-full rounded-[10px] p-3 border flex-1 flex flex-col bg-raised"
        >
          <div className="flex items-center gap-2 mb-7">
            <div className="p-2 border rounded-[8px] bg-sunken">
              {stat.icon === "users" ? (
                <Users size={20} className="text-fg-muted" />
              ) : (
                <Clock size={20} className="text-fg-muted" />
              )}
            </div>
            <h3 className="text-[16px] font-medium text-fg-muted">
              {stat.title}
            </h3>
          </div>

          <div className="h-full flex-1 flex flex-col justify-end">
            <div className="lg:mb-0.5 md:mb-2 mb-1 flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-fg">
                {stat.currentValue}
              </span>
              <span className="text-fg-subtle text-[16px]">
                /{stat.totalValue}
              </span>
            </div>

            <div className="flex items-center justify-between bg-sunken rounded-[8px] p-2 mt-1">
              <span className="text-fg-subtle text-sm ">{t("lastWeek")}</span>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-[6px] text-[12px] font-medium ${
                  stat.isPositive
                    ? "bg-success-subtle text-success"
                    : "bg-danger-subtle text-danger"
                }`}
              >
                {stat.isPositive ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {format.number(Math.abs(stat.trend) / 100, {
                  style: "percent",
                  maximumFractionDigits: 1,
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCard;
