import { z } from "zod";

export const getDepartmentFormSchema = (t: (key: string) => string) =>
  z.object({
    departmentName: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(120, t("validation.nameMax")),
    manager: z.string().min(1, t("validation.managerRequired")),
    employees: z.array(z.string()),
    description: z
      .string()
      .max(2000, t("validation.descriptionMax"))
      .optional(),
  });

export type DepartmentFormValues = {
  departmentName: string;
  manager: string;
  employees: string[];
  description?: string;
};
