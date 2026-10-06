import { z } from "zod";

import {
  emptyLocalizedRecord,
  localizedStringSchema,
} from "@/lib/form/localized-fields";

export const packageFormSchema = z.object({
  name: localizedStringSchema(undefined, {
    requiredMessage: "Package name is required in at least one language",
  }),
  description: localizedStringSchema(undefined, {
    requiredMessage: "Description is required in at least one language",
  }),
  planIds: z.array(z.string()).min(1, "Select at least one plan"),
  zones: z.array(
    z.object({
      zoneId: z.string(),
      isActive: z.boolean(),
      price: z.number().min(0, "Price must be 0 or greater").nullable(),
      countryOverrides: z
        .array(
          z.object({
            countryCode: z.string(),
            price: z.number(),
          }),
        )
        .optional(),
    }),
  ),
});

export type PackageFormValues = z.infer<typeof packageFormSchema>;

export function createPackageDefaultValues(): PackageFormValues {
  return {
    name: emptyLocalizedRecord(),
    description: emptyLocalizedRecord(),
    planIds: [],
    zones: [],
  };
}
