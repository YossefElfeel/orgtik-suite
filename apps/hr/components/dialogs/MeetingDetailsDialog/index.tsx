"use client";

// A meeting or an interview on the calendar, read-only (FS-HR-4). It used to open the payroll
// adjustments dialog, which had nothing to do with it. Opened from the calendar (controlled) or
// by a trigger passed as children.
import { useFormatter, useTranslations } from "next-intl";
import { VideoCamera } from "@phosphor-icons/react";
import { buttonVariants } from "@orgtik/ui";
import { ReusableDialog } from "@/components/shared/ReusableDialog/reusable-dialog";
import type { MeetingDetailsDialogProps } from "@/types/calendar";

export function MeetingDetailsDialog({ meeting, children, open, onOpenChange }: MeetingDetailsDialogProps) {
  const t = useTranslations("calendar.meeting");
  const format = useFormatter();
  const link = meeting.link ?? meeting.interviewLink;
  const withWhom = meeting.candidate?.fullName ?? meeting.interviewWith;
  const rows: { label: string; value: string }[] = [
    { label: t("date"), value: format.dateTime(new Date(`${meeting.date}T00:00:00`), { dateStyle: "full" }) },
    ...(meeting.startAt ? [{ label: t("time"), value: meeting.endAt ? `${meeting.startAt} – ${meeting.endAt}` : meeting.startAt }] : []),
    ...(withWhom ? [{ label: t("with"), value: withWhom }] : []),
    ...(meeting.job?.title ? [{ label: t("job"), value: meeting.job.title }] : []),
  ];

  return (
    <ReusableDialog
      title={meeting.title}
      size="sm"
      trigger={children}
      open={open}
      onOpenChange={onOpenChange}
      footer={
        link ? (
          <a href={link} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "primary" })}>
            <VideoCamera aria-hidden="true" />
            {t("join")}
          </a>
        ) : (
          <p className="text-sm text-fg-subtle">{t("noLink")}</p>
        )
      }
    >
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col">
            <dt className="text-sm text-fg-subtle">{row.label}</dt>
            <dd className="font-medium text-fg">
              <bdi>{row.value}</bdi>
            </dd>
          </div>
        ))}
      </dl>
    </ReusableDialog>
  );
}
