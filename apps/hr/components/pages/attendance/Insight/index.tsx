"use client";
import React from "react";
import { IAttendanceSummary } from "@/types/attendance";
import { useFormatter, useTranslations } from "next-intl";

interface InsightItemProps {
  label: string;
  value: string;
  percentage?: string;
  isNegative?: boolean;
}

const Insight = ({
  data,
  isLoading,
}: {
  data?: IAttendanceSummary;
  isLoading: boolean;
}) => {
  const t = useTranslations("insight");
  const format = useFormatter();
  const insightData = [
    {
      label: t("absenteeismRate"),
      value: t("daysCount", { count: data?.absentDays || 0 }),
    },
    {
      label: t("lateOccurrences"),
      value: `${data?.lateOccurrences || 0}`,
    },
    {
      label: t("totalWorkTime"),
      value: data?.totalWorkLabel || "00:00:00",
    },
    {
      label: t("attendanceRate"),
      value: format.number((data?.attendanceRate || 0) / 100, {
        style: "percent",
        maximumFractionDigits: 1,
      }),
      percentage: "",
      isNegative: false,
    },
  ];

  return (
    <div className="w-full bg-raised rounded-lg">
      <h2 className="text-[16px] font-medium mb-4">{t("title")}</h2>

      <div className="flex flex-wrap items-start justify-between gap-8 sm:gap-4">
        {insightData.map((item, index) => (
          <InsightItem key={index} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
};

export default Insight;

const InsightItem = ({
  label,
  value,
  percentage,
  isNegative,
}: InsightItemProps) => {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-fit">
      <span className="text-secondary text-sm ">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-fg text-lg font-medium ">{value}</span>
        {percentage && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-2xl flex items-center justify-center ${
              isNegative
                ? "bg-danger-subtle text-danger"
                : "bg-success-subtle text-success"
            }`}
          >
            {percentage}
          </span>
        )}
      </div>
    </div>
  );
};
