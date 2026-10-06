import { z } from "zod";

import {
  emptyLocalizedRecord,
  localizedStringSchema,
} from "@/lib/form/localized-fields";

export const categoryFormSchema = z.object({
  departmentId: z.string().min(1, "Department is required"),
  name: localizedStringSchema(undefined, {
    requiredMessage: "Category name is required in at least one language",
  }),
  description: localizedStringSchema(undefined, {
    requiredMessage: "Description is required in at least one language",
  }),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function createCategoryDefaultValues(): CategoryFormValues {
  return {
    departmentId: "",
    name: emptyLocalizedRecord(),
    description: emptyLocalizedRecord(),
  };
}
