"use client";
import { AirplaneTakeoff as PlaneTakeoff, CalendarDots as CalendarClock } from "@phosphor-icons/react";

import { useMemo, useState } from "react";
import { TabMenu } from "@/components/shared/TabMenu";
import DataTable from "@/components/bindings/ResourceTable";
import { SectionCard } from "../SectionCard";
import type { IDaysOffInformation } from "@/types/employee";
import { InfoCardSkeleton } from "@/components/shared/EmployeeFacts";
import { Skeleton } from "@orgtik/ui";
import {
  useGetEmployeeAttendanceQuery,
  useGetEmployeeLeavesQuery,
} from "@/redux/features/employee/employeeApi";
import { getAttendanceColumns, leaveColumns } from "./columns";
import { useFormatter, useTranslations } from "next-intl";

type TimeOffAttendanceSectionProps = {
  employeeId: string | number;
  daysOffInformation?: IDaysOffInformation;
  isLoading?: boolean;
};

export function TimeOffAttendanceSection({
  employeeId,
  daysOffInformation,
  isLoading: isEmployeeLoading,
}: TimeOffAttendanceSectionProps) {
  const t = useTranslations("employees.details.timeOff");
  const tTable = useTranslations("attendanceTable");
  const tTypes = useTranslations("leaveTypes");
  const format = useFormatter();

  const [activeTimeTab, setActiveTimeTab] = useState<"attendance" | "leave">(
    "attendance",
  );

  const [attendancePage, setAttendancePage] = useState(1);
  const [leavesPage, setLeavesPage] = useState(1);

  const { data: attendanceRes, isLoading: isAttendanceLoading, isError: isAttendanceError, refetch: refetchAttendance } =
    useGetEmployeeAttendanceQuery(
      { id: employeeId, page: attendancePage, limit: 10 },
      { skip: activeTimeTab !== "attendance" },
    );

  const { data: leavesRes, isLoading: isLeavesLoading, isError: isLeavesError, refetch: refetchLeaves } =
    useGetEmployeeLeavesQuery(
      { id: employeeId, page: leavesPage, limit: 10 },
      { skip: activeTimeTab !== "leave" },
    );

  const attendanceData = attendanceRes?.data?.items || [];
  const attendanceMeta = attendanceRes?.data?.meta;

  const leavesData = leavesRes?.data?.items || [];
  const leavesSummary = leavesRes?.data?.summary;
  const leavesMeta = leavesRes?.data?.meta;

  const enhancedLeaveSummary = useMemo(() => {
    if (!leavesSummary) return [];

    // Each card: the number with its words (ICU, so plurals read right) and a short line under it.
    const cardMapping: Record<string, { value: (count: number) => string; sub: string }> = {
      paidTimeOffDays: {
        value: (count) => t("values.paidTimeOff", { count }),
        sub: t("subs.availableToBook"),
      },
      pendingApprovalDays: {
        value: (count) => t("values.pendingApproval", { count }),
        sub: t("subs.awaitingApproval"),
      },
      bookedDays: {
        value: (count) => t("values.booked", { count }),
        sub: t("subs.used", { count: leavesSummary.usedDays || 0 }),
      },
      availableToBookDays: {
        value: (count) => t("values.paidTimeOff", { count }),
        sub: t("subs.remainingBalance"),
      }, // Fixed label to match PTOD
      awaitingApprovalDays: {
        value: (count) => t("values.pendingApproval", { count }),
        sub: t("subs.currentQueue"),
      },
      usedDays: { value: (count) => t("values.used", { count }), sub: t("subs.takenDays") },
      contractDaysPerYear: {
        value: (count) => t("values.daysPerYear", { count }),
        sub: t("subs.inContract"),
      },
      nationalHolidaysDays: {
        value: (count) => t("values.nationalHolidays", { count }),
        sub: t("subs.holidayList"),
      },
      inContractDays: {
        value: (count) => t("values.inContract", { count }),
        sub: t("subs.totalContract"),
      },
    };

    return Object.entries(leavesSummary)
      .filter(([key]) => key !== "usedDays") // usually used as a sub-label or separate, but following common UI patterns
      .map(([key, value]) => {
        const config = cardMapping[key];
        return {
          id: key,
          // A summary field this screen doesn't know yet shows its number only.
          value: config ? config.value(Number(value) || 0) : format.number(Number(value) || 0),
          sub: config?.sub ?? "",
        };
      });
  }, [leavesSummary, t, format]);

  const isLoading =
    isEmployeeLoading ||
    (activeTimeTab === "attendance" ? isAttendanceLoading : isLeavesLoading);

  const attendanceColumns = useMemo(
    () => getAttendanceColumns(t, tTable),
    [t, tTable],
  );
  const tDetails = useTranslations("employees.details");
  const tDuration = useTranslations("timeOffTable.duration");
  const leaveCols = useMemo(() => leaveColumns(t, tTypes, tDuration), [t, tTypes, tDuration]);

  if (isEmployeeLoading) {
    return (
      <InfoCardSkeleton itemCount={0}>
        <div className="space-y-6">
          <div className="flex gap-4 border-b pb-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-32" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </InfoCardSkeleton>
    );
  }

  return (
    <SectionCard
      title={t("title")}
      icon={CalendarClock}
      action={
        <span className="text-xs font-medium text-secondary">{tDetails("activity.allTime")}</span>
      }
    >
      <TabMenu
        className="pb-4"
        defaultActive={activeTimeTab}
        onChange={(key) => setActiveTimeTab(key as "attendance" | "leave")}
        items={[
          {
            key: "attendance",
            label: t("attendance"),
            icon: <CalendarClock className="size-5" />,
          },
          {
            key: "leave",
            label: t("leaveBalances"),
            icon: <PlaneTakeoff className="size-5" />,
          },
        ]}
      />

      {activeTimeTab === "attendance" ? (
        <DataTable
          columns={attendanceColumns}
          data={attendanceData}
          isLoading={isAttendanceLoading}
        isError={isAttendanceError}
        onRetry={refetchAttendance}
          pagination={
            attendanceMeta
              ? {
                  currentPage: attendanceMeta.page,
                  totalPages: attendanceMeta.totalPages,
                  limit: attendanceMeta.limit,
                  totalItems: attendanceMeta.total,
                  onPageChange: (page) => setAttendancePage(page),
                }
              : undefined
          }
          emptyMessage={t("noAttendance")}
        />
      ) : (
        <div className="space-y-6">
          {isLeavesLoading && !leavesSummary ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {enhancedLeaveSummary.map((card) => (
                <div
                  key={card.id}
                  className="rounded-xl border border-border bg-gray px-4 py-3"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {card.value}
                  </p>
                  <p className="text-xs text-secondary">{card.sub}</p>
                </div>
              ))}
            </div>
          )}

          <DataTable
            columns={leaveCols}
            data={leavesData}
            isLoading={isLeavesLoading}
        isError={isLeavesError}
        onRetry={refetchLeaves}
            pagination={
              leavesMeta
                ? {
                    currentPage: leavesMeta.page,
                    totalPages: leavesMeta.totalPages,
                    limit: leavesMeta.limit,
                    totalItems: leavesMeta.total,
                    onPageChange: (page) => setLeavesPage(page),
                  }
                : undefined
            }
            emptyMessage={t("noLeave")}
          />
        </div>
      )}
    </SectionCard>
  );
}
