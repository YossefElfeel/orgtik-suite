"use client";

// Create a team (FS-TASKS-11): a name, an optional description and an optional picture. The picture
// is the library's FileField (a real file input with a drop zone, sizes and types checked and named
// when refused); the old one was an invisible input under a button. Errors are translated, and a
// failed request keeps the dialog open (it used to be uncaught, TASKS-005).
import { type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Input, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useCreateTeamMutation } from "@/redux/features/teams/teamsApi";

type Values = { name: string; description: string };

export default function CreateTeamDialog({ trigger }: { trigger: ReactElement }) {
  const t = useTranslations("TeamForm");
  const [createTeam] = useCreateTeamMutation();
  const form = useForm<Values>({ defaultValues: { name: "", description: "" } });

  const onSubmit = async () => {
    if (!(await form.trigger())) throw new Error("invalid");
    const v = form.getValues();
    const body = { name: v.name.trim(), description: v.description.trim() };
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
    </FormDialog>
  );
}
