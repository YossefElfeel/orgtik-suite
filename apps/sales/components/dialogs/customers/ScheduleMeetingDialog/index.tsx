"use client";

// Schedule a meeting with a lead or customer. The time is picked and shown in the organisation's
// time zone, which the field names, and can't be in the past (SAL-073). The meeting is an activity
// on the lead, not a stage (D-028): a new lead becomes contacted.
import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Textarea } from "@orgtik/ui";
import { DateTimePicker } from "@orgtik/ui/dates";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useScheduleMeetingMutation } from "@/redux/features/customers/customersApi";
import { scheduleMeetingSchema, type ScheduleMeetingFormValues } from "@/schemas/customers";
import { ORG_TIME_ZONE } from "@/components/pages/customers/leads";
import { isolate } from "@/lib/bidi";

type Props = {
  id: string;
  /** The person met, for the title. */
  name?: string;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const EMPTY: ScheduleMeetingFormValues = { scheduledAt: "", notes: "" };

export default function ScheduleMeetingDialog({ id, name, trigger, open, onOpenChange }: Props) {
  const t = useTranslations("Customers.meeting");
  const tForm = useTranslations("Customers.form");
  const [own, setOwn] = useState(false);
  const [scheduleMeeting] = useScheduleMeetingMutation();
  const form = useForm<ScheduleMeetingFormValues>({ resolver: zodResolver(scheduleMeetingSchema(tForm)), defaultValues: EMPTY });

  const onSubmit = async () => {
    let values: ScheduleMeetingFormValues | null = null;
    await form.handleSubmit((v) => {
      values = v;
    })();
    if (!values) throw new Error("invalid");
    const v = values as ScheduleMeetingFormValues;
    await scheduleMeeting({ id, body: { scheduledAt: new Date(v.scheduledAt).toISOString(), notes: v.notes.trim() || undefined } }).unwrap();
  };

  return (
    <FormDialog
      trigger={trigger}
      open={open ?? own}
      onOpenChange={(next) => (onOpenChange ? onOpenChange(next) : setOwn(next))}
      onClosed={() => form.reset(EMPTY)}
      title={name ? t("titleWith", { name: isolate(name) }) : t("title")}
      description={t("description")}
      submitLabel={t("submit")}
      cancelLabel={t("cancel")}
      onSubmit={onSubmit}
      size="md"
    >
      <RHFField
        control={form.control}
        name="scheduledAt"
        label={t("when")}
        required
        render={(field) => (
          <DateTimePicker
            value={field.value || null}
            onChange={(v) => field.onChange(v)}
            min={new Date().toISOString()}
            defaultTime="10:00"
            timeZone={ORG_TIME_ZONE}
            dateLabel={t("date")}
            timeLabel={t("time")}
          />
        )}
      />
      <RHFField control={form.control} name="notes" label={t("notes")} optional render={(field) => <Textarea dir="auto" rows={3} maxRows={8} placeholder={t("notesPlaceholder")} {...field} />} />
    </FormDialog>
  );
}
