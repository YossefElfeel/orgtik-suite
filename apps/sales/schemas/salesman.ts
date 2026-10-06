import { z } from "zod";
import { looksLikeCardNumber } from "@/lib/commissions";

/** The form's translate function, for the messages (`Team.form.*`). */
export type Translate = (key: string, values?: Record<string, string | number>) => string;

const compact = (v: string) => v.replace(/[\s-]/g, "");

/** An IBAN or a local account number: letters and digits, 6 to 34 of them. */
export const accountNumberOk = (v: string) => /^[A-Za-z0-9]{6,34}$/.test(compact(v));
/** A SWIFT/BIC code: 8 or 11 letters and digits. */
export const swiftOk = (v: string) => /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/.test(compact(v));

/** Bank details, all optional (a salesperson's record). */
export const bankFields = (t: Translate) => ({
  accountName: z.string().trim().max(120, t("tooLong")),
  bankName: z.string().trim().max(120, t("tooLong")),
  iban: z
    .string()
    .trim()
    .refine((v) => !v || accountNumberOk(v), t("ibanInvalid")),
  swiftBic: z
    .string()
    .trim()
    .refine((v) => !v || swiftOk(v), t("swiftInvalid")),
});

/** Create or edit a salesperson (admins). */
export const salesmanSchema = (t: Translate) =>
  z.object({
    fullName: z.string().trim().min(1, t("nameRequired")).max(120, t("tooLong")),
    email: z.string().trim().min(1, t("emailRequired")).email(t("emailInvalid")),
    phoneNumber: z.string().trim().max(40, t("tooLong")),
    address: z.string().trim().max(240, t("tooLong")),
    departmentId: z.string(),
    zoneId: z.string(),
    ...bankFields(t),
  });

export type SalesmanFormValues = z.infer<ReturnType<typeof salesmanSchema>>;

/** A note on a salesperson. */
export const salesmanNoteSchema = (t: Translate) =>
  z.object({
    content: z.string().trim().min(1, t("noteRequired")).max(2000, t("tooLong")),
  });

export type SalesmanNoteFormValues = z.infer<ReturnType<typeof salesmanNoteSchema>>;

/**
 * Paying a commission or a wallet. The amount is at most what is due; the reference is the bank
 * transfer's, never a card number (SAL-020). `dueLabel` is the due amount, written out.
 */
export const payoutSchema = (t: Translate, due: number, dueLabel: string) =>
  z.object({
    amount: z
      .number({ invalid_type_error: t("amountRequired"), required_error: t("amountRequired") })
      .positive(t("amountRequired"))
      .refine((v) => v <= due + 0.0001, t("amountTooHigh", { due: dueLabel })),
    reference: z
      .string()
      .trim()
      .min(1, t("referenceRequired"))
      .max(64, t("referenceTooLong"))
      .refine((v) => !looksLikeCardNumber(v), t("referenceCard")),
    receipt: z.array(z.custom<File>((v) => typeof File !== "undefined" && v instanceof File)).max(1),
  });

export type PayoutFormValues = z.infer<ReturnType<typeof payoutSchema>>;
