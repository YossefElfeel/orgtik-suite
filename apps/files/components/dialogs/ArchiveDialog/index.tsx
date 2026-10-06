"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@orgtik/ui";

interface ArchiveDialogProps {
  id: string | number;
  fileName: string;
  /** A folder takes everything in it along. */
  type?: "file" | "folder";
  onArchive: (id: string | number) => void | Promise<void>;
  children?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Archiving is reversible (it can be restored), so it's a primary confirm, not a danger one. */
export function ArchiveDialog({ id, fileName, type = "file", onArchive, children, open, onOpenChange }: ArchiveDialogProps) {
  const t = useTranslations("Dialogs");
  return (
    <ConfirmDialog
      trigger={children}
      open={open}
      onOpenChange={onOpenChange}
      tone="primary"
      title={t("archive.title", { name: fileName })}
      impact={t(type === "folder" ? "archive.impactFolder" : "archive.impactFile")}
      confirmLabel={t("archive.confirm")}
      onConfirm={() => onArchive(id)}
    />
  );
}
