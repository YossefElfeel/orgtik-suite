import { z } from "zod";
import {
  markPaidPaymentMethods,
  markPaidPaymentMethodOptions,
} from "@/schemas/invoices";

export const createInvoiceBillToTypes = ["customer", "salesman"] as const;

export type CreateInvoiceBillToType =
  (typeof createInvoiceBillToTypes)[number];

export const createInvoiceLineItemSchema = z.object({
  id: z.string(),
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Amount must be 0 or greater"),
});

export const createInvoiceSchema = z
  .object({
    billToType: z.enum(createInvoiceBillToTypes, {
      required_error: "Bill to type is required",
    }),
    customerId: z.string().optional(),
    salesmanId: z.string().optional(),
    billingAddress: z.string().optional(),
    projectId: z.string().optional(),
    dueDate: z.string().trim().min(1, "Due date is required"),
    senderName: z.string().trim().min(1, "Sender name is required"),
    senderAddress: z.string().trim().min(1, "Sender address is required"),
    lineItems: z
      .array(createInvoiceLineItemSchema)
      .min(1, "Add at least one line item"),
    notes: z.string().optional(),
    currency: z.string().trim().min(1, "Currency is required"),
    paymentMethod: z.enum(markPaidPaymentMethods, {
      required_error: "Payment method is required",
    }),
    transferReference: z.string().optional(),
    cardNumber: z.string().optional(),
    paymentDetails: z.string().optional(),
    markAsPaidNow: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.billToType === "customer") {
      if (!data.customerId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Customer is required",
          path: ["customerId"],
        });
      }
      if (!data.billingAddress?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Billing address is required",
          path: ["billingAddress"],
        });
      }
    }

    if (data.billToType === "salesman" && !data.salesmanId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Salesman is required",
        path: ["salesmanId"],
      });
    }
  });

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;
export type CreateInvoiceLineItemFormValues = z.infer<
  typeof createInvoiceLineItemSchema
>;

export const createInvoiceStepFields: Record<
  number,
  (keyof CreateInvoiceFormValues)[]
> = {
  0: [
    "billToType",
    "customerId",
    "salesmanId",
    "billingAddress",
    "projectId",
    "dueDate",
  ],
  1: [
    "senderName",
    "senderAddress",
    "lineItems",
    "notes",
    "currency",
    "paymentMethod",
    "transferReference",
    "cardNumber",
    "paymentDetails",
    "markAsPaidNow",
  ],
};

export { markPaidPaymentMethodOptions };

export const createInvoiceCurrencyOptions = [
  { value: "SAR", label: "SAR" },
  { value: "USD", label: "USD" },
  { value: "AED", label: "AED" },
  { value: "EUR", label: "EUR" },
] as const;

export const CREATE_INVOICE_VAT_RATE = 0.15;
