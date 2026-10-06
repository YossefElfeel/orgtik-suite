import { z } from "zod";

import {
  emptyLocalizedRecord,
  localizedStringSchema,
} from "@/lib/form/localized-fields";
import type { SupportedLanguage } from "@/types/localized";

export const departmentFormSchema = z.object({
  name: localizedStringSchema(undefined, {
    requiredMessage: "Department name is required in at least one language",
  }),
  managerId: z.string().optional(),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export function createDepartmentDefaultValues(): DepartmentFormValues {
  return {
    name: emptyLocalizedRecord(),
    managerId: "",
  };
}

export type LocalizedDepartmentFormName = Record<SupportedLanguage, string>;
