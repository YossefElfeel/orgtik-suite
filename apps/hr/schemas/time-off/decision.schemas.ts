import { z } from "zod";

/**
 * A manager's or HR's decision on a time off request (FS-HR-8, HR-007). There is no "pending":
 * the form starts with nothing chosen and can't be sent until Approve or Reject is. Messages come
 * from the caller's catalog, so they're in the reader's language.
 */
export const makeDecisionSchema = (messages: { choose: string; tooLong: string }) =>
  z.object({
    decision: z.enum(["approved", "rejected"], { message: messages.choose }),
    note: z.string().max(500, messages.tooLong).optional(),
  });

export type DecisionFormValues = z.infer<ReturnType<typeof makeDecisionSchema>>;
