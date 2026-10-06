"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useFormatter } from "@orgtik/ui";
import { DeleteForGoodDialog } from "../DeleteForGood";

interface PermanentDeleteDialogProps {
  item?: { id?: string | number; name?: string; displayName?: string; mimeType?: string; url?: string; size?: number | string };
  ids?: string[];
  children?: React.ReactNode;
  onSuccess?: () => void;
  /** An RTK mutation result (with unwrap) or a plain promise: either is awaited, and a failure keeps the dialog open. */
  onDelete: (data: { ids: (string | number)[]; password?: string }) => unknown;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Deletes one or several archived items for good. */
export function PermanentDeleteDialog({ item, ids, children, onSuccess, onDelete, open, onOpenChange }: PermanentDeleteDialogProps) {
  const t = useTranslations("Dialogs");
  const f = useFormatter();
  const isBulk = Boolean(ids && ids.length > 1);
  const name = item?.displayName || item?.name || "";
  const isFolder = Boolean(item) && !item?.mimeType && item?.size === undefined;
  const impact = isBulk
    ? t("remove.bulkImpact")
    : isFolder
      ? t("remove.folderImpact")
      : t("remove.fileImpact", {
          type: (name.split(".").pop() || "").toUpperCase() || t("details.file"),
          size: item?.size ? f.bytes(Number(item.size)) : t("details.unknown"),
          location: t("details.unknown"),
        });
  return (
    <DeleteForGoodDialog
      title={isBulk ? t("remove.titleBulk", { count: ids?.length ?? 0 }) : t("remove.title", { name })}
      impact={impact}
      item={isBulk ? undefined : item}
      itemType={isFolder ? "folder" : "file"}
      confirmLabel={t("remove.confirm")}
      onDelete={async (password) => {
        const r = onDelete({ ids: ids && ids.length ? ids : [item?.id as string], password }) as { unwrap?: () => Promise<unknown> } | Promise<unknown>;
        await (r && typeof (r as { unwrap?: unknown }).unwrap === "function" ? (r as { unwrap: () => Promise<unknown> }).unwrap() : r);
        onSuccess?.();
      }}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </DeleteForGoodDialog>
  );
}
