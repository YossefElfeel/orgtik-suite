import { z } from "zod";

// The deal builder's form, shared by offers and projects (FS-SAL-7). Messages are translated: the
// schema is built with the "Deal" translator. No `.default()`: the dialog sets the defaults.

type T = (key: string) => string;

export type DealMode = "offer" | "project";

const payment = z.enum(["cash", "installment"]);

const standardLine = (t: T) =>
  z
    .object({
      key: z.string(),
      planId: z.string().min(1, t("errors.plan")),
      durationId: z.string(),
      /** The months the line was agreed for, when its duration id isn't known (an older offer). */
      durationMonths: z.number().nullable(),
      payment,
      installmentId: z.string(),
      installmentMonths: z.number().nullable(),
      /** The price the line was agreed at; kept on save so an edit never re-prices it (SAL-010). */
      keptTotal: z.number().nullable(),
      name: z.string(),
    })
    .superRefine((v, ctx) => {
      if (!v.durationId && !v.durationMonths) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["durationId"], message: t("errors.duration") });
      if (v.payment === "installment" && !v.installmentId && !v.installmentMonths)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["installmentId"], message: t("errors.installment") });
    });

const customLine = (t: T) =>
  z
    .object({
      key: z.string(),
      label: z.string().trim().min(1, t("errors.label")).max(120, t("errors.labelLong")),
      featureIds: z.array(z.string()),
      durationId: z.string(),
      durationMonths: z.number().nullable(),
      payment,
      installmentId: z.string(),
      installmentMonths: z.number().nullable(),
      keptTotal: z.number().nullable(),
      /** An offer's custom plan whose features the API doesn't send: it can be kept or removed, not changed. */
      locked: z.boolean(),
    })
    .superRefine((v, ctx) => {
      if (v.locked) return;
      if (!v.featureIds.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["featureIds"], message: t("errors.features") });
      if (!v.durationId && !v.durationMonths) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["durationId"], message: t("errors.duration") });
      if (v.payment === "installment" && !v.installmentId && !v.installmentMonths)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["installmentId"], message: t("errors.installment") });
    });

export function buildDealSchema(t: T, mode: DealMode) {
  return z
    .object({
      customerId: z.string().min(1, t("errors.customer")),
      countryCode: z.string().min(2, t("errors.country")),
      projectName: z.string().trim().max(160, t("errors.nameLong")),
      projectDescription: z.string().trim().max(2000, t("errors.textLong")),
      priority: z.enum(["low", "medium", "high"]),
      standard: z.array(standardLine(t)),
      custom: z.array(customLine(t)),
      vatCountryCode: z.string().min(1, t("errors.vat")),
      note: z.string().trim().max(2000, t("errors.textLong")),
      couponCode: z.string().trim().max(40, t("errors.couponLong")),
    })
    .superRefine((v, ctx) => {
      if (mode === "project" && !v.projectName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["projectName"], message: t("errors.name") });
      if (v.standard.length + v.custom.length < 1) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["standard", "root"], message: t("errors.noPlans") });
    });
}

export type DealFormValues = z.infer<ReturnType<typeof buildDealSchema>>;
export type DealStandardLine = DealFormValues["standard"][number];
export type DealCustomLine = DealFormValues["custom"][number];

/** "No VAT": the API applies none when no VAT country is sent. */
export const NO_VAT = "none";

/** The fields each step checks before moving on. */
export const DEAL_STEP_FIELDS = {
  customer: ["customerId", "countryCode", "projectName", "projectDescription", "priority"],
  plans: ["standard", "custom"],
  terms: ["vatCountryCode", "note", "couponCode"],
  review: [],
} as const satisfies Record<string, ReadonlyArray<keyof DealFormValues>>;

/** A counter needs an amount, in the offer's currency; the note is optional. */
export function buildCounterSchema(t: T) {
  return z.object({
    amount: z.number({ invalid_type_error: t("errors.amount"), required_error: t("errors.amount") }).positive(t("errors.amount")),
    note: z.string().trim().max(1000, t("errors.textLong")),
  });
}

export type CounterFormValues = z.infer<ReturnType<typeof buildCounterSchema>>;
