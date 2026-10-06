import { z } from "zod";

export const customInvoiceLineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be at least 0.01"),
  unitPrice: z.coerce.number().min(0.01, "Unit price must be at least 0.01"),
  amount: z.coerce.number().min(0.01).optional(),
});

export const customInvoiceMetadataSchema = z.object({
  projectReference: z.string().optional(),
  notes: z.string().optional(),
});

export const customInvoiceSchema = z
  .object({
    customerId: z.string().optional(),
    invoiceNumber: z.string().optional(),
    billingName: z
      .string({ invalid_type_error: "billingName must be a string" })
      .optional(),
    billingContactPerson: z.string().optional(),
    billingEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    billingPhone: z.string().optional(),
    billingAddress: z.string().optional(),
    currency: z.string().optional(),
    dueDate: z.string().optional(),
    description: z.string().optional(),
    contactPerson: z.string().optional(),
    contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    contactPhone: z.string().optional(),
    closingText: z.string().optional(),
    lineItems: z
      .array(customInvoiceLineItemSchema)
      .min(1, "Add at least one line item"),
    taxRate: z.coerce.number().min(0).max(100).optional(),
    metadata: customInvoiceMetadataSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const hasCustomerId = Boolean(data.customerId?.trim());

    if (hasCustomerId) {
      return;
    }

    if (typeof data.billingName !== "string") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "billingName must be a string",
        path: ["billingName"],
      });
      return;
    }

    if (!data.billingName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "billingName is required when customerId is not provided",
        path: ["billingName"],
      });
    }
  });

export type CustomInvoiceFormValues = z.infer<typeof customInvoiceSchema>;
export type CustomInvoiceLineItemFormValues = z.infer<
  typeof customInvoiceLineItemSchema
>;

export const customInvoiceStepFields: Record<
  number,
  (keyof CustomInvoiceFormValues)[]
> = {
  0: [
    "customerId",
    "invoiceNumber",
    "billingName",
    "billingContactPerson",
    "billingEmail",
    "billingPhone",
    "billingAddress",
    "currency",
    "dueDate",
    "description",
  ],
  1: [
    "contactPerson",
    "contactEmail",
    "contactPhone",
    "closingText",
    "lineItems",
    "taxRate",
    "metadata",
  ],
};

export const sendCustomInvoiceSchema = z.object({
  emailsText: z
    .string()
    .trim()
    .min(1, "Enter at least one email")
    .superRefine((value, ctx) => {
      const emails = value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (emails.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter at least one email",
        });
        return;
      }

      const emailSchema = z.string().email();
      for (const email of emails) {
        const result = emailSchema.safeParse(email);
        if (!result.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid email: ${email}`,
          });
        }
      }
    }),
});

export type SendCustomInvoiceFormValues = z.infer<
  typeof sendCustomInvoiceSchema
>;

export const markCustomInvoicePaidSchema = z.object({
  paidAt: z.string().optional(),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
  paymentProof: z
    .instanceof(File)
    .optional()
    .refine(
      (file) =>
        !file ||
        ["application/pdf", "image/jpeg", "image/jpg", "image/png"].includes(
          file.type,
        ),
      "Payment proof must be PDF, JPG, or PNG",
    ),
});

export type MarkCustomInvoicePaidFormValues = z.infer<
  typeof markCustomInvoicePaidSchema
>;
