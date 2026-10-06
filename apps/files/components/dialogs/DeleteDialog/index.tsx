"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useFormatter } from "@orgtik/ui";
import { DeleteForGoodDialog } from "../DeleteForGood";

interface DeleteDialogProps {
  id: string | number;
  item?: { name?: string; displayName?: string; mimeType?: string; url?: string; size?: number | string; folder?: { name?: string } };
  onDelete: (id: string | number, password?: string) => void | Promise<void>;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Deletes one archived file or folder for good. */
export function DeleteDialog({ id, item, onDelete, children, open, onOpenChange }: DeleteDialogProps) {
  const t = useTranslations("Dialogs");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const name = item?.displayName || item?.name || "";
  const isFolder = !item?.mimeType && item?.size === undefined;
  const impact = isFolder
    ? t("remove.folderImpact")
    : t("remove.fileImpact", {
        type: (name.split(".").pop() || "").toUpperCase() || t("details.file"),
        size: item?.size ? f.bytes(Number(item.size)) : t("details.unknown"),
        location: item?.folder?.name || tc("root"),
      });
  return (
    <DeleteForGoodDialog
      title={t("remove.title", { name })}
      impact={impact}
      item={item}
      itemType={isFolder ? "folder" : "file"}
      confirmLabel={t("remove.confirm")}
      onDelete={async (password) => onDelete(id, password)}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </DeleteForGoodDialog>
  );
}
