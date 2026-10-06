"use client";

// The project's name and description. The description is optional with no minimum: the old form
// required 10 characters, so a project created without one could never be saved again (MKT-036).
// The messages are translated, and people whose role can't edit see the values read-only.
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button, Card, Input, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useUpdateProjectMutation } from "@/redux/features/projects/projectApi";
import type { IProject } from "@/types/projects";

type Values = { name: string; description: string };

export default function ProjectDetailsForm({ project, canEdit }: { project: IProject; canEdit: boolean }) {
  const t = useTranslations("ProjectSettings");
  const [updateProject, { isLoading }] = useUpdateProjectMutation();
  const values = { name: project.name ?? "", description: project.description ?? "" };
  const form = useForm<Values>({ defaultValues: values });

  // A save, or a switch to another project, brings new values.
  useEffect(() => {
    form.reset({ name: project.name ?? "", description: project.description ?? "" });
  }, [project.id, project.name, project.description, form]);

  const submit = form.handleSubmit(async (v) => {
    try {
      await updateProject({ id: project.id, name: v.name.trim(), description: v.description.trim() }).unwrap();
    } catch {
      // baseApi's toast says why; the values stay for another try.
    }
  });

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-title-sm text-fg">{t("detailsTitle")}</h2>
        <p className="text-body-sm text-fg-muted">{canEdit ? t("detailsHint") : t("readOnlyHint")}</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <RHFField
          control={form.control}
          name="name"
          label={t("name")}
          required
          rules={{ validate: (v: string) => v.trim().length >= 2 || t("nameRequired") }}
          render={(field) => <Input dir="auto" disabled={!canEdit} {...field} />}
        />
        <RHFField
          control={form.control}
          name="description"
          label={t("description")}
          optional
          render={(field) => <Textarea dir="auto" rows={3} maxRows={8} disabled={!canEdit} {...field} />}
        />
        {canEdit ? (
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" disabled={!form.formState.isDirty || isLoading} onClick={() => form.reset(values)}>
              {t("discard")}
            </Button>
            <Button type="submit" variant="primary" loading={isLoading} disabled={!form.formState.isDirty}>
              {t("save")}
            </Button>
          </div>
        ) : null}
      </form>
    </Card>
  );
}
