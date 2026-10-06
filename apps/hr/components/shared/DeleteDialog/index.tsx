"use client";

// Every delete in HR (FS-HR-6, HR-022): the library ConfirmDialog. It names the thing ("Delete the
// Marketing department?"), says what happens to other things (the impact, required), waits for the
// request with the button busy, and stays open saying so when it fails. It replaced a dialog whose
// defaults read "Delete Item" / "Are you sure…", that showed its own English "Deleting..." toast on
// top of the API's message, and that closed whatever happened.
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@orgtik/ui";
import type { DeleteDialogProps } from "@/types/delete-dialog";

export function DeleteDialog({
  title,
  description,
  onConfirm,
  trigger,
  confirmText,
  cancelText,
  isDestructive = true,
  confirmationText,
  children,
}: DeleteDialogProps) {
  const t = useTranslations("deleteDialog");
  return (
    <ConfirmDialog
      tone={isDestructive ? "danger" : "primary"}
      irreversible={isDestructive}
      title={title ?? t("title")}
      impact={
        <span className="flex flex-col gap-3">
          <span>{description ?? t("impact")}</span>
          {children}
        </span>
      }
      confirmLabel={confirmText ?? t("confirm")}
      cancelLabel={cancelText ?? t("cancel")}
      typeToConfirm={confirmationText}
      onConfirm={async () => {
        await onConfirm();
      }}
      trigger={trigger}
    />
  );
}
