"use client";

// Add a link the team uses often (a spec, a design file). Its fields and their errors are
// translated (the zod messages were English), and the files are the library's FileField.
import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FileField, Input, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useAddBookmarkMutation } from "@/redux/features/bookmark/bookmarkApi";

type Values = { link: string; title: string; description: string };
const isUrl = (v: string) => {
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

export default function AddBookmarkDialog({ teamId, trigger }: { teamId: number; trigger: ReactElement }) {
  const t = useTranslations("BookmarkForm");
  const [addBookmark] = useAddBookmarkMutation();
  const form = useForm<Values>({ defaultValues: { link: "", title: "", description: "" } });
  const [files, setFiles] = useState<File[]>([]);

  const onSubmit = async () => {
    if (!(await form.trigger())) throw new Error("invalid");
    const v = form.getValues();
    const body = new FormData();
    files.forEach((f) => body.append("attachments", f));
    body.append("link", v.link.trim());
    body.append("title", v.title.trim());
    if (v.description.trim()) body.append("description", v.description.trim());
    body.append("teamId", String(teamId));
    await addBookmark(body).unwrap();
  };

  return (
    <FormDialog
      trigger={trigger}
      title={t("title")}
      submitLabel={t("add")}
      cancelLabel={t("cancel")}
      onSubmit={onSubmit}
      onClosed={() => {
        form.reset();
        setFiles([]);
      }}
    >
      <RHFField
        control={form.control}
        name="link"
        label={t("link")}
        required
        rules={{ validate: (v: string) => isUrl(v) || t("linkInvalid") }}
        render={(field) => <Input dir="ltr" type="url" inputMode="url" placeholder="https://" autoFocus {...field} />}
      />
      <RHFField control={form.control} name="title" label={t("name")} required rules={{ validate: (v: string) => Boolean(v.trim()) || t("nameRequired") }} render={(field) => <Input dir="auto" {...field} />} />
      <RHFField control={form.control} name="description" label={t("description")} optional render={(field) => <Textarea dir="auto" rows={2} maxRows={6} {...field} />} />
      <FileField label={t("files")} multiple maxFiles={5} maxSize={10 * 1024 * 1024} value={files} onChange={setFiles} />
    </FormDialog>
  );
}
