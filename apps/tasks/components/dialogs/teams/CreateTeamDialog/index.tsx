"use client";

// Create a team (FS-TASKS-11): a name, an optional description and an optional picture. The picture
// is the library's FileField (a real file input with a drop zone, sizes and types checked and named
// when refused); the old one was an invisible input under a button. Errors are translated, and a
// failed request keeps the dialog open (it used to be uncaught, TASKS-005).
import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FileField, Input, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useCreateTeamMutation } from "@/redux/features/teams/teamsApi";

type Values = { name: string; description: string };

export default function CreateTeamDialog({ trigger }: { trigger: ReactElement }) {
  const t = useTranslations("TeamForm");
  const [createTeam] = useCreateTeamMutation();
  const form = useForm<Values>({ defaultValues: { name: "", description: "" } });
  const [picture, setPicture] = useState<File[]>([]);

  const onSubmit = async () => {
    if (!(await form.trigger())) throw new Error("invalid");
    const v = form.getValues();
    const body = new FormData();
    body.append("name", v.name.trim());
    body.append("description", v.description.trim());
    if (picture[0]) body.append("teamImage", picture[0]);
    await createTeam(body).unwrap();
  };

  return (
    <FormDialog
      trigger={trigger}
      title={t("title")}
      description={t("description")}
      submitLabel={t("create")}
      cancelLabel={t("cancel")}
      onSubmit={onSubmit}
      onClosed={() => {
        form.reset();
        setPicture([]);
      }}
    >
      <RHFField
        control={form.control}
        name="name"
        label={t("name")}
        required
        rules={{ validate: (v: string) => v.trim().length >= 2 || t("nameRequired") }}
        render={(field) => <Input dir="auto" autoFocus {...field} />}
      />
      <RHFField control={form.control} name="description" label={t("about")} optional render={(field) => <Textarea dir="auto" rows={3} maxRows={8} {...field} />} />
      <FileField label={t("picture")} description={t("pictureHint")} accept="image/png,image/jpeg,image/webp" maxSize={2 * 1024 * 1024} value={picture} onChange={setPicture} />
    </FormDialog>
  );
}
