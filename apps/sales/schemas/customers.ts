import { z } from "zod";

// Built with the reader's translator, so every message is in their language (SAL-107). Pass
// useTranslations("Customers.form").

type T = (key: string) => string;

export const CUSTOMER_LANGUAGES = ["en", "ar", "de", "fr", "it"] as const;

export const customerFormSchema = (t: T) =>
  z.object({
    fullName: z.string().trim().min(1, t("nameRequired")),
    email: z.string().trim().min(1, t("emailRequired")).email(t("emailInvalid")),
    phoneNumber: z.string().trim(),
    address: z.string().trim(),
    countryCode: z.string().trim().regex(/^[A-Z]{2}$/, t("countryRequired")),
    companyName: z.string().trim(),
    commercialRegistrationNumber: z.string().trim(),
    website: z
      .string()
      .trim()
      .refine((v) => !v || /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(v), t("websiteInvalid")),
    assignedSalesmanId: z.string(),
    preferredLanguage: z.enum(CUSTOMER_LANGUAGES, { message: t("languageRequired") }),
    sendInvite: z.boolean(),
  });

export type CustomerFormValues = z.infer<ReturnType<typeof customerFormSchema>>;

/** The meeting's instant must be in the future. */
export const scheduleMeetingSchema = (t: T) =>
  z.object({
    scheduledAt: z
      .string()
      .min(1, t("meetingRequired"))
      .refine((v) => !v || new Date(v).getTime() > Date.now(), t("meetingInPast")),
    notes: z.string(),
  });

export type ScheduleMeetingFormValues = z.infer<ReturnType<typeof scheduleMeetingSchema>>;
