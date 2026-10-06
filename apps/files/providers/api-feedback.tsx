"use client";

// Fills lib/api-feedback with this language's messages. Mounted once, inside the intl provider.
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { setApiFeedback, type FeedbackContext } from "@/lib/api-feedback";

// Endpoints whose screens say the result themselves: no automatic toast, success or error.
const SELF = new Set(["uploadFile", "moveFile", "moveFolder", "createShare", "rotateShare", "revokeShare", "updateFolderAccess", "updateFileAccess", "createShareSession"]);
// Endpoints that ask for the password: a 400 means it was wrong (or missing), and nothing changed.
const PASSWORD = new Set(["permanentDeleteFiles", "permanentDeleteFolders", "permanentDeleteAllArchived", "deleteArchivedFile", "deleteArchivedFolder"]);

const nameIn = (data: unknown): string | undefined => {
  const d = data as { data?: { name?: unknown; displayName?: unknown } } | undefined;
  const name = d?.data?.displayName ?? d?.data?.name;
  return typeof name === "string" && name ? name : undefined;
};
const countIn = (args: unknown) => {
  const ids = (args as { ids?: unknown[] } | undefined)?.ids;
  return Array.isArray(ids) ? ids.length : 1;
};

export function ApiFeedback() {
  const t = useTranslations("Feedback");

  useEffect(() => {
    setApiFeedback({
      success: ({ endpoint, args, data }: FeedbackContext) => {
        if (SELF.has(endpoint)) return null;
        const name = nameIn(data);
        switch (endpoint) {
          case "createFolder":
            return name ? t("folderCreated", { name }) : t("folderCreatedPlain");
          case "updateFolder":
          case "updateFile":
            return (args as { name?: string })?.name ? t("renamed", { name: (args as { name: string }).name }) : t("saved");
          case "archiveFile":
          case "archiveFolder":
          case "deleteFolder":
          case "deleteFiles":
            return t("archived", { count: countIn(args) });
          case "restoreFile":
          case "restoreFolder":
            return name ? t("restoredNamed", { name }) : t("restored", { count: 1 });
          case "bulkRestoreFiles":
          case "bulkRestoreFolders":
            return t("restored", { count: countIn(args) });
          case "deleteArchivedFile":
          case "deleteArchivedFolder":
          case "permanentDeleteFiles":
          case "permanentDeleteFolders":
            return t("deletedForGood", { count: countIn(args) });
          case "permanentDeleteAllArchived":
            return t("archiveEmptied");
          case "pinFolder":
            return t("pinned");
          case "unpinFolder":
            return t("unpinned");
          case "updateFileUsed":
            return (args as { isUsed?: boolean })?.isUsed ? t("markedUsed") : t("markedNotUsed");
          default:
            return t("saved");
        }
      },
      error: ({ endpoint, status, code }: FeedbackContext) => {
        // Viewing as someone is read-only (D-017): say so, whichever change was refused.
        if (code === "read_only") return t("readOnly");
        if (SELF.has(endpoint)) return null;
        if (status === 400 && PASSWORD.has(endpoint)) return t("wrongPassword");
        switch (status) {
          case 403:
            return t("forbidden");
          case 404:
            return t("gone");
          case 409:
            return t("nameTaken");
          case 413:
            return t("tooLarge");
          case 429:
            return t("tooMany");
          case "FETCH_ERROR":
          case "TIMEOUT_ERROR":
            return t("offline");
          case 400:
          case 422:
            return t("invalid");
          default:
            return t("failed");
        }
      },
    });
    return () => setApiFeedback(null);
  }, [t]);

  return null;
}
