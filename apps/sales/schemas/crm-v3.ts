import { z } from "zod";
import { parseCrmCsv } from "@/lib/crm-v3";
export function crmImportSchema(t: (key: string) => string) {
  return z.object({
    source: z
      .string()
      .min(1, t("required"))
      .max(100000, t("csvInvalid"))
      .refine((value) => {
        try {
          const rows = parseCrmCsv(value);
          return (
            rows.length > 1 &&
            rows[0].every((cell) => cell.trim()) &&
            new Set(rows[0]).size === rows[0].length
          );
        } catch {
          return false;
        }
      }, t("csvInvalid")),
    mapping: z
      .record(z.string())
      .refine(
        (value) =>
          Boolean(value.name && value.email) && value.name !== value.email,
        t("csvInvalid"),
      ),
  });
}
export function crmContactSchema(t: (key: string) => string) {
  return z.object({
    fullName: z.string().trim().min(1, t("required")).max(200),
    email: z.string().email(t("emailInvalid")),
    companyName: z.string().max(200),
    phoneNumber: z.string().max(100),
    countryCode: z.string().regex(/^[A-Z]{2}$/, t("countryInvalid")),
    value: z.number().min(0, t("numberInvalid")).max(1e9, t("numberInvalid")),
  });
}
export function crmActivitySchema(t: (key: string) => string) {
  return z.object({
    kind: z.enum([
      "note",
      "call",
      "email",
      "meeting",
      "whatsapp",
      "click_to_call",
    ]),
    text: z.string().trim().min(1, t("required")).max(5000),
    scheduledAt: z.string(),
  });
}
export function crmCompanySchema(t: (key: string) => string) {
  return z.object({
    name: z.string().trim().min(1, t("required")).max(200),
    sector: z.string().max(200),
    website: z
      .string()
      .max(500)
      .refine(
        (value) => !value || /^https?:\/\//.test(value),
        t("websiteInvalid"),
      ),
    notes: z.string().max(5000),
  });
}
export function crmTaskSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().trim().min(1, t("required")).max(500),
    projectId: z.string().min(1, t("required")),
    sectionId: z.string().min(1, t("required")),
  });
}
export function crmDefinitionSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().trim().min(1, t("required")).max(200),
    probability: z
      .number()
      .min(0, t("numberInvalid"))
      .max(100, t("numberInvalid")),
    type: z.enum(["text", "number", "checkbox"]),
    source: z.string().max(200),
    ownerId: z.string(),
    amount: z.number().min(0, t("numberInvalid")).max(1e9, t("numberInvalid")),
    currency: z.string().regex(/^[A-Z]{3}$/, t("countryInvalid")),
  });
}
export function crmConfigSchema(t: (key: string) => string) {
  return z
    .object({
      kind: z.enum(["pipeline", "stage", "field", "routing", "target"]),
      name: z.string().max(200),
      probability: z
        .number()
        .min(0, t("numberInvalid"))
        .max(100, t("numberInvalid")),
      status: z.string(),
      type: z.enum(["text", "number", "checkbox"]),
      source: z.string().max(200),
      ownerId: z.string(),
      amount: z
        .number()
        .min(0, t("numberInvalid"))
        .max(1e9, t("numberInvalid")),
      currency: z.string().regex(/^[A-Z]{3}$/, t("currencyInvalid")),
      period: z.string(),
    })
    .superRefine((value, context) => {
      if (
        ["pipeline", "stage", "field"].includes(value.kind) &&
        !value.name.trim()
      )
        context.addIssue({
          code: "custom",
          path: ["name"],
          message: t("required"),
        });
      if (value.kind === "routing") {
        for (const key of ["source", "ownerId"] as const)
          if (!value[key].trim())
            context.addIssue({
              code: "custom",
              path: [key],
              message: t("required"),
            });
      }
      if (value.kind === "target" && !/^\d{4}-\d{2}$/.test(value.period))
        context.addIssue({
          code: "custom",
          path: ["period"],
          message: t("required"),
        });
    });
}
export function crmProvisioningSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().trim().min(1, t("required")).max(200),
    country: z.string().regex(/^[A-Z]{2}$/, t("countryInvalid")),
  });
}
export function crmOfferSchema(t: (key: string) => string) {
  return z
    .object({
      validUntil: z.string().min(1, t("required")),
      name: z.string().trim().max(200),
      consent: z.boolean(),
    })
    .refine((value) => !value.consent || Boolean(value.name), {
      path: ["name"],
      message: t("required"),
    });
}
