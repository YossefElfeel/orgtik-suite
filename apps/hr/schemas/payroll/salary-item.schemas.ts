import { z } from "zod";

/**
 * One bonus, deduction or loan line edited in place in the payroll details sheet. Messages come
 * from the caller's catalog, so they're in the reader's language.
 */
export const makeSalaryItemSchema = (messages: { titleRequired: string; amountRequired: string }) =>
  z.object({
    title: z.string().min(1, messages.titleRequired),
    amount: z.string().min(1, messages.amountRequired),
  });

export type SalaryItemFormValues = z.infer<ReturnType<typeof makeSalaryItemSchema>>;
