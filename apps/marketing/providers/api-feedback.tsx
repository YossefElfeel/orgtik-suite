"use client";

// Fills lib/api-feedback with this language's messages. Mounted once, inside the intl provider.
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { setApiFeedback, type FeedbackContext } from "@/lib/api-feedback";
import { isolate } from "@/lib/bidi";

// Changes whose screens show the result themselves: a wizard step moves on, the comment appears
// in its thread, the brand switch reloads the screen. A toast on each of them was noise.
const QUIET = new Set([
  "createProject", // the dialog says it, with the name
  "switchProject",
  "updateCampaignDraft",
  "updateCampaignOnboarding",
  "createCampaignComment",
  "createComment",
  "preflightIntegration",
  "connectIntegration",
  "integrationFacebookComplete",
  "addTarget",
  "updateTargets",
  "updateTargetMedia",
  "deleteTarget",
  "uploadAudienceImport",
]);

const nameIn = (data: unknown, args: unknown): string | undefined => {
  const d = (data as { data?: { title?: unknown; name?: unknown } } | undefined)
    ?.data;
  const a = args as { title?: unknown; name?: unknown } | undefined;
  for (const v of [d?.title, d?.name, a?.title, a?.name])
    if (typeof v === "string" && v.trim()) return isolate(v.trim());
  return undefined;
};
const countIn = (args: unknown) => {
  const a = args as
    | { reviewerIds?: unknown[]; userIds?: unknown[]; ids?: unknown[] }
    | undefined;
  const list = a?.reviewerIds ?? a?.userIds ?? a?.ids;
  return Array.isArray(list) ? list.length : 1;
};

export function ApiFeedback() {
  const t = useTranslations("Feedback");
  const recovery = useTranslations("MarketingV3");

  useEffect(() => {
    setApiFeedback({
      success: ({ endpoint, args, data }: FeedbackContext) => {
        if (QUIET.has(endpoint)) return null;
        const name = nameIn(data, args);
        switch (endpoint) {
          case "createProject":
            return name
              ? t("projectCreated", { name })
              : t("projectCreatedPlain");
          case "deleteProject":
            return t("projectDeleted");
          case "createCampaign":
            return t("campaignCreated");
          case "publishCampaign":
            // A campaign with approvers is sent for approval, not published, until they approve.
            return (data as { data?: { workflowState?: string } } | undefined)
              ?.data?.workflowState === "AWAITING_REVIEW"
              ? t("approvalRequested")
              : t("campaignPublished");
          case "deleteCampaign":
            return t("campaignDeleted");
          case "requestCampaignApproval":
            return t("approvalRequested");
          case "approveCampaign":
          case "approveReviewer":
            return t("approved");
          case "rejectCampaign":
          case "rejectReviewer":
            return t("rejected");
          case "rollbackCampaignLastApproved":
          case "rollbackLastApproved":
            return t("rolledBack");
          case "addCampaignReviewers":
          case "addReviewer":
            return t("reviewersAdded", { count: countIn(args) });
          case "removeCampaignReviewer":
            return t("reviewerRemoved");
          case "createPost":
          case "createNewPost":
            return t("postCreated");
          case "publishNow":
            return t("postPublished");
          case "duplicatePost":
            return t("postDuplicated");
          case "deletePost":
            return t("postDeleted");
          case "syncPost":
          case "syncIntegration":
            return t("synced");
          case "toggleIntegrationStatus":
            return (data as { data?: { isConnected?: boolean } } | undefined)
              ?.data?.isConnected === false
              ? t("integrationTurnedOff")
              : t("integrationTurnedOn");
          case "boostPost":
            // A boost the platform refused answers 201 with status FAILED; the dialog says so itself.
            return (data as { data?: { status?: string } } | undefined)?.data
              ?.status === "FAILED"
              ? null
              : t("boostStarted");
          case "uploadMedia":
            return t("mediaUploaded");
          case "deleteMedia":
            return t("mediaDeleted");
          case "deleteIntegration":
            return t("integrationRemoved");
          case "finishIntegration":
            return t("integrationConnected");
          case "createLabel":
          case "createNewLabel":
            return name ? t("labelCreated", { name }) : t("labelCreatedPlain");
          case "deleteLabel":
            return t("labelDeleted");
          case "uploadAvatar":
            return t("logoUpdated");
          case "deleteAvatar":
            return t("logoRemoved");
          case "commitAudienceImport":
            return t("contactsImported");
          case "createAudienceSegment":
            return name
              ? t("segmentCreated", { name })
              : t("segmentCreatedPlain");
          case "deleteAudienceSegment":
            return t("segmentDeleted");
          case "createTemplate":
            return t("templateCreated");
          default:
            return t("saved");
        }
      },
      error: ({ endpoint, status, code }: FeedbackContext) => {
        if (code === "recover_original_first") return recovery("recoverFirst");
        // A View as session (D-017) may look but not change anything.
        if (code === "read_only") return t("readOnly");
        // The label dialog says a duplicate name next to the field.
        if (
          status === 409 &&
          (endpoint === "createLabel" ||
            endpoint === "createNewLabel" ||
            endpoint === "updateLabel")
        )
          return null;
        if (status === 409 && endpoint === "publishNow")
          return t("publishNowConflict");
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
  }, [t, recovery]);

  return null;
}
