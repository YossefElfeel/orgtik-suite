import { z } from "zod";

export const renewSubscriptionSchema = z.object({
  durationId: z.string().min(1, "Select a duration"),
  paymentType: z.enum(["full_payment", "installment"]),
});

export type RenewSubscriptionFormValues = z.infer<
  typeof renewSubscriptionSchema
>;

export const subscribePlanSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().min(1, "Project description is required"),
  durationId: z.string().min(1, "Select a duration"),
  couponCode: z.string().optional(),
});

export type SubscribePlanFormValues = z.infer<typeof subscribePlanSchema>;

export const paySubscriptionSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .positive("Enter a valid amount"),
});

export type PaySubscriptionFormValues = z.infer<typeof paySubscriptionSchema>;

export const cancelSubscriptionReasons = [
  "customer_requested",
  "no_longer_needed",
  "switching_plan",
  "pricing_concerns",
  "service_issues",
  "other",
] as const;

export type CancelSubscriptionReason =
  (typeof cancelSubscriptionReasons)[number];

export const cancelSubscriptionReasonOptions: {
  value: CancelSubscriptionReason;
  label: string;
}[] = [
  { value: "customer_requested", label: "Customer requested cancellation" },
  { value: "no_longer_needed", label: "No Longer Needed" },
  { value: "switching_plan", label: "Switching to A different Plan" },
  { value: "pricing_concerns", label: "Pricing concerns" },
  { value: "service_issues", label: "Service Issues" },
  { value: "other", label: "Other" },
];

export const cancelSubscriptionSchema = z.object({
  reason: z.enum(cancelSubscriptionReasons, {
    required_error: "Select a reason",
  }),
});

export type CancelSubscriptionFormValues = z.infer<
  typeof cancelSubscriptionSchema
>;

export const refundMethods = [
  "original_payment_method",
  "bank_transfer",
  "credit_card",
  "cash",
  "other",
] as const;

export type RefundMethod = (typeof refundMethods)[number];

export const refundMethodOptions: {
  value: RefundMethod;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "original_payment_method",
    title: "Original payment method",
    description: "Refund follows the rails of the linked payment.",
    icon: "solar:restart-linear",
  },
  {
    value: "bank_transfer",
    title: "Bank Transfer",
    description: "Capture IBAN / account number for the wire.",
    icon: "solar:buildings-2-linear",
  },
  {
    value: "credit_card",
    title: "Credit Card",
    description: "Refund to the card on file.",
    icon: "solar:card-linear",
  },
  {
    value: "cash",
    title: "Cash",
    description: "In-person cash refund.",
    icon: "solar:wad-of-money-linear",
  },
  {
    value: "other",
    title: "Other",
    description: "Describe the destination in the account field.",
    icon: "solar:menu-dots-bold",
  },
];

export const issueRefundSchema = z
  .object({
    amount: z.coerce
      .number({ invalid_type_error: "Enter a valid amount" })
      .positive("Enter a valid amount"),
    refundTo: z.enum(refundMethods, {
      required_error: "Select a refund destination",
    }),
    iban: z.string().optional(),
    cardNumber: z.string().optional(),
    destination: z.string().optional(),
    internalNote: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.refundTo === "bank_transfer" && !data.iban?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "IBAN or account number is required",
        path: ["iban"],
      });
    }


    if (data.refundTo === "other" && !data.destination?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Destination is required",
        path: ["destination"],
      });
    }
  });

export type IssueRefundFormValues = z.infer<typeof issueRefundSchema>;
