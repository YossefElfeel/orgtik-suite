import { z } from "zod";

type T = (key: string) => string;

/** A project's own details, edited from its page. Plans change in the deal builder. */
export function buildProjectDetailsSchema(t: T) {
  return z.object({
    projectName: z.string().trim().min(1, t("errors.name")).max(160, t("errors.nameLong")),
    projectDescription: z.string().trim().max(2000, t("errors.textLong")),
  });
}

export type ProjectDetailsFormValues = z.infer<ReturnType<typeof buildProjectDetailsSchema>>;

export function buildDueDateSchema(t: T) {
  return z.object({
    dueDate: z.string().min(1, t("errors.dueDate")),
  });
}

export type DueDateFormValues = z.infer<ReturnType<typeof buildDueDateSchema>>;

export function buildContactNoteSchema(t: T) {
  return z.object({
    content: z.string().trim().min(1, t("errors.note")).max(2000, t("errors.textLong")),
  });
}

export type ContactNoteFormValues = z.infer<ReturnType<typeof buildContactNoteSchema>>;

/**
 * @deprecated The old project wizard's values. Only the dead fixture mock/projects.ts still
 * imports it; it goes when that file does.
 */
export type ProjectFormValues = {
  projectType: "client_project" | "internal_project";
  clientId: string;
  name: string;
  description: string;
  priority: "low" | "medium" | "high";
  departmentId: string;
  salesmanId?: string;
  vatCountryId: string;
  couponCode?: string;
  projectPlans: { planId: string; durationId: string; paymentMethod: "cash" | "installments"; installmentDurationId?: string }[];
  customPlans: {
    id: string;
    label: string;
    featureIds: string[];
    duration: "1_month" | "3_months" | "6_months" | "12_months";
    installmentPaymentMethod: "cash" | "installments";
    installmentPlanId?: string;
    addedToProject: boolean;
  }[];
};
