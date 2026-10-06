import { z } from "zod";

/**
 * Editing an employee loan (Loans → loan details). Messages come from the caller's catalog, so
 * they're in the reader's language.
 */
export const makeLoanSchema = (messages: { titleRequired: string }) =>
  z.object({
    title: z.string().min(1, messages.titleRequired),
    installmentAmount: z.coerce.number().min(1),
    remainingAmount: z.coerce.number().min(0),
    reason: z.string().optional(),
    status: z.enum(["active", "paused", "closed", "cancelled"]),
  });

export type LoanFormValues = z.infer<ReturnType<typeof makeLoanSchema>>;
