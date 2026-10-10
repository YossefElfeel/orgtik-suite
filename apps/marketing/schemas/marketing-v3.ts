import { z } from "zod";
export const brandSchema = (t: (key: string) => string) =>
  z.object({
    voice: z.enum(["warm", "direct", "formal"]),
    audience: z.string().trim().min(1, t("required")).max(160, t("tooLong")),
    proposition: z.string().trim().min(1, t("required")).max(300, t("tooLong")),
    companyName: z.string().trim().min(1, t("required")).max(200, t("tooLong")),
    postalAddress: z.string().trim().max(500, t("tooLong")),
  });
export const emailSchema = (t: (key: string) => string) =>
  z.object({
    subject: z.string().trim().min(1, t("required")).max(200, t("tooLong")),
    headline: z.string().trim().min(1, t("required")).max(200, t("tooLong")),
    body: z.string().trim().min(1, t("required")).max(15000, t("tooLong")),
    cta: z.string().trim().max(120, t("tooLong")),
    ctaUrl: z.union([
      z.literal(""),
      z
        .string()
        .url(t("invalidUrl"))
        .refine((value) => /^https?:\/\//.test(value), t("invalidUrl")),
    ]),
    direction: z.enum(["ltr", "rtl"]),
    companyName: z.string().trim().min(1, t("required")),
    postalAddress: z
      .string()
      .trim()
      .min(1, t("required"))
      .max(500, t("tooLong")),
    format: z.object({
      bold: z.boolean(),
      italic: z.boolean(),
      bullets: z.boolean(),
    }),
  });
export const replySchema = (t: (key: string) => string) =>
  z.object({
    body: z.string().trim().min(1, t("required")).max(4000, t("tooLong")),
  });
export const writingSchema = (t: (key: string) => string) =>
  z.object({
    topic: z.string().trim().min(1, t("required")).max(160, t("tooLong")),
  });
export const leadSchema = (t: (key: string) => string) =>
  z.object({
    contactId: z.string().min(1, t("required")),
    title: z.string().trim().min(1, t("required")).max(200, t("tooLong")),
    estimate: z
      .number()
      .finite()
      .min(0, t("invalidNumber"))
      .max(1000000000, t("invalidNumber")),
  });

export const senderSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().trim().min(1, t("required")).max(160, t("tooLong")),
    from: z.string().trim().email(t("invalidUrl")),
  });
export const templateSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().trim().min(1, t("required")).max(160, t("tooLong")),
    senderId: z.string().min(1, t("required")),
  });
export const journeySchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().trim().min(1, t("required")).max(160, t("tooLong")),
    campaignId: z.string().min(1, t("required")),
  });
export const journeyEditSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().trim().min(1, t("required")).max(160, t("tooLong")),
    steps: z
      .array(
        z.object({
          id: z.string().min(1),
          type: z.enum(["entry", "email", "wait", "task"]),
          days: z
            .number()
            .int()
            .min(0, t("invalidNumber"))
            .max(365, t("invalidNumber")),
          templateId: z.string().optional(),
          taskIds: z.array(z.number()).optional(),
        }),
      )
      .min(1)
      .max(30),
  });
export const taskSchema = (t: (key: string) => string) =>
  z.object({
    title: z.string().trim().min(1, t("required")).max(200, t("tooLong")),
    projectId: z.string().min(1, t("required")),
    sectionId: z.string().min(1, t("required")),
  });
