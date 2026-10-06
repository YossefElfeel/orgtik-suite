import { z } from "zod";

/**
 * A bonus or deduction added to a payroll run. Messages come from the caller's catalog, so
 * they're in the reader's language.
 */
export const makeAdjustmentSchema = (messages: {
  employeeRequired: string;
  valuePositive: string;
  tooLong: string;
}) =>
  z.object({
    employeeId: z.string().min(1, messages.employeeRequired),

    inputMode: z.enum(["fixed", "days", "percent", "months"]),

    description: z.string().optional(),

    amount: z.preprocess(
      (val) => (val === undefined || val === "" ? 0 : Number(val)),
      z.number().min(0, messages.valuePositive),
    ),

    dayUnits: z.preprocess(
      (val) => (val === undefined || val === "" ? 0 : Number(val)),
      z.number().min(0, messages.valuePositive),
    ),

    notes: z.preprocess(
      (val) => (val === undefined ? "" : val),
      z.string().max(2000, messages.tooLong),
    ),
  });

export type AdjustmentFormValues = {
  employeeId: string;
  inputMode: "fixed" | "days" | "percent" | "months";
  description?: string;
  amount: number;
  dayUnits: number;
  notes: string;
};
