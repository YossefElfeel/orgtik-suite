"use client";

// Add a contact note to a project, or edit one (noteId). A failed save keeps the text.
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useAddContactNoteMutation, useUpdateContactNoteMutation } from "@/redux/features/projects/projectsApi";
import { buildContactNoteSchema, type ContactNoteFormValues } from "@/schemas/projects";

type Props = {
  projectId: string;
  note?: { id: string; content: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ContactNoteDialog({ projectId, note, open, onOpenChange }: Props) {
  const t = useTranslations("Projects");
  const schema = useMemo(() => buildContactNoteSchema((k) => t(k)), [t]);
  const form = useForm<ContactNoteFormValues>({ resolver: zodResolver(schema), defaultValues: { content: note?.content ?? "" } });
  const [add] = useAddContactNoteMutation();
  const [update] = useUpdateContactNoteMutation();
  const { reset } = form;
  useEffect(() => {
    if (open) reset({ content: note?.content ?? "" });
  }, [open, note, reset]);

  const submit = () =>
    new Promise<void>((resolve, reject) => {
      void form.handleSubmit(
        async (v) => {
          try {
            if (note) await update({ id: projectId, noteId: note.id, body: { content: v.content } }).unwrap();
            else await add({ id: projectId, body: { content: v.content } }).unwrap();
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
      size="md"
      title={note ? t("noteEditTitle") : t("noteAddTitle")}
      submitLabel={note ? t("noteSave") : t("noteAdd")}
      cancelLabel={t("cancel")}
      onSubmit={submit}
    >
      <RHFField control={form.control} name="content" label={t("noteLabel")} required render={(f) => <Textarea {...f} dir="auto" rows={5} />} />
    </FormDialog>
  );
}
