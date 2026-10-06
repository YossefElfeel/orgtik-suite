"use client";

// The month and the view live in the address (FS-HR-4): a shared link or a refresh opens the same
// month, and the grid's own arrows replace the separate month filter, which fetched one month while
// the grid kept drawing another.
import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { parseDate, startOfMonth, today, type CalendarDate } from "@internationalized/date";
import { useGetCalendarQuery } from "@/redux/features/timeOff/timeOffApi";
import { useGetDepartmentsOptionsQuery } from "@/redux/features/department/departmentApi";
import CalendarSidebar from "@/components/pages/calendar/CalendarSidebar";
import CalendarView from "@/components/pages/calendar/CalendarView";
import { usePathname, useRouter } from "@/i18n/routing";
import { ORG_TIME_ZONE } from "@/constants/dates";

export default function CalendarPage() {
  const t = useTranslations("calendar");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const setParams = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) (v ? sp.set(k, v) : sp.delete(k));
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const now = today(ORG_TIME_ZONE);
  const view = params.get("view") === "week" ? "week" : "month";
  const month: CalendarDate = useMemo(() => {
    const raw = params.get("date");
    try {
      return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? parseDate(raw) : now;
    } catch {
      return now;
    }
  }, [params, now]);

  const [eventTypes, setEventTypes] = useState<string | undefined>(undefined);
  const [selectedDept, setSelectedDept] = useState<string>("");

  // The API's month runs from the Sunday before the 1st to the Saturday after the last day, so it
  // also covers a week view that starts on Monday or Saturday.
  const { data, isLoading, isFetching, isError, refetch } = useGetCalendarQuery({
    period: "month",
    date: (view === "month" ? startOfMonth(month) : month).toString(),
    eventType: eventTypes,
    departmentId: selectedDept ? parseInt(selectedDept) : undefined,
  });

  const { data: responseDept } = useGetDepartmentsOptionsQuery();
  const departments = responseDept?.data?.data || [];

  const calendarData = data?.data?.days || {};
  const summaryData = data?.data?.summary;

  return (
    <div className="main-padding space-y-6">
      {/* The section header (CalendarLayoutHeader) already titles the page; a second title repeated it (HR-033). */}
      <p className="text-sm text-secondary">{t("description")}</p>

      <div className="flex flex-col lg:flex-row gap-3 mt-5">
        <aside className="w-full lg:w-[280px] shrink-0 h-fit lg:sticky lg:top-6 relative" aria-busy={isFetching}>
          <CalendarSidebar
            summary={summaryData}
            departments={departments}
            selectedType={eventTypes}
            onTypeChange={setEventTypes}
            selectedDept={selectedDept}
            onDeptChange={setSelectedDept}
          />
        </aside>

        <div className="flex-1 min-w-0 bg-raised rounded-[24px] p-4">
          <CalendarView
            days={calendarData}
            view={view}
            month={month}
            onViewChange={(v) => setParams({ view: v === "month" ? null : v })}
            onMonthChange={(d) => setParams({ date: d.compare(now) === 0 ? null : d.toString() })}
            status={isLoading ? "loading" : isError ? "error" : "ready"}
            onRetry={refetch}
          />
        </div>
      </div>
    </div>
  );
}
