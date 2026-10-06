import { z } from "zod";

export const couponFormSchema = z
  .object({
    code: z.string().trim().min(1, "Code is required"),
    categoryId: z.string().min(1, "Category is required"),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.coerce.number().positive("Discount value must be greater than 0"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    isMultipleUse: z.boolean(),
    usageLimit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .nullable(),
    hasPerUserLimit: z.boolean(),
    perUserLimit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.discountType === "percentage" &&
      data.discountValue != null &&
      !Number.isNaN(data.discountValue) &&
      data.discountValue > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage cannot be more than 100",
        path: ["discountValue"],
      });
    }

    if (
      data.isMultipleUse &&
      (data.usageLimit === null || data.usageLimit === undefined || data.usageLimit <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Usage limit must be greater than 0",
        path: ["usageLimit"],
      });
    }

    if (
      data.hasPerUserLimit &&
      (data.perUserLimit == null || data.perUserLimit <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Per user limit must be greater than 0",
        path: ["perUserLimit"],
      });
    }

    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (start > end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date must be before end date",
          path: ["startDate"],
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date",
          path: ["endDate"],
        });
      }
    }
  });

export type CouponFormValues = z.infer<typeof couponFormSchema>;

