"use client";

// A public holiday, read-only (FS-HR-4): opened from the calendar (controlled) or by a trigger.
import { useFormatter, useTranslations } from "next-intl";
import { ReusableDialog } from "@/components/shared/ReusableDialog/reusable-dialog";
import type { PublicHolidayDialogProps } from "@/types/calendar";

export const PublicHolidayDialog = ({ title, date, trigger, open, onOpenChange }: PublicHolidayDialogProps) => {
  const t = useTranslations("calendar.holiday");
  const format = useFormatter();
  return (
    <ReusableDialog title={t("title")} size="sm" trigger={trigger} open={open} onOpenChange={onOpenChange}>
      <dl className="space-y-3">
        <div className="flex flex-col">
          <dt className="text-sm text-fg-subtle">{t("name")}</dt>
          <dd className="text-lg font-semibold text-fg">
            <bdi>{title}</bdi>
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-sm text-fg-subtle">{t("date")}</dt>
          <dd className="text-md font-medium text-fg-muted">
            {format.dateTime(new Date(`${date}T00:00:00`), { dateStyle: "full" })}
          </dd>
        </div>
      </dl>
    </ReusableDialog>
  );
};
