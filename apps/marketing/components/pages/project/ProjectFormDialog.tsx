"use client";

// Create a project (a brand the team markets) from the shell's switcher. The old form asked for a
// description of 10 characters or more, so a project couldn't be saved without one (MKT-036); its
// messages were English only. After Create, the new project becomes the active one.
import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FileField, Input, Textarea, toast } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useCreateProjectMutation } from "@/redux/features/projects/projectApi";
import { isolate } from "@/lib/bidi";

type Values = { name: string; description: string; avatar: File[] };
const EMPTY: Values = { name: "", description: "", avatar: [] };
const MAX_AVATAR = 5 * 1024 * 1024;

export function ProjectFormDialog({
  trigger,
  open,
  onOpenChange,
  onCreated,
}: {
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The new project's id, so the caller can switch to it. */
  onCreated?: (id: string) => void;
}) {
  const t = useTranslations("ProjectForm");
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<Values>({ defaultValues: EMPTY });
  const [createProject] = useCreateProjectMutation();

  const onSubmit = async () => {
    if (!(await form.trigger())) throw new Error("invalid");
    const v = form.getValues();
    const name = v.name.trim();
    const created = await createProject({ name, description: v.description.trim() || undefined, avatar: v.avatar[0] } as never).unwrap();
    toast.success(t("created", { name: isolate(name) }));
    const id = (created as { data?: { id?: string | number } } | undefined)?.data?.id;
    if (id != null) onCreated?.(String(id));
  };

  return (
    <FormDialog
      trigger={trigger}
      open={open ?? isOpen}
      onOpenChange={onOpenChange ?? setIsOpen}
      onClosed={() => form.reset(EMPTY)}
      title={t("createTitle")}
      description={t("createHint")}
      submitLabel={t("create")}
      cancelLabel={t("cancel")}
      onSubmit={onSubmit}
      size="md"
    >
      <RHFField
        control={form.control}
        name="name"
        label={t("name")}
        required
        rules={{ validate: (v: string) => v.trim().length >= 2 || t("nameRequired") }}
        render={(field) => <Input dir="auto" autoFocus {...field} />}
      />
      <RHFField control={form.control} name="description" label={t("description")} optional render={(field) => <Textarea dir="auto" rows={3} maxRows={8} {...field} />} />
      <FileField
        label={t("avatar")}
        description={t("avatarHint")}
        accept="image/*"
        maxSize={MAX_AVATAR}
        multiple={false}
        value={form.watch("avatar")}
        onChange={(files) => form.setValue("avatar", files)}
      />
    </FormDialog>
  );
}
