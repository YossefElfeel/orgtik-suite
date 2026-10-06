import { z } from "zod";

// The messages come from the caller's catalog (configuration.validation.*), so the schema has no copy.
export const makeConfigurationSchema = (m: {
  companyNameRequired: string;
  preferredLanguageRequired: string;
  phoneRequired: string;
  emailInvalid: string;
  locationRequired: string;
  effectiveDateRequired: string;
  workingDaysMin: string;
  startTimeRequired: string;
  endTimeRequired: string;
  gracePeriodMin: string;
  holidayNameRequired: string;
  dateRequired: string;
}) =>
  z.object({
    companyProfile: z.object({
      avatar: z.string().nullable().optional(),
      companyName: z.string().min(1, m.companyNameRequired),
      preferredLanguage: z.string().min(1, m.preferredLanguageRequired),
      phoneNumber: z.string().min(1, m.phoneRequired),
      emailAddress: z.string().email(m.emailInvalid),
      location: z.string().min(1, m.locationRequired),
    }),
    attendance: z.object({
      schedule: z.object({
        // TODO: change from d/m/y to ISO format and use z.coerce.date
        effectiveFrom: z.string().min(1, m.effectiveDateRequired),
        workingDays: z.array(z.number()).min(1, m.workingDaysMin),
        dayStartTime: z.string().min(1, m.startTimeRequired),
        dayEndTime: z.string().min(1, m.endTimeRequired),
        gracePeriodMinutes: z.number().min(0, m.gracePeriodMin),
      }),
      publicHolidays: z.array(
        z.object({
          name: z.string().min(1, m.holidayNameRequired),
          date: z.string().min(1, m.dateRequired),
        }),
      ),
    }),
  });

export type ConfigurationFormValues = z.infer<ReturnType<typeof makeConfigurationSchema>>;
