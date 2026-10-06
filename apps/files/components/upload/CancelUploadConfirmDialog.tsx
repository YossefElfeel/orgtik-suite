"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@orgtik/ui";

export interface CancelUploadConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** Kept for callers; the library stacks dialogs itself. */
  aboveUploadDetails?: boolean;
}

/** Stops an upload in progress: the files not sent yet are dropped. */
export function CancelUploadConfirmDialog({ open, onOpenChange, onConfirm }: CancelUploadConfirmDialogProps) {
  const t = useTranslations("FileUpload");
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="danger"
      title={t("cancelUploadConfirmTitle")}
      impact={t("cancelUploadConfirmDescription")}
      confirmLabel={t("cancelUploadConfirmAction")}
      cancelLabel={t("cancelUploadConfirmKeep")}
      onConfirm={() => onConfirm()}
    />
  );
}
