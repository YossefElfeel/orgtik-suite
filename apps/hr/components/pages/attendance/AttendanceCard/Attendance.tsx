"use client";
import { Flag } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { IAttendanceSummary } from "@/types/attendance";
import { useTranslations } from "next-intl";

export default function AttendanceCard({
  data,
  isLoading,
}: {
  data?: IAttendanceSummary;
  isLoading: boolean;
}) {
  const t = useTranslations("attendanceCard");
  const totalBars = 45;
  const attendancePercentage = data?.attendanceRate || 0;
  const activeBars = Math.floor(totalBars * (attendancePercentage / 100));

  if (isLoading) return <AttendanceCardSkeleton />;

  return (
    <div className="w-full border rounded-[10px] p-3 flex flex-col h-full min-h-[376px]">
      <div className="mb-15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 border border-line rounded-[8px]">
              <Flag size={20} />
            </div>
            <h2 className="text-[16px] font-medium">{t("title")}</h2>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-around flex-1 gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-medium">
              {data?.attendanceRateLabel || "0%"}
            </span>
            <span className="px-[6px] py-0.5 text-xs font-normal text-success bg-success-subtle rounded-[4px]">
              {data?.absenteeismRateLabel}
            </span>
          </div>
          <p className="text-secondary text-sm">{t("attendanceRate")}</p>
        </div>

        <div className="space-y-4 mt-auto">
          <div className="flex gap-1 h-20 items-end w-full overflow-hidden ">
            {[...Array(totalBars)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "100%", opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.01, ease: "easeOut" }}
                className={`rounded-full flex-1 ${
                  i < activeBars ? "bg-action-primary" : "bg-line-strong"
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatBox
              label={t("onTime")}
              value={data?.onTimeRateLabel || "0%"}
              color="bg-action-primary"
            />
            <StatBox
              label={t("late")}
              value={`${data?.lateOccurrences || 0}`}
              color="bg-warning-solid"
            />
            <StatBox
              label={t("notAttendYet")}
              value={`${data?.absentDays || 0}`}
              color="bg-line-strong"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-sunken p-4 rounded-[10px] flex flex-col items-center justify-center gap-1">
      <div className={`w-[21px] h-2 rounded-[2px] ${color}`} />
      <span className="text-fg-subtle text-[13px] whitespace-nowrap">
        {label}
      </span>
      <span className="text-[16px] font-medium">{value}</span>
    </div>
  );
}

function AttendanceCardSkeleton() {
  const totalBars = 45;

  return (
    <div className="w-full border rounded-[10px] p-3 flex flex-col h-full min-h-[376px] animate-pulse">
      <div className="mb-15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 border border-line rounded-[8px] bg-sunken" />
            <div className="h-5 w-32 bg-line rounded-md" />
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-around flex-1 gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 bg-line rounded-md" />
            <div className="h-5 w-12 bg-sunken rounded-[4px]" />
          </div>
          <div className="h-4 w-28 bg-sunken rounded-md" />
        </div>

        <div className="space-y-4 mt-auto">
          <div className="flex gap-1 h-20 items-end w-full overflow-hidden">
            {[...Array(totalBars)].map((_, i) => (
              <div
                key={i}
                className="rounded-full flex-1 bg-sunken"
                style={{
                  // A fixed uneven pattern: random heights differ between server and browser (hydration error).
                  height: `${40 + ((i * 37) % 60)}%`,
                }}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-sunken p-4 rounded-[10px] flex flex-col items-center justify-center gap-2"
              >
                <div className="w-[21px] h-2 rounded-[2px] bg-line" />
                <div className="h-3 w-12 bg-line rounded" />
                <div className="h-4 w-8 bg-line-strong rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
