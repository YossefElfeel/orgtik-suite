import { z } from "zod";

export const zoneFormSchema = z
  .object({
    name: z.string().trim().min(1, "Zone name is required"),
    defaultCurrencyCode: z.string().min(1, "Default currency is required"),
    countryCodes: z.array(z.string()).min(1, "Select at least one country"),
    defaultLanguageCode: z.string().min(1, "Default language is required"),
    languageCodes: z.array(z.string()).min(1, "Select at least one language"),
  })
  .refine((data) => data.languageCodes.includes(data.defaultLanguageCode), {
    message: "Default language must be one of the selected languages",
    path: ["defaultLanguageCode"],
  });

export type ZoneFormValues = z.infer<typeof zoneFormSchema>;
