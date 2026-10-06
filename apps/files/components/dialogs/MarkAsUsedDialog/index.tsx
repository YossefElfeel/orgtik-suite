"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { BaseDialog } from "../BaseDialog";
import { useUpdateFileUsedMutation } from "@/redux/features/file/fileApi";

interface MarkAsUsedDialogProps {
  id: string;
  itemName: string;
  isUsed?: boolean;
  currentNote?: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Values = { note: string };

/** Marks a file as used, with where it was used; or back to not used (the note stays in its history). */
export function MarkAsUsedDialog({ id, itemName, isUsed = false, currentNote = "", children, open, onOpenChange }: MarkAsUsedDialogProps) {
  const t = useTranslations("Dialogs");
  const tc = useTranslations("Common");
  const [updateFileUsed] = useUpdateFileUsedMutation();
  const form = useForm<Values>({ defaultValues: { note: currentNote } });

  // Resolves after a save; rejects when the note is missing or the request fails, so the dialog stays open.
  const save = () =>
    new Promise<void>((resolve, reject) => {
      form.handleSubmit(
        async (values) => {
          try {
            await updateFileUsed({ id, isUsed: !isUsed, note: values.note.trim() }).unwrap();
            form.reset({ note: isUsed ? "" : values.note });
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        () => reject(new Error("invalid")),
      )();
    });

  const content = isUsed ? (
    <p className="text-body text-fg-muted">{t("used.unmarkBody")}</p>
  ) : (
    <div>
      <RHFField
        control={form.control}
        name="note"
        label={t("used.note")}
        rules={{ validate: (v: string) => Boolean(v.trim()) || t("used.noteRequired") }}
        render={(field) => <Textarea dir="auto" rows={3} placeholder={t("used.notePlaceholder")} {...field} />}
      />
    </div>
  );

  return (
    <BaseDialog
      title={t(isUsed ? "used.unmarkTitle" : "used.markTitle", { name: itemName })}
      size="sm"
      content={content}
      submitText={t(isUsed ? "used.unmark" : "used.mark")}
      cancelText={tc("cancel")}
      onSubmit={save}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </BaseDialog>
  );
}
