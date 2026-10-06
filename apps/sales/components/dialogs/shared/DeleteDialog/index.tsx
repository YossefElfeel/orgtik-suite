"use client";

import type { ReactElement } from "react";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { useTranslations } from "next-intl";

type DeleteDialogProps = {
  /** Dynamic label, e.g. "coupon ECOM15" */
  title: string;
  trigger: ReactElement;
  onConfirm?: () => void;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DeleteDialog({
  title,
  trigger,
  onConfirm,
  isLoading = false,
  open,
  onOpenChange,
}: DeleteDialogProps) {
  const t = useTranslations("common");

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={t("deleteConfirmTitle", { title })}
      size="xl"
      onCancelText={t("cancel")}
      onSuccessText={t("delete")}
      onSuccess={onConfirm}
      isLoading={isLoading}
      successVariant="destructive"
      successClassName="bg-destructive text-white hover:bg-destructive/90 hover:text-white"
    >
      <p className="text-base text-muted-foreground">
        {t("deleteConfirmMessage", { title })}
      </p>
    </ReusableDialog>
  );
}
