"use client";

import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@orgtik/ui";
import { Checkbox } from "@orgtik/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { DateTimeFormElement } from "@/components/ui/form/date-time-form-element";

// ISO weekdays, as the API stores them: 1 is Monday, 7 is Sunday.
const DAYS = [1, 2, 3, 4, 5, 6, 7];

// 1 January 2024 was a Monday; noon UTC is the same date in every time zone.
const weekdayDate = (isoDay: number) => new Date(Date.UTC(2024, 0, isoDay, 12));

const AttendanceScheduleFields: React.FC = () => {
  const t = useTranslations("configuration");
  const format = useFormatter();
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{t("attendanceSchedule")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DateTimeFormElement
          name="attendance.schedule.effectiveFrom"
          label={t("effectiveFrom")}
          showTime={false}
          returnFormat="dd-mm-yyyy"
        />

        <FormField
          control={control}
          name="attendance.schedule.gracePeriodMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("gracePeriodMinutes")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="attendance.schedule.dayStartTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("dayStartTime")}</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="attendance.schedule.dayEndTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("dayEndTime")}</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="attendance.schedule.workingDays"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("workingDays")}</FormLabel>
            <div className="flex flex-wrap gap-6 pt-2 w-fit">
              {DAYS.map((day) => (
                <FormItem
                  key={day}
                  className="flex flex-row items-start space-x-3 space-y-0"
                >
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(day)}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...field.value, day])
                          : field.onChange(
                            field.value?.filter(
                              (value: number) => value !== day
                            )
                          );
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {format.dateTime(weekdayDate(day), { weekday: "short", timeZone: "UTC" })}
                  </FormLabel>
                </FormItem>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default AttendanceScheduleFields;
