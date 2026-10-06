import { z } from "zod";

export const durationFormSchema = z.object({
  months: z.coerce
    .number()
    .int("Months must be a whole number")
    .min(1, "Months must be at least 1"),
  percentage: z.coerce
    .number()
    .min(0, "Percentage cannot be negative")
    .max(100, "Percentage cannot exceed 100"),
});

export type DurationFormValues = z.infer<typeof durationFormSchema>;
