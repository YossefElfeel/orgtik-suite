import { z } from "zod";
import type { Translate } from "@/schemas/salesman";

/** The programme settings (admins). Rates are "how many of this currency make one base unit". */
export const loyaltyProgramSchema = (t: Translate) =>
  z.object({
    isActive: z.boolean(),
    pointsPerUnit: z.number({ invalid_type_error: t("numberRequired"), required_error: t("numberRequired") }).positive(t("pointsPerUnitPositive")),
    baseCurrency: z.string().length(3, t("currencyRequired")),
    // The server needs at least one month (SAL-168).
    pointsExpireAfterMonths: z
      .number({ invalid_type_error: t("numberRequired"), required_error: t("numberRequired") })
      .int(t("wholeNumber"))
      .min(1, t("expiryMin")),
    rates: z.array(
      z.object({
        currencyCode: z.string().length(3),
        rate: z.number({ invalid_type_error: t("rateRequired"), required_error: t("rateRequired") }).positive(t("rateRequired")),
      }),
    ),
  });

export type LoyaltyProgramFormValues = z.infer<ReturnType<typeof loyaltyProgramSchema>>;

export const loyaltyRewardSchema = (t: Translate) =>
  z
    .object({
      name: z.string().trim().min(1, t("nameRequired")).max(120, t("tooLong")),
      pointCost: z.number({ invalid_type_error: t("numberRequired"), required_error: t("numberRequired") }).int(t("wholeNumber")).positive(t("pointsPositive")),
      validForDays: z.number({ invalid_type_error: t("numberRequired"), required_error: t("numberRequired") }).int(t("wholeNumber")).min(1, t("daysMin")),
      discountType: z.enum(["percentage", "fixed"]),
      discountValue: z.number({ invalid_type_error: t("numberRequired"), required_error: t("numberRequired") }).positive(t("discountPositive")),
      categoryId: z.string(),
      couponCodePrefix: z
        .string()
        .trim()
        .refine((v) => !v || /^[A-Za-z0-9]{2,12}$/.test(v), t("prefixInvalid")),
      isActive: z.boolean(),
    })
    .superRefine((v, ctx) => {
      if (v.discountType === "percentage" && v.discountValue > 100) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["discountValue"], message: t("percentMax") });
    });

export type LoyaltyRewardFormValues = z.infer<ReturnType<typeof loyaltyRewardSchema>>;

/** Adding or deducting points by hand (admins). Whole points; a deduction can't pass the balance (SAL-168). */
export const adjustLoyaltyPointsSchema = (t: Translate, balance: number, balanceLabel: string) =>
  z
    .object({
      direction: z.enum(["add", "deduct"]),
      points: z.number({ invalid_type_error: t("numberRequired"), required_error: t("numberRequired") }).int(t("wholeNumber")).positive(t("pointsPositive")),
      reason: z.string().trim().min(1, t("reasonRequired")).max(500, t("tooLong")),
    })
    .superRefine((v, ctx) => {
      if (v.direction === "deduct" && v.points > balance) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["points"], message: t("deductTooMany", { balance: balanceLabel }) });
    });

export type AdjustLoyaltyPointsFormValues = z.infer<ReturnType<typeof adjustLoyaltyPointsSchema>>;
