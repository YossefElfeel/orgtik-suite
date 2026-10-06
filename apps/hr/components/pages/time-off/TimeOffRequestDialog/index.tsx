"use client";
import { CalendarBlank as Calendar } from "@phosphor-icons/react";

// A time off request, read-only (FS-HR-4). Opened from the calendar (controlled: `open`) or from a
// trigger the caller passes. Words, dates and durations come in the reader's language.
import React, { useState, useEffect } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ReusableDialog } from "@/components/shared/ReusableDialog/reusable-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatusBadge from "@/components/shared/StatusBadge";
import { useLazyGetTimeOffByIdQuery } from "@/redux/features/timeOff/timeOffApi";
import type { TimeOffRequestDialogProps } from "@/types/time-off";
import { rangeText } from "@/lib/date-range";

export function TimeOffRequestDialog({ id, trigger, open: openProp, onOpenChange }: TimeOffRequestDialogProps) {
  const t = useTranslations("calendar.timeOff");
  const tTypes = useTranslations("leaveTypes");
  const format = useFormatter();
  const [openInner, setOpenInner] = useState(false);
  const open = openProp ?? openInner;
  const setOpen = onOpenChange ?? setOpenInner;

  const [triggerFetch, { data: response, isLoading: isQueryLoading }] = useLazyGetTimeOffByIdQuery();
  const timeOffData = response?.data;

  useEffect(() => {
    if (open && id) triggerFetch(id);
  }, [open, id, triggerFetch]);

  const typeLabel = (type?: string) => (type ? (tTypes.has(type) ? tTypes(type) : type) : "");
  const day = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00`), { dateStyle: "medium" });
  const minutes = timeOffData?.totalDurationMinutes ?? 0;

  return (
    <ReusableDialog
      open={open}
      onOpenChange={setOpen}
      title={
        timeOffData
          ? t("title", { name: timeOffData.employee?.fullName ?? "", type: typeLabel(timeOffData.timeOffType) })
          : t("loadingTitle")
      }
      size="md"
      footer={null}
      isLoading={isQueryLoading}
      trigger={trigger}
    >
      <div className="space-y-6">
        <div className="bg-sunken rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-raised rounded-xl flex items-center justify-center border">
            <Calendar className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("dates")}</p>
            <p className="font-medium">
              {timeOffData ? (
                <bdi>
                  {timeOffData.startDate === timeOffData.endDate
                    ? day(timeOffData.startDate)
                    : rangeText(format.dateTimeRange(new Date(`${timeOffData.startDate}T00:00:00`), new Date(`${timeOffData.endDate}T00:00:00`), { dateStyle: "medium" }))}
                </bdi>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">{t("employee")}</p>
          <div className="bg-sunken rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={timeOffData?.employee?.avatar || ""} alt="" />
                <AvatarFallback className="bg-brand-subtle text-fg-brand">
                  {timeOffData?.employee?.fullName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "?"}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium">
                <bdi>{timeOffData?.employee?.fullName ?? "—"}</bdi>
              </p>
            </div>

            {timeOffData ? <StatusBadge status={timeOffData.status} /> : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-sunken rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{t("type")}</p>
            <p className="font-medium">{timeOffData ? typeLabel(timeOffData.timeOffType) : "—"}</p>
          </div>
          <div className="bg-sunken rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{t("duration")}</p>
            <p className="font-medium">
              {timeOffData
                ? minutes >= 1440
                  ? t("days", { count: minutes / 1440 })
                  : t("hours", { count: minutes / 60 })
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </ReusableDialog>
  );
}
