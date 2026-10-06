"use client";

// Fills lib/api-feedback with this language's messages (the Files pattern). Mounted once, inside
// the intl provider.
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { setApiFeedback, type FeedbackContext } from "@/lib/api-feedback";

// Screens that report their own result (sign-in and its flows, opening a site): stay quiet.
const SELF = new Set([
  "login", "logout", "loginAs", "getInviteMetadata", "forgotPassword", "resetPassword", "acceptInvite",
  "createCMSAccountToken", "createTokenForCMSInstance", "changePassword",
]);

const flag = (args: unknown, key: string) => (args as Record<string, unknown> | undefined)?.[key];

export function ApiFeedback() {
  const t = useTranslations("Feedback");

  useEffect(() => {
    setApiFeedback({
      success: ({ endpoint, args }: FeedbackContext) => {
        if (SELF.has(endpoint)) return null;
        switch (endpoint) {
          case "createUser":
            return t("personAdded");
          case "updateUser": {
            const active = flag(args, "isActive");
            return active === true ? t("activated") : active === false ? t("deactivated") : t("saved");
          }
          case "deleteUser":
            return t("personDeleted");
          case "updateUserType":
            return t("typeChanged");
          case "addUserScope":
            return t("accessGiven");
          case "removeUserScope":
            return t("accessRemoved");
          case "addUserScopeRole":
          case "updateUserRole":
            return t("roleAdded");
          case "removeUserScopeRole":
            return t("roleRemoved");
          case "createScope":
            return t("systemAdded");
          case "updateScope": {
            const active = flag(args, "isActive");
            return active === true ? t("systemOn") : active === false ? t("systemOff") : t("saved");
          }
          case "deleteScope":
            return t("systemDeleted");
          case "createCMSInstance":
            return t("cmsAdded");
          case "deleteCMSInstance":
            return t("cmsDeleted");
          case "createCMSAccount":
            return t("accountAdded");
          case "deleteCMSAccount":
            return t("accountDeleted");
          case "assignUsersToCMSAccount":
            return t("membersAdded");
          case "removeUserFromCMSAccount":
            return t("memberRemoved");
          case "updateProfile": {
            // A language change flips the whole app: that says it already.
            const profile = (args as { profile?: Record<string, unknown> } | undefined)?.profile;
            const keys = Object.keys((args as Record<string, unknown>) ?? {});
            if (keys.length === 1 && profile && Object.keys(profile).join() === "language") return null;
            return t("profileSaved");
          }
          case "uploadAvatar":
            return t("photoUpdated");
          case "deleteAvatar":
            return t("photoRemoved");
          default:
            return t("saved");
        }
      },
      error: ({ endpoint, status, code }: FeedbackContext) => {
        // Viewing as someone is read-only: say so, whichever change was refused.
        if (code === "read_only") return t("readOnly");
        if (SELF.has(endpoint)) return null;
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
