import { z } from "zod";

import {
  buildLocalizedPayload,
  emptyLocalizedRecord,
  localizedStringSchema,
  mapLocalizedToForm,
  refineLocalizedNameDescriptionPair,
} from "@/lib/form/localized-fields";
import type { CreatePlanDTO, PlanDto } from "@/types/plans";
import type { ZoneListItem } from "@/types/zones";

export const planZoneOverrideSchema = z.object({
  countryCode: z.string().min(1),
  countryName: z.string().min(1),
  price: z.coerce.number().min(0),
  /** True when the user manually edited this override (do not overwrite via preflight). */
  priceDirty: z.boolean(),
});

export const planZoneSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  price: z.coerce.number().min(0),
  /** True when the user manually edited the base price (send fixed value; else send 0.00). */
  priceDirty: z.boolean(),
  overrides: z.array(planZoneOverrideSchema),
});

export const planFormSchema = z
  .object({
    name: localizedStringSchema(undefined, {
      requiredMessage: "Plan name is required in at least one language",
    }),
    description: localizedStringSchema(undefined, {
      requiredMessage: "Description is required in at least one language",
    }),
    categories: z
      .array(z.string())
      .min(1, "Select at least one category"),
    department: z.string().trim().min(1, "Department is required"),
    isActive: z.boolean(),
    featureIds: z.array(z.string()),
    durations: z.array(z.string()).min(1, "Select at least one duration"),
    allowInstallments: z.boolean(),
    installmentPlans: z.array(z.string()),
    zones: z.array(planZoneSchema),
    paymentType: z.enum(["percentage", "fixed"]),
    commissionRate: z.coerce.number().min(0, "Rate must be at least 0"),
  })
  .superRefine((data, ctx) => {
    refineLocalizedNameDescriptionPair(data, ctx, {
      nameRequiredMessage:
        "Plan name is required when description is provided for this language",
      descriptionRequiredMessage:
        "Description is required when name is provided for this language",
    });

    if (data.paymentType === "percentage" && data.commissionRate > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage rate cannot exceed 100",
        path: ["commissionRate"],
      });
    }

    const enabledZones = data.zones.filter((zone) => zone.enabled);
    if (enabledZones.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enable at least one zone with a base price or country override",
        path: ["zones"],
      });
      return;
    }

    const hasBasePrice = enabledZones.some(
      (zone) => zone.priceDirty && zone.price > 0,
    );
    const hasCountryOverride = enabledZones.some((zone) =>
      zone.overrides.some((override) => override.price > 0),
    );

    if (!hasBasePrice && !hasCountryOverride) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Set a base price on at least one enabled zone, or add a country override with a price",
        path: ["zones"],
      });
    }
  });

export type PlanFormValues = z.infer<typeof planFormSchema>;

export const planStepFields: Record<number, (keyof PlanFormValues | string)[]> = {
  0: ["name", "description", "categories", "department", "isActive"],
  1: ["featureIds", "durations", "allowInstallments", "installmentPlans"],
  2: ["zones"],
  3: ["paymentType", "commissionRate"],
};

export function createPlanDefaultValues(
  availableZones: ZoneListItem[] = [],
  defaultPlanDurationIds: string[] = [],
): PlanFormValues {
  return {
    name: emptyLocalizedRecord(),
    description: emptyLocalizedRecord(),
    categories: [],
    department: "",
    isActive: false,
    featureIds: [],
    durations: defaultPlanDurationIds,
    allowInstallments: false,
    installmentPlans: [],
    zones: availableZones.map((zone) => ({
      id: zone.id,
      enabled: false,
      price: 0,
      priceDirty: false,
      overrides: [],
    })),
    paymentType: "percentage",
    commissionRate: 0,
  };
}

export function toCreatePlanDTO(values: PlanFormValues): CreatePlanDTO {
  return {
    name: buildLocalizedPayload(values.name),
    description: buildLocalizedPayload(values.description),
    departmentId: values.department,
    categoryIds: values.categories,
    isActive: values.isActive,
    featureIds: values.featureIds,
    planDurationIds: values.durations,
    installmentsEnabled: values.allowInstallments,
    installmentDurationIds: values.allowInstallments
      ? values.installmentPlans
      : [],
    zonePrices: values.zones
      .filter((zone) => zone.enabled)
      .map((zone) => ({
        zoneId: zone.id,
        // Untouched suggested prices stay derived (0); dirty values are whole numbers.
        basePrice: zone.priceDirty
          ? String(Math.round(zone.price))
          : "0",
        countryOverrides: zone.overrides
          .filter((override) => override.price !== zone.price)
          .map((override) => ({
            countryCode: override.countryCode,
            price: String(Math.round(override.price)),
          })),
      })),
    commission: {
      type: values.paymentType,
      amount: values.commissionRate.toFixed(2),
    },
  };
}

function parseNumericValue(value: string | null | undefined) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolvePlanCategoryIds(plan: PlanDto): string[] {
  if (plan.categories?.length) {
    return plan.categories.map((category) => category.id);
  }

  return plan.category?.id ? [plan.category.id] : [];
}

export function toPlanFormValues(
  plan: PlanDto,
  availableZones: ZoneListItem[],
  defaultPlanDurationIds: string[],
): PlanFormValues {
  const zoneDetailsById = new Map(
    plan.zoneDetails.map((zoneDetail) => [zoneDetail.id, zoneDetail]),
  );

  return {
    name: mapLocalizedToForm(plan.name),
    description: mapLocalizedToForm(plan.description),
    categories: resolvePlanCategoryIds(plan),
    department: plan.department.id,
    isActive: plan.isActive,
    featureIds: plan.allFeatures.map((feature) => feature.id),
    durations:
      plan.planDurations.length > 0
        ? plan.planDurations.map((duration) => duration.durationId)
        : defaultPlanDurationIds,
    allowInstallments: plan.installmentsEnabled,
    installmentPlans: plan.installmentDurations.map(
      (duration) => duration.durationId,
    ),
    zones: availableZones.map((zone) => {
      const existingZone = zoneDetailsById.get(zone.id);
      const isFixedOverride = existingZone?.priceSource === "zone_override";

      return {
        id: zone.id,
        enabled: Boolean(existingZone),
        price: parseNumericValue(existingZone?.basePrice),
        priceDirty: isFixedOverride,
        overrides: (existingZone?.countries ?? [])
          .filter((country) => country.overridePrice != null)
          .map((country) => ({
            countryCode: country.countryCode,
            countryName: country.countryName,
            price: parseNumericValue(country.overridePrice),
            priceDirty: true,
          })),
      };
    }),
    paymentType: plan.commission?.type ?? "percentage",
    commissionRate: parseNumericValue(plan.commission?.amount),
  };
}
