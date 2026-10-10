"use client";

// Create a project (a brand the team markets) from the shell's switcher. The old form asked for a
// description of 10 characters or more, so a project couldn't be saved without one (MKT-036); its
// messages were English only. After Create, the new project becomes the active one.
import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Input, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useCreateProjectMutation } from "@/redux/features/projects/projectApi";

type Values = { name: string; description: string };
const EMPTY: Values = { name: "", description: "" };

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
  const t = useTranslations("ProjectForm"),
    tv = useTranslations("MarketingV3");
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<Values>({ defaultValues: EMPTY });
  const [createProject] = useCreateProjectMutation();

  const onSubmit = async () => {
    if (!(await form.trigger())) throw new Error("invalid");
    const v = form.getValues();
    const name = v.name.trim();
    const created = await createProject({
      name,
      description: v.description.trim() || undefined,
    }).unwrap();
    const id = created.data.id;
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
        rules={{
          validate: (v: string) => v.trim().length >= 2 || t("nameRequired"),
        }}
        render={(field) => <Input dir="auto" autoFocus {...field} />}
      />
      <RHFField
        control={form.control}
        name="description"
        label={t("description")}
        optional
        render={(field) => (
          <Textarea dir="auto" rows={3} maxRows={8} {...field} />
        )}
      />
      <p className="text-body-sm text-fg-muted">{tv("assetsDeferred")}</p>
    </FormDialog>
  );
}
