"use client";
import { CalendarDots as CalendarDays, CircleNotch as Loader2 } from "@phosphor-icons/react";

import { useMemo, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ReusableDialog } from "@/components/shared/ReusableDialog/reusable-dialog";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import { DateTimeFormElement } from "@/components/ui/form/date-time-form-element";
import TextFormEle from "@/components/ui/form/text-form-element";
import LogoUploadField from "@/components/ui/form/logo-upload-field";
import RadioGroupFormEle from "@/components/ui/form/radio-group-form-element";

import EmployeeComboBox from "@/components/ui/form/employee-combobox";
import { useCreateTimeOffRequestMutation } from "@/redux/features/timeOff/timeOffApi";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { useTranslations } from "next-intl";
import {
  makeAddTimeOffSchema,
  type AddTimeOffFormInput,
  type AddTimeOffFormValues,
} from "@/schemas/attendance/add-time-off.schemas";

const FORM_ID = "create-time-off-form";

export default function AddTimeOffDialog() {
  const t = useTranslations("addTimeDialog");
  const [open, setOpen] = useState(false);

  const [createTimeOff, { isLoading: isSubmitting }] =
    useCreateTimeOffRequestMutation();

  const schema = useMemo(
    () =>
      makeAddTimeOffSchema({
        typeRequired: t("validation.typeRequired"),
        startDateRequired: t("validation.startDateRequired"),
        endDateRequired: t("validation.endDateRequired"),
        customHoursRequired: t("validation.customHoursRequired"),
      }),
    [t],
  );

  const form = useForm<AddTimeOffFormInput, unknown, AddTimeOffFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: "",
      timeOffType: "annual_leave",
      durationType: "full_day",
      startDate: "",
      endDate: "",
      halfDayPeriod: "morning",
      partialStartTime: "",
      partialEndTime: "",
      employeeNote: "",
      files: [],
    },
  });

  const watchDurationType = form.watch("durationType");

  const onSubmit: SubmitHandler<AddTimeOffFormValues> = async (values) => {
    try {
      const formData = new FormData();

      formData.append("timeOffType", values.timeOffType);
      formData.append("durationType", values.durationType);
      formData.append("startDate", values.startDate);
      formData.append("endDate", values.endDate);

      if (values.employeeId) {
        formData.append("employeeId", String(values.employeeId));
      }

      if (values.employeeNote) {
        formData.append("employeeNote", values.employeeNote);
      }

      if (values.durationType === "half_day" && values.halfDayPeriod) {
        formData.append("halfDayPeriod", values.halfDayPeriod);
      }

      if (values.durationType === "custom_hours") {
        if (values.partialStartTime)
          formData.append("partialStartTime", values.partialStartTime);
        if (values.partialEndTime)
          formData.append("partialEndTime", values.partialEndTime);
      }

      if (values.files && values.files.length > 0) {
        values.files.forEach((file: File) => {
          formData.append("files", file);
        });
      }

      await createTimeOff(formData).unwrap();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Submission Error:", error);
    }
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={setOpen}
      title={t("title")}
      size="2xl"
      trigger={
        <Button size="lg" className="gap-2">
          <CalendarDays className="size-4.5" />
          {t("title")}
        </Button>
      }
      footer={
        <div className="flex w-full gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="me-2 size-4 animate-spin" />}
            {t("submitRequest")}
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5 py-4"
        >
          <RoleGuard allowedRoles={["hr", "manager", "super_admin"]}>
            <EmployeeComboBox
              form={form}
              name="employeeId"
              label={t("employeeName")}
              placeholder={t("employeePlaceholder")}
              open={open}
            />
          </RoleGuard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ComboboxFormEle
              form={form}
              name="timeOffType"
              label={t("timeOffType")}
              options={[
                { value: "annual_leave", label: t("timeOffTypes.annualLeave") },
                { value: "sick_leave", label: t("timeOffTypes.sickLeave") },
                {
                  value: "personal_leave",
                  label: t("timeOffTypes.personalLeave"),
                },
                { value: "vacation_day", label: t("timeOffTypes.vacationDay") },
                { value: "unpaid_leave", label: t("timeOffTypes.unpaidLeave") },
                { value: "other", label: t("timeOffTypes.other") },
              ]}
            />

            <ComboboxFormEle
              form={form}
              name="durationType"
              label={t("durationType")}
              options={[
                { value: "full_day", label: t("durationTypes.fullDay") },
                { value: "half_day", label: t("durationTypes.halfDay") },
                {
                  value: "custom_hours",
                  label: t("durationTypes.customHours"),
                },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateTimeFormElement
              form={form}
              name="startDate"
              label={t("startDate")}
              returnFormat="yyyy-mm-dd"
            />
            <DateTimeFormElement
              form={form}
              name="endDate"
              label={t("endDate")}
              returnFormat="yyyy-mm-dd"
            />
          </div>

      
          {watchDurationType === "half_day" && (
            <RadioGroupFormEle
              form={form}
              name="halfDayPeriod"
              label={t("period")}
              options={[
                { value: "morning", label: t("periods.morning") },
                { value: "afternoon", label: t("periods.afternoon") },
              ]}
            />
          )}

        
          {watchDurationType === "custom_hours" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       
              <div className="flex flex-col gap-2">
                <label className="text-body font-medium text-ink">
                  {t("durationTypes.startTime")}
                </label>
                <input
                  type="time"
                  {...form.register("partialStartTime")}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {form.formState.errors.partialStartTime && (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.partialStartTime.message}
                  </p>
                )}
              </div>

            
              <div className="flex flex-col gap-2">
                <label className="text-body font-medium text-ink">
                  {t("durationTypes.endTime")}
                </label>
                <input
                  type="time"
                  {...form.register("partialEndTime")}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {form.formState.errors.partialEndTime && (
                  <p className="text-xs font-medium text-destructive">
                    {String(form.formState.errors.partialEndTime.message)}
                  </p>
                )}
              </div>
            </div>
          )}

          <TextFormEle
            form={form}
            name="employeeNote"
            label={t("note")}
            placeholder={t("notePlaceholder")}
          />

          <LogoUploadField name="files" label={t("attachments")} multiple />
        </form>
      </Form>
    </ReusableDialog>
  );
}
