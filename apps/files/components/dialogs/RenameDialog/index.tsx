"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Input } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { BaseDialog } from "../BaseDialog";

interface RenameDialogProps {
  id: string | number;
  fileName: string;
  onSubmit?: (id: string | number, newName: string) => void | Promise<void>;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Values = { fileName: string };

export const RenameDialog = ({ id, fileName, onSubmit, children, open, onOpenChange }: RenameDialogProps) => {
  const t = useTranslations("Dialogs");
  const tc = useTranslations("Common");
  const form = useForm<Values>({ defaultValues: { fileName } });
  useEffect(() => form.reset({ fileName }), [fileName, form]);

  // Rejects while the name is empty or too long, so the dialog stays open with the field's message.
  const save = () =>
    new Promise<void>((resolve, reject) => {
      form.handleSubmit(
        async (values) => {
          try {
            await onSubmit?.(id, values.fileName.trim());
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        () => reject(new Error("invalid")),
      )();
    });

  const content = (
    <RHFField
      control={form.control}
      name="fileName"
      label={tc("renameLabel")}
      rules={{
        validate: (v: string) => (!v.trim() ? t("rename.required") : v.length > 255 ? t("rename.tooLong") : true),
      }}
      render={(field) => (
        <Input
          dir="auto"
          autoFocus
          {...field}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save().then(() => onOpenChange?.(false), () => {});
            }
          }}
        />
      )}
    />
  );

  return (
    <BaseDialog title={t("rename.title", { name: fileName })} submitText={tc("save")} cancelText={tc("cancel")} size="sm" onSubmit={save} content={content} open={open} onOpenChange={onOpenChange}>
      {children}
    </BaseDialog>
  );
};
