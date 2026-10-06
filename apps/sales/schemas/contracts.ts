import { z } from "zod";

type T = (key: string) => string;

/**
 * Approving sets the salesperson's commission: a fixed amount in the contract currency or a
 * percent of the contract's net. Nothing is pre-filled: the old dialog started at 10% (SAL-065).
 */
export function buildApproveSchema(t: T) {
  return z
    .object({
      mode: z.enum(["percentage", "fixed"], { required_error: t("errors.commissionMode"), invalid_type_error: t("errors.commissionMode") }),
      value: z.number({ required_error: t("errors.commissionValue"), invalid_type_error: t("errors.commissionValue") }).min(0, t("errors.commissionValue")),
    })
    .superRefine((v, ctx) => {
      if (v.mode === "percentage" && v.value > 100) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: t("errors.percentRange") });
    });
}

export type ApproveFormValues = z.infer<ReturnType<typeof buildApproveSchema>>;
