"use client";

// Fills lib/api-feedback with this language's messages. Mounted once, inside the intl provider.
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { setApiFeedback, type FeedbackContext } from "@/lib/api-feedback";
import { isolate } from "@/lib/bidi";
import { setDownloadFailedText } from "@/lib/downloadAttachmentFile";

// Changes whose screens show the result themselves: the card lands in its column, the tick is
// visible, the comment appears in the thread. A toast on every one of them was noise (TASKS-030).
// Their failures still toast, except moves: the board puts the card back and says why itself.
const QUIET = new Set([
  "createProject", // the dialog says it, with "Open project"
  "moveTask",
  "reorderTasksInSection",
  "reorderSubtasks",
  "createSubtask",
  "updateSubtask",
  "addComment",
  "updateComment",
  "addReaction",
  "removeReaction",
  "markReadnotifications",
  "markConversationAsRead",
  "createConversation",
  "createMessage",
  "createMessageVoice",
  "deleteMessage",
  "deleteConversation",
]);
const SELF_ERRORS = new Set(["moveTask", "reorderTasksInSection"]);

const nameIn = (data: unknown, args: unknown): string | undefined => {
  const d = (data as { data?: { title?: unknown; name?: unknown } } | undefined)?.data;
  const a = args as { title?: unknown; name?: unknown } | undefined;
  for (const v of [d?.title, d?.name, a?.title, a?.name]) if (typeof v === "string" && v.trim()) return isolate(v.trim());
  return undefined;
};
const countIn = (args: unknown) => {
  const a = args as { userIds?: unknown[]; teamIds?: unknown[]; ids?: unknown[] } | undefined;
  const list = a?.userIds ?? a?.teamIds ?? a?.ids;
  return Array.isArray(list) ? list.length : 1;
};

export function ApiFeedback() {
  const t = useTranslations("Feedback");

  useEffect(() => {
    setDownloadFailedText(t("downloadFailed"));
    setApiFeedback({
      success: ({ endpoint, args, data }: FeedbackContext) => {
        if (QUIET.has(endpoint)) return null;
        const name = nameIn(data, args);
        switch (endpoint) {
          case "createTask":
            return name ? t("taskCreated", { name }) : t("taskCreatedPlain");
          case "deleteTask":
            return t("taskDeleted");
          case "createProject":
            return name ? t("projectCreated", { name }) : t("projectCreatedPlain");
          case "deleteProject":
            return t("projectDeleted");
          case "createProjectSection":
            return name ? t("sectionCreated", { name }) : t("sectionCreatedPlain");
          case "deleteProjectSection":
            return t("sectionDeleted");
          case "createTeam":
            return name ? t("teamCreated", { name }) : t("teamCreatedPlain");
          case "deleteTeam":
            return t("teamDeleted");
          case "addMembersToProject":
          case "addMembersToTeam":
            return t("membersAdded", { count: countIn(args) });
          case "addTeamsToProject":
            return t("teamsAdded", { count: countIn(args) });
          case "deleteMembers":
          case "removeMembersFromTeam":
            return t("membersRemoved", { count: countIn(args) });
          case "removeTeams":
            return t("teamsRemoved", { count: countIn(args) });
          case "addAttachments":
            return t("attachmentsAdded");
          case "deleteAttachment":
            return t("attachmentRemoved");
          case "deleteComment":
            return t("commentDeleted");
          case "deleteSubtask":
            return t("subtaskDeleted");
          case "AddBookmark":
            return t("bookmarkAdded");
          case "clearNotifications":
            return t("notificationCleared");
          default:
            return t("saved");
        }
      },
      error: ({ endpoint, status, code }: FeedbackContext) => {
        // A View as session (D-017) may look but not change anything; the board says it too.
        if (code === "read_only") return t("readOnly");
        if (SELF_ERRORS.has(endpoint)) return null;
        switch (status) {
          case 403:
            return t("forbidden");
          case 404:
            return t("gone");
          case 409:
            return t("conflict");
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
