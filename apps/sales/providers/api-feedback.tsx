"use client";

// Fills lib/api-feedback with this language's messages. Mounted once, inside the intl provider.
// Changes said the API's English message ("Successfully done" when it had none); now each says what
// happened in the reader's language. Endpoints whose screen shows the result itself are quiet, and
// a call can still pass `skipSuccessToast`.
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { setApiFeedback, type FeedbackContext } from "@/lib/api-feedback";

// Endpoints whose screens say the result themselves (a dialog's own message, a row that changes).
const QUIET = new Set<string>([]);

export function ApiFeedback() {
  const t = useTranslations("Feedback");

  useEffect(() => {
    setApiFeedback({
      success: ({ endpoint }: FeedbackContext) => {
        if (QUIET.has(endpoint)) return null;
        if (/^(delete|remove)/i.test(endpoint)) return t("deleted");
        if (/^(create|add|upload)/i.test(endpoint)) return t("added");
        return t("saved");
      },
      error: ({ status, code }: FeedbackContext) => {
        // A View as session (D-017) may look but not change anything.
        if (code === "read_only") return t("readOnly");
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
