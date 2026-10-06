import { z } from "zod";

/**
 * Requesting time off for someone (Attendance and Calendar headers). Messages come from the
 * caller's catalog, so they're in the reader's language.
 */
export const makeAddTimeOffSchema = (messages: {
  typeRequired: string;
  startDateRequired: string;
  endDateRequired: string;
  customHoursRequired: string;
}) =>
  z
    .object({
      employeeId: z.string().optional(),
      timeOffType: z.string().min(1, messages.typeRequired),
      durationType: z.enum(["full_day", "half_day", "custom_hours"]),
      startDate: z.string().min(1, messages.startDateRequired),
      endDate: z.string().min(1, messages.endDateRequired),
      halfDayPeriod: z.string().optional(),
      partialStartTime: z.string().optional(),
      partialEndTime: z.string().optional(),
      employeeNote: z.string().optional(),
      files: z
        .preprocess((val) => (Array.isArray(val) ? val : []), z.array(z.any()))
        .optional()
        .default([]),
    })
    .refine(
      (data) => {
        if (data.durationType === "custom_hours") {
          return !!data.partialStartTime && !!data.partialEndTime;
        }
        return true;
      },
      {
        message: messages.customHoursRequired,
        path: ["partialStartTime"],
      },
    );

/** What the form holds while it's being filled in. */
export type AddTimeOffFormInput = z.input<ReturnType<typeof makeAddTimeOffSchema>>;
/** What the form hands over once it's valid. */
export type AddTimeOffFormValues = z.output<ReturnType<typeof makeAddTimeOffSchema>>;
