import { z } from "zod";
import { accountNumberOk, swiftOk, type Translate } from "@/schemas/salesman";

/** The person's own details on their SOS profile. */
export const personalInfoSchema = (t: Translate) =>
  z.object({
    firstName: z.string().trim().min(1, t("firstNameRequired")).max(60, t("tooLong")),
    lastName: z.string().trim().min(1, t("lastNameRequired")).max(60, t("tooLong")),
    phone: z.string().trim().max(40, t("tooLong")),
    jobTitle: z.string().trim().max(80, t("tooLong")),
    department: z.string().trim().max(80, t("tooLong")),
    bio: z.string().trim().max(500, t("tooLong")),
  });

export type PersonalInfoFormValues = z.infer<ReturnType<typeof personalInfoSchema>>;

/** A salesperson's own bank account, where commissions are paid. */
export const bankAccountSchema = (t: Translate) =>
  z.object({
    accountName: z.string().trim().min(1, t("accountNameRequired")).max(120, t("tooLong")),
    bankName: z.string().trim().min(1, t("bankNameRequired")).max(120, t("tooLong")),
    iban: z.string().trim().min(1, t("ibanRequired")).refine(accountNumberOk, t("ibanInvalid")),
    swiftBic: z
      .string()
      .trim()
      .refine((v) => !v || swiftOk(v), t("swiftInvalid")),
  });

export type BankAccountFormValues = z.infer<ReturnType<typeof bankAccountSchema>>;
