"use client";

// The three ways to delete for good (one archived item, several, the whole archive) share this:
// what's lost, said plainly, that it can't be undone, and the password the API asks for (FS-FILES-9).
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { File, Folder, WarningCircle } from "@phosphor-icons/react";
import { Field, PasswordInput } from "@orgtik/ui";
import { BaseDialog } from "./BaseDialog";
import { ProtectedImage } from "@/components/shared/ProtectedImage";

export function DeleteForGoodDialog({
  title,
  impact,
  item,
  itemType,
  confirmLabel,
  onDelete,
  children,
  open,
  onOpenChange,
}: {
  title: string;
  impact: React.ReactNode;
  /** One file or folder, shown with its preview. */
  item?: { name?: string; displayName?: string; mimeType?: string; url?: string };
  itemType?: "file" | "folder";
  confirmLabel: string;
  onDelete: (password: string) => Promise<unknown>;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const t = useTranslations("Dialogs");
  const tc = useTranslations("Common");
  const [password, setPassword] = useState("");
  const [missing, setMissing] = useState(false);
  const name = item ? item.displayName || item.name : undefined;
  const isImage = item?.mimeType?.startsWith("image/");

  const submit = async () => {
    if (!password) {
      setMissing(true);
      throw new Error("password");
    }
    try {
      await onDelete(password);
    } finally {
      setPassword("");
    }
  };

  const content = (
    <div className="flex flex-col gap-5">
      {item ? (
        <div className="flex items-center gap-4">
          <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-field bg-sunken text-fg-subtle [&>svg]:size-8">
            {isImage && item.url ? <ProtectedImage src={item.url} alt="" fill className="object-cover" /> : itemType === "folder" ? <Folder weight="duotone" aria-hidden="true" /> : <File weight="duotone" aria-hidden="true" />}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span dir="auto" className="truncate font-medium text-fg">
              {name}
            </span>
            <span className="text-body-sm text-fg-muted">{impact}</span>
          </div>
        </div>
      ) : (
        <p className="text-body text-fg-muted">{impact}</p>
      )}
      <p className="flex items-center gap-2 rounded-field bg-danger-subtle px-3 py-2 text-body-sm font-medium text-danger">
        <WarningCircle weight="fill" aria-hidden="true" className="size-4 shrink-0" />
        {t("remove.irreversible")}
      </p>
      <Field label={t("remove.password")} description={t("remove.passwordHelp")} error={missing ? t("remove.passwordRequired") : undefined}>
        <PasswordInput
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setMissing(false);
          }}
        />
      </Field>
    </div>
  );

  return (
    <BaseDialog
      title={title}
      size="md"
      content={content}
      submitText={confirmLabel}
      cancelText={tc("cancel")}
      submitVariant="destructive"
      onSubmit={submit}
      onCancel={() => (setPassword(""), setMissing(false))}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </BaseDialog>
  );
}
