"use client";

// Fills lib/api-feedback with this language's messages (HR wave, FS-HR-3). Mounted once, inside the
// intl provider. Each change says one thing, once, in the reader's language; the API's English and
// the dialogs' second toast are gone.
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { setApiFeedback, type FeedbackContext } from "@/lib/api-feedback";

// Changes whose screens say the result themselves, or that need no word: no automatic toast.
const QUIET = new Set([
  "markNotificationRead",
  "markAllNotificationsRead",
  "addMessageToTicket",
  "exportBankFile",
  "updateOnboardingStep",
]);

const SPECIFIC: Record<string, string> = {
  createEmployee: "employeeAdded",
  removeEmployee: "employeeRemoved",
  deleteEmployee: "employeeRemoved",
  createTimeOffRequest: "requestSent",
  makeTimeOffDecision: "decisionSaved",
  startPayrollRun: "runStarted",
  freezePayrollRun: "runFrozen",
  reopenPayrollRun: "runReopened",
  submitPayrollEmployees: "sentForApproval",
  submitPayrollReview: "reviewSubmitted",
  approveAllPayroll: "allApproved",
  payAllPayroll: "paymentsRecorded",
  payAllroll: "paymentsRecorded",
  markPayrollItemAsPaid: "paymentRecorded",
  sendAllPayslipsEmail: "payslipsSent",
  sendPayslipEmail: "payslipSent",
  createTicket: "ticketCreated",
  updateTicketStatus: "saved",
};

export function ApiFeedback() {
  const t = useTranslations("feedback");

  useEffect(() => {
    setApiFeedback({
      success: ({ endpoint }: FeedbackContext) => {
        if (QUIET.has(endpoint)) return null;
        const specific = SPECIFIC[endpoint];
        if (specific) return t(specific);
        if (/^(delete|remove)/.test(endpoint)) return t("deleted");
        if (/^upload/.test(endpoint)) return t("uploaded");
        if (/^(create|add|assign)/.test(endpoint)) return t("added");
        return t("saved");
      },
      error: ({ endpoint, status, code }: FeedbackContext) => {
        if (code === "read_only") return t("readOnly");
        if (QUIET.has(endpoint)) return null;
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
