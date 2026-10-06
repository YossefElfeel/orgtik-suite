"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DeleteForGoodDialog } from "../DeleteForGood";
import { usePermanentDeleteAllArchivedMutation } from "@/redux/features/folder/folderApi";

/** Empties Archived files (super admins). */
export function DeleteAllFoldersDialog({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Dialogs");
  const [deleteAllArchived] = usePermanentDeleteAllArchivedMutation();
  return (
    <DeleteForGoodDialog title={t("remove.titleAll")} impact={t("remove.allImpact")} confirmLabel={t("remove.confirmAll")} onDelete={(password) => deleteAllArchived({ password }).unwrap()}>
      {children}
    </DeleteForGoodDialog>
  );
}
