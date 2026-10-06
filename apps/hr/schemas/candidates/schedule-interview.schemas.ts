import { z } from "zod";

/** `YYYY-MM-DD` in local time, the format the date field and the API payload use. */
export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Scheduling an interview with a candidate. Messages come from the caller's catalog
 * (candidateDetails.scheduleInterviewDialog.validation), so they're in the reader's language.
 */
export const makeScheduleInterviewSchema = (messages: {
  dateRequired: string;
  startTimeRequired: string;
  endTimeRequired: string;
  interviewWithRequired: string;
  meetingLinkInvalid: string;
  noteRequired: string;
  endAfterStart: string;
  noPastDate: string;
}) =>
  z
    .object({
      date: z
        .union([z.string(), z.date()])
        .transform((value) =>
          value instanceof Date ? toDateInputValue(value) : value,
        )
        .pipe(z.string().min(1, messages.dateRequired)),
      startTime: z.string().min(1, messages.startTimeRequired),
      endTime: z.string().min(1, messages.endTimeRequired),
      interviewWith: z.string().trim().min(1, messages.interviewWithRequired),
      meetingLink: z
        .string()
        .trim()
        .url(messages.meetingLinkInvalid)
        .or(z.literal(""))
        .optional(),
      note: z.string().trim().min(1, messages.noteRequired),
    })
    .superRefine((values, context) => {
      if (values.endTime <= values.startTime) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.endAfterStart,
          path: ["endTime"],
        });
      }

      const now = new Date();
      const startDateTime = new Date(`${values.date}T${values.startTime}:00`);

      if (startDateTime < now) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.noPastDate,
          path: ["startTime"],
        });
      }
    });

export type ScheduleInterviewFormInputValues = z.input<
  ReturnType<typeof makeScheduleInterviewSchema>
>;
export type ScheduleInterviewFormValues = z.output<
  ReturnType<typeof makeScheduleInterviewSchema>
>;
