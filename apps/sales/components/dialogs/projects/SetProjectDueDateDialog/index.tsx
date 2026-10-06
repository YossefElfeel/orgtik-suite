"use client";

// When the project is due: a date from the library's DatePicker, today or later (today in the
// organisation's time zone). It is saved as a date, not a time.
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Field } from "@orgtik/ui";
import { DatePicker } from "@orgtik/ui/dates";
import { FormDialog } from "@/components/shared/FormDialog";
import { useUpdateProjectDueDateMutation } from "@/redux/features/projects/projectsApi";
import { ORG_TIME_ZONE } from "@/lib/deals/format";
import { isolate } from "@/lib/bidi";
import { buildDueDateSchema, type DueDateFormValues } from "@/schemas/projects";
import type { ProjectDetail } from "@/types/projects";

type Props = { project: ProjectDetail; open: boolean; onOpenChange: (open: boolean) => void };

/** Today's date in the organisation's time zone, as YYYY-MM-DD. */
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: ORG_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const dateOnly = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("en-CA", { timeZone: ORG_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso)) : "";

export default function SetProjectDueDateDialog({ project, open, onOpenChange }: Props) {
  const t = useTranslations("Projects");
  const schema = useMemo(() => buildDueDateSchema((k) => t(k)), [t]);
  const form = useForm<DueDateFormValues>({ resolver: zodResolver(schema), defaultValues: { dueDate: dateOnly(project.dueDate) } });
  const value = useWatch({ control: form.control, name: "dueDate" });
  const [save] = useUpdateProjectDueDateMutation();
  const { reset } = form;
  useEffect(() => {
    if (open) reset({ dueDate: dateOnly(project.dueDate) });
  }, [open, project.dueDate, reset]);

  const submit = () =>
    new Promise<void>((resolve, reject) => {
      void form.handleSubmit(
        async (v) => {
          try {
            await save({ id: project.id, body: { dueDate: v.dueDate } }).unwrap();
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        () => reject(new Error("invalid")),
      )();
    });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={t("dueDateTitle")}
      description={t("dueDateBody", { name: isolate(project.projectName) })}
      submitLabel={t("save")}
      cancelLabel={t("cancel")}
      onSubmit={submit}
    >
      <Field label={t("dueDateLabel")} required error={form.formState.errors.dueDate?.message}>
        <DatePicker
          value={value || null}
          onChange={(v) => form.setValue("dueDate", v, { shouldDirty: true, shouldValidate: true })}
          min={today()}
          aria-label={t("dueDateLabel")}
        />
      </Field>
    </FormDialog>
  );
}
