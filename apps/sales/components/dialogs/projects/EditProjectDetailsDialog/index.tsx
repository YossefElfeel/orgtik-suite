"use client";

// A project's name and description. The priority is set by admins and managers from the actions
// menu (a salesperson could change it here while the list hid it, SAL-063); plans change in the
// deal builder.
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Input, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useUpdateProjectMutation } from "@/redux/features/projects/projectsApi";
import { buildProjectDetailsSchema, type ProjectDetailsFormValues } from "@/schemas/projects";
import type { ProjectDetail } from "@/types/projects";

type Props = { project: ProjectDetail; open: boolean; onOpenChange: (open: boolean) => void };

export default function EditProjectDetailsDialog({ project, open, onOpenChange }: Props) {
  const t = useTranslations("Projects");
  const schema = useMemo(() => buildProjectDetailsSchema((k) => t(k)), [t]);
  const form = useForm<ProjectDetailsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { projectName: project.projectName, projectDescription: project.projectDescription ?? "" },
  });
  const [update] = useUpdateProjectMutation();
  const { reset } = form;
  useEffect(() => {
    if (open) reset({ projectName: project.projectName, projectDescription: project.projectDescription ?? "" });
  }, [open, project.projectName, project.projectDescription, reset]);

  const submit = () =>
    new Promise<void>((resolve, reject) => {
      void form.handleSubmit(
        async (v) => {
          try {
            await update({ id: project.id, body: { projectName: v.projectName, projectDescription: v.projectDescription } }).unwrap();
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        () => reject(new Error("invalid")),
      )();
    });

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} size="md" title={t("editDetailsTitle")} submitLabel={t("save")} cancelLabel={t("cancel")} onSubmit={submit}>
      <RHFField control={form.control} name="projectName" label={t("fieldName")} required render={(f) => <Input {...f} dir="auto" autoComplete="off" />} />
      <RHFField
        control={form.control}
        name="projectDescription"
        label={t("fieldDescription")}
        optional
        render={(f) => <Textarea {...f} dir="auto" rows={4} />}
      />
    </FormDialog>
  );
}
