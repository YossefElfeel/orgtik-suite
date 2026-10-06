"use client";
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight } from "@phosphor-icons/react";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  CalendarDate,
  getLocalTimeZone,
  today,
  parseDate,
} from "@internationalized/date";
import type { DateRange } from "react-aria-components";
import { Button } from "@/components/ui/button";
import { RangeCalendar } from "@orgtik/ui/dates";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rangeText } from "@/lib/date-range";

function getYears(range = 10): string[] {
  const current = new Date().getFullYear();
  return Array.from({ length: range }, (_, i) =>
    String(current - Math.floor(range / 2) + i),
  );
}

function calMonthStart(year: number, month: number): CalendarDate {
  return new CalendarDate(year, month + 1, 1);
}

function calMonthEnd(year: number, month: number): CalendarDate {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new CalendarDate(year, month + 1, lastDay);
}

type Props = {
  onChange?: (range: DateRange) => void;
};

export default function MonthYearFilter({ onChange }: Props) {
  const t = useTranslations("monthYearFilter");
  const tActions = useTranslations("actions");
  const format = useFormatter();
  // Day and month in the reader's language (it was always US English).
  const formatCalDate = (date: CalendarDate) =>
    format.dateTime(date.toDate(getLocalTimeZone()), { month: "long", day: "2-digit" });
  const now = today(getLocalTimeZone());

  const [year, setYear] = useState(now.year);
  const [monthIndex, setMonthIndex] = useState(now.month - 1);
  const [range, setRange] = useState<DateRange>({
    start: calMonthStart(now.year, now.month - 1),
    end: calMonthEnd(now.year, now.month - 1),
  });

  const years = getYears();

  function syncToMonth(newYear: number, newMonth: number) {
    const newRange: DateRange = {
      start: calMonthStart(newYear, newMonth),
      end: calMonthEnd(newYear, newMonth),
    };
    setYear(newYear);
    setMonthIndex(newMonth);
    setRange(newRange);
    onChange?.(newRange);
  }

  function handlePrev() {
    if (monthIndex === 0) syncToMonth(year - 1, 11);
    else syncToMonth(year, monthIndex - 1);
  }

  function handleNext() {
    if (monthIndex === 11) syncToMonth(year + 1, 0);
    else syncToMonth(year, monthIndex + 1);
  }

  function handleYearChange(value: string | null) {
    if (!value) return;
    syncToMonth(Number(value), monthIndex);
  }

  function handleRangeSelect(selected: DateRange) {
    setRange(selected);
    if (selected?.start) {
      setYear(selected.start.year);
      setMonthIndex(selected.start.month - 1);
    }
    if (selected?.start && selected?.end) {
      onChange?.(selected);
    }
  }

  const rangeLabel =
    range.start && range.end
      ? rangeText(format.dateTimeRange(
          (range.start as CalendarDate).toDate(getLocalTimeZone()),
          (range.end as CalendarDate).toDate(getLocalTimeZone()),
          { month: "long", day: "2-digit" },
        ))
      : range.start
        ? formatCalDate(range.start as CalendarDate)
        : t("selectRange");

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Year selector */}
      <Select value={String(year)} onValueChange={handleYearChange}>
        <SelectTrigger aria-label={tActions("year")} className="h-10 min-w-[140px] cursor-pointer rounded-lg border bg-transparent px-3 text-sm font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month range navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={handlePrev}
          aria-label={t("prevMonth")}
        >
          <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        </Button>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="lg"
                className="min-w-[220px] text-center text-sm font-medium"
              >
                {rangeLabel}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-2" align="center">
            {/* The library calendar takes ISO dates; this filter keeps React Aria's CalendarDate range for its callers. */}
            <RangeCalendar
              className="p-3"
              value={range.start && range.end ? { start: range.start.toString(), end: range.end.toString() } : null}
              onChange={(r) => handleRangeSelect({ start: parseDate(r.start), end: parseDate(r.end) })}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={handleNext}
          aria-label={t("nextMonth")}
        >
          <ChevronRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
