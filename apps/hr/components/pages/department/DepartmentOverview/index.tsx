"use client";

import { useMemo, useState } from "react";
import type { DateRange } from "react-aria-components";
import {
  CalendarDate,
  getLocalTimeZone,
  today,
} from "@internationalized/date";
import MonthYearFilter from "@/components/shared/MonthYearFilter";
import { useGetDepartmentStatsQuery } from "@/redux/features/department/departmentApi";
import DepartmentCards from "../DepartmentCards";

type Props = {};

function formatRangeDate(date: CalendarDate): string {
  const jsDate = date.toDate(getLocalTimeZone());
  const year = jsDate.getFullYear();
  const month = String(jsDate.getMonth() + 1).padStart(2, "0");
  const day = String(jsDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthRange(): DateRange {
  const now = today(getLocalTimeZone());
  const currentMonthStart = new CalendarDate(now.year, now.month, 1);
  const currentMonthEnd = new CalendarDate(
    now.year,
    now.month,
    new Date(now.year, now.month, 0).getDate(),
  );

  return {
    start: currentMonthStart,
    end: currentMonthEnd,
  };
}

function DepartmentOverview({}: Props) {
  const [range, setRange] = useState<DateRange>(getCurrentMonthRange());

  const params = useMemo(() => {
    const from = range.start ? formatRangeDate(range.start as CalendarDate) : "";
    const to = range.end ? formatRangeDate(range.end as CalendarDate) : "";
    return { from, to };
  }, [range.end, range.start]);

  const { data, isLoading, isFetching } = useGetDepartmentStatsQuery(params, {
    skip: !params.from || !params.to,
  });

  return (
    <section className="main-padding space-y-5">
      <MonthYearFilter onChange={setRange} />
      <DepartmentCards
        stats={data?.data}
        isLoading={isLoading || isFetching}
      />
    </section>
  );
}

export default DepartmentOverview;
