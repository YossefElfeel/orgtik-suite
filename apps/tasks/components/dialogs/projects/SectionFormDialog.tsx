"use client";

// Add or edit a board section: its name, the status its tasks count as, and its colour. The status
// is chosen, not guessed from the name (the board used to drop it and lowercase the title).
import { useEffect, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Input, Select, useStatusLabel } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useCreateProjectSectionMutation, useUpdateProjectSectionMutation } from "@/redux/features/projects/projectsApi";

type Flag = "backlog" | "todo" | "in_progress" | "in_review" | "done";
type Values = { title: string; flag: Flag; color: string };
const FLAGS: Flag[] = ["backlog", "todo", "in_progress", "in_review", "done"];
const COLORS = ["neutral", "info", "brand", "warning", "success", "danger"] as const;

export function SectionFormDialog({
  projectId,
  section,
  open,
  onOpenChange,
  trigger,
}: {
  projectId: number;
  section?: { id: number; title: string; flag?: string; color?: string };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactElement;
}) {
  const t = useTranslations("SectionForm");
  const statusLabel = useStatusLabel();
  const form = useForm<Values>({ defaultValues: { title: "", flag: "todo", color: "info" } });
  const [create] = useCreateProjectSectionMutation();
  const [update] = useUpdateProjectSectionMutation();
  useEffect(() => {
    if (section) form.reset({ title: section.title, flag: (FLAGS.includes(section.flag as Flag) ? section.flag : "todo") as Flag, color: COLORS.includes(section.color as never) ? section.color! : "info" });
  }, [section, form]);

  return (
    <FormDialog
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      onClosed={() => !section && form.reset()}
      title={section ? t("editTitle") : t("createTitle")}
      submitLabel={section ? t("save") : t("create")}
      cancelLabel={t("cancel")}
      onSubmit={async () => {
        if (!(await form.trigger())) throw new Error("invalid");
        const v = form.getValues();
        const body = { title: v.title.trim(), flag: v.flag, color: v.color };
        if (section) await update({ projectId, sectionId: section.id, ...body } as never).unwrap();
        else await create({ projectId, ...body } as never).unwrap();
      }}
    >
      <RHFField
        control={form.control}
        name="title"
        label={t("name")}
        required
        rules={{ validate: (v: string) => Boolean(v.trim()) || t("nameRequired") }}
        render={(field) => <Input dir="auto" autoFocus {...field} />}
      />
      <RHFField
        control={form.control}
        name="flag"
        label={t("countsAs")}
        description={t("countsAsHint")}
        render={({ value, onChange }) => <Select value={value} onValueChange={(v) => v && onChange(v)} options={FLAGS.map((f) => ({ value: f, label: statusLabel("task", f) }))} />}
      />
      <RHFField
        control={form.control}
        name="color"
        label={t("color")}
        render={({ value, onChange }) => <Select value={value} onValueChange={(v) => v && onChange(v)} options={COLORS.map((c) => ({ value: c, label: t(`colors.${c}`) }))} />}
      />
    </FormDialog>
  );
}
