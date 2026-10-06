import { z } from "zod";

const toStringArray = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => String(item)) : [];

const toFileArray = (value: unknown) => {
  if (!value) return [];
  if (value instanceof File) return [value];
  if (Array.isArray(value)) {
    return value.filter((item): item is File => item instanceof File);
  }
  return [];
};

const stripHtml = (html: string) => {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, "").trim();
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() ?? "";
};

/**
 * A new support ticket. Messages come from the caller's catalog (addTicketDialog.validation),
 * so they're in the reader's language.
 */
export const makeAddTicketSchema = (messages: {
  subjectRequired: string;
  departmentRequired: string;
  assigneeRequired: string;
  descriptionRequired: string;
}) =>
  z.object({
    subject: z.string().trim().min(1, messages.subjectRequired),
    departmentId: z.preprocess(
      (value) => (value === null || value === undefined ? "" : String(value)),
      z.string().trim().min(1, messages.departmentRequired),
    ),
    assignTo: z.preprocess(
      toStringArray,
      z.array(z.string()).min(1, messages.assigneeRequired),
    ),
    description: z
      .string()
      .refine((html) => html.length > 0, messages.descriptionRequired),
    attachment: z.preprocess(toFileArray, z.array(z.instanceof(File))),
  });

export type AddTicketFormInput = z.input<ReturnType<typeof makeAddTicketSchema>>;
export type AddTicketFormValues = z.output<ReturnType<typeof makeAddTicketSchema>>;

/** A reply on a ticket's thread. */
export const makeTicketMessageSchema = (messages: { descriptionRequired: string }) =>
  z.object({
    description: z
      .string()
      .refine((html) => stripHtml(html).length > 0, messages.descriptionRequired),
    attachment: z
      .custom<File | File[] | null>()
      .optional()
      .transform((value) => {
        if (!value) return [] as File[];
        return Array.isArray(value) ? value : [value];
      }),
  });

export type TicketMessageFormInputValues = z.input<ReturnType<typeof makeTicketMessageSchema>>;
export type TicketMessageFormValues = z.output<ReturnType<typeof makeTicketMessageSchema>>;

/** Status and assignees on a ticket's detail page. */
export const makeTicketStatusSchema = (messages: { statusRequired: string }) =>
  z.object({
    status: z.string().min(1, messages.statusRequired),
    departmentId: z.string().optional(),
    assignees: z.array(z.string()),
  });

export type TicketStatusFormValues = z.infer<ReturnType<typeof makeTicketStatusSchema>>;
