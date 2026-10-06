"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@orgtik/ui";

interface RestoreDialogProps {
  itemId?: string | number;
  ids?: (string | number)[];
  itemName?: string;
  itemNames?: string[];
  type: "file" | "folder";
  onRestore: (ids: (string | number)[]) => void | Promise<void>;
  children?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Brings archived items back to where they were. Reversible, so a primary confirm. */
export function RestoreDialog({ itemId, ids, itemName, type, onRestore, children, open, onOpenChange }: RestoreDialogProps) {
  const t = useTranslations("Restore");
  const tc = useTranslations("Common");
  const td = useTranslations("Dialogs.restore");
  const isBulk = Boolean(ids && ids.length > 0);
  const currentIds = isBulk ? (ids as (string | number)[]) : itemId !== undefined ? [itemId] : [];
  const typeLabel = isBulk ? t(type === "file" ? "files" : "folders") : t(type === "file" ? "file" : "folder");
  return (
    <ConfirmDialog
      trigger={children}
      open={open}
      onOpenChange={onOpenChange}
      tone="primary"
      title={isBulk ? t("titleBulk", { type: typeLabel }) : t("titleSingle", { type: typeLabel })}
      impact={isBulk ? td("many", { count: ids?.length ?? 0 }) : td("one", { name: itemName ?? typeLabel })}
      confirmLabel={tc("unarchive")}
      onConfirm={() => onRestore(currentIds)}
    />
  );
}
