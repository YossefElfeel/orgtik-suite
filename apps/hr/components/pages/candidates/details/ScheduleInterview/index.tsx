"use client";
import { CalendarDots as CalendarDays, Clock as Clock3, LinkSimple as Link2 } from "@phosphor-icons/react";

import { ReusableDialog } from "@/components/shared/ReusableDialog/reusable-dialog";
import { Button } from "@/components/ui/button";
import TextFormEle from "@/components/ui/form/text-form-element";
import { DateTimeFormElement } from "@/components/ui/form/date-time-form-element";
import { useCreateApplicationInterviewMutation } from "@/redux/features/job/jobApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  makeScheduleInterviewSchema,
  toDateInputValue,
  type ScheduleInterviewFormInputValues,
  type ScheduleInterviewFormValues,
} from "@/schemas/candidates/schedule-interview.schemas";

const FORM_ID = "schedule-interview-form";

const normalizeDateValue = (value: string | Date) =>
  value instanceof Date ? toDateInputValue(value) : value;

const getCurrentTimeHHmm = () => {
  const now = new Date();
  const hours = `${now.getHours()}`.padStart(2, "0");
  const minutes = `${now.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

export default function ScheduleInterview({
  applicationId,
  candidateName,
}: {
  applicationId: number;
  candidateName?: string;
}) {
  const t = useTranslations("candidateDetails.scheduleInterviewDialog");
  const scheduleInterviewSchema = useMemo(
    () =>
      makeScheduleInterviewSchema({
        dateRequired: t("validation.dateRequired"),
        startTimeRequired: t("validation.startTimeRequired"),
        endTimeRequired: t("validation.endTimeRequired"),
        interviewWithRequired: t("validation.interviewWithRequired"),
        meetingLinkInvalid: t("validation.meetingLinkInvalid"),
        noteRequired: t("validation.noteRequired"),
        endAfterStart: t("validation.endAfterStart"),
        noPastDate: t("validation.noPastDate"),
      }),
    [t],
  );
  const [open, setOpen] = useState(false);
  const [createApplicationInterview, { isLoading }] =
    useCreateApplicationInterviewMutation();
  const todayDate = toDateInputValue(new Date());
  const defaultValues: ScheduleInterviewFormInputValues = {
    date: todayDate,
    startTime: "09:00",
    endTime: "10:00",
    interviewWith: candidateName || "",
    meetingLink: "",
    note: "",
  };

  const form = useForm<
    ScheduleInterviewFormInputValues,
    unknown,
    ScheduleInterviewFormValues
  >({
    resolver: zodResolver(scheduleInterviewSchema),
    defaultValues,
  });
  const selectedDate = normalizeDateValue(form.watch("date"));
  const selectedStartTime = form.watch("startTime");
  const minStartTime =
    selectedDate === todayDate ? getCurrentTimeHHmm() : undefined;
  const minEndTime =
    selectedDate === todayDate
      ? selectedStartTime || getCurrentTimeHHmm()
      : selectedStartTime || undefined;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(defaultValues);
    }
  };

  const onSubmit = async (values: ScheduleInterviewFormValues) => {
    const startAt = new Date(
      `${values.date}T${values.startTime}:00`,
    ).toISOString();
    const endAt = new Date(`${values.date}T${values.endTime}:00`).toISOString();

    await createApplicationInterview({
      applicationId,
      data: {
        startAt,
        endAt,
        interviewWith: values.interviewWith,
        interviewLink: values.meetingLink?.trim() || "",
        note: values.note,
      },
    }).unwrap();

    handleOpenChange(false);
  };

  return (
    <ReusableDialog
      title={t("title")}
      open={open}
      onOpenChange={handleOpenChange}
      size="2xl"
      trigger={
        <Button size="lg" variant="outline">
          <CalendarDays className="size-4" />
          {t("trigger")}
        </Button>
      }
      footer={
        <div className="flex w-full gap-3">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="flex-1"
            onClick={() => handleOpenChange(false)}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            size="lg"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? t("actions.submitting") : t("actions.submit")}
          </Button>
        </div>
      }
    >
      <FormProvider {...form}>
        <form
          id={FORM_ID}
          className="space-y-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <DateTimeFormElement
            form={form}
            name="date"
            label={t("fields.date")}
            placeholder={t("fields.selectDate")}
            showTime={false}
          />

          <TextFormEle
            form={form}
            name="startTime"
            type="time"
            label={t("fields.startTime")}
            placeholder={t("fields.selectStartTime")}
            inputProps={{ min: minStartTime }}
            inlinePrefix={<Clock3 className="size-5 text-fg-subtle" />}
            inlinePrefixClassName="start-3"
            inputClassName="ps-10 text-base"
          />

          <TextFormEle
            form={form}
            name="endTime"
            type="time"
            label={t("fields.endTime")}
            placeholder={t("fields.selectEndTime")}
            inputProps={{ min: minEndTime }}
            inlinePrefix={<Clock3 className="size-5 text-fg-subtle" />}
            inlinePrefixClassName="start-3"
            inputClassName="ps-10 text-base"
          />

          <TextFormEle
            form={form}
            name="meetingLink"
            label={t("fields.meetingLinkLabel")}
            placeholder={t("fields.enterMeetingLink")}
            inlinePrefix={<Link2 className="size-5 text-fg-subtle" />}
            inlinePrefixClassName="start-3"
            inputClassName="ps-10 text-base"
          />

          <TextFormEle
            form={form}
            name="interviewWith"
            label={t("fields.interviewWith")}
            placeholder={t("fields.interviewWithPlaceholder")}
            inputClassName="text-base"
          />

          <TextFormEle
            form={form}
            name="note"
            label={t("fields.note")}
            placeholder={t("fields.notePlaceholder")}
            inputClassName="text-base"
          />
        </form>
      </FormProvider>
    </ReusableDialog>
  );
}
