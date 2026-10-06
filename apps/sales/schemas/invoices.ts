import { z } from "zod";
import {
  invoicePaymentMethods,
  type InvoicePaymentMethod,
} from "@/types/invoices";

export const markPaidPaymentMethods = invoicePaymentMethods;

export type MarkPaidPaymentMethod = InvoicePaymentMethod;

export const markPaidSchema = z
  .object({
    paymentMethod: z.enum(markPaidPaymentMethods, {
      required_error: "Payment method is required",
    }),
    transferReference: z.string().optional(),
    cardNumber: z.string().optional(),
    paymentDetails: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // A card payment is recorded by its last 4 digits only: a full card number must never be
    // typed into the CRM or stored as a reference (SAL-020).
    if (data.paymentMethod === "credit_card" && !/^\d{4}$/.test(data.cardNumber?.trim() ?? "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the card's last 4 digits",
        path: ["cardNumber"],
      });
    }
    if (
      data.paymentMethod === "bank_transfer" &&
      !data.transferReference?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Transfer reference / IBAN is required",
        path: ["transferReference"],
      });
    }
  });

export type MarkPaidFormValues = z.infer<typeof markPaidSchema>;

export const markPaidPaymentMethodOptions: {
  value: MarkPaidPaymentMethod;
  label: string;
}[] = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

export const voidInvoiceSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(2, "Reason must be at least 2 characters")
    .max(500, "Reason must be at most 500 characters"),
});

export type VoidInvoiceFormValues = z.infer<typeof voidInvoiceSchema>;

/** Maps mark-paid form values to the API payload. */
export function toMarkInvoicePaidDTO(
  values: MarkPaidFormValues,
): {
  paymentMethod: MarkPaidPaymentMethod;
  transferReference?: string;
} {
  const transferReference =
    values.paymentMethod === "bank_transfer"
      ? values.transferReference?.trim()
      : values.paymentMethod === "credit_card"
        ? `card ending ${values.cardNumber?.trim().slice(-4)}`
        : values.paymentMethod === "other"
          ? values.paymentDetails?.trim()
          : undefined;

  return {
    paymentMethod: values.paymentMethod,
    ...(transferReference ? { transferReference } : {}),
  };
}
