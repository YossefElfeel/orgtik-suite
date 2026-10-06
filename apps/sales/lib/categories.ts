import { getDepartmentManagerName } from "@/lib/departments";
import type {
  DepartmentGroupHeader,
  GroupedDepartment,
} from "@/types/categories";
import type { Department, DepartmentManager } from "@/types/departments";
import type { CategoryZone } from "@/types/categories";
import type { FeatureVisibility } from "@/types/features";
import type { PlanDetailFeatureTag } from "@/types/plans";

export function mapDepartmentToGroupHeader(
  department: Department,
): DepartmentGroupHeader {
  return {
    departmentId: department.id,
    departmentName: department.name,
    managerName: getDepartmentManagerName(department.manager),
    categoryCount: department.categoryCount,
  };
}

export function mapGroupedDepartmentToHeader(
  department: GroupedDepartment,
): DepartmentGroupHeader {
  return {
    departmentId: department.departmentId,
    departmentName: department.departmentName,
    managerName: department.managerName || "Unassigned",
    categoryCount: department.categoryCount,
  };
}

export function formatCategoryPlansLabel(planCount: number) {
  return `${planCount} Plan${planCount === 1 ? "" : "s"}`;
}

export function formatDepartmentCategoriesLabel(categoryCount: number) {
  return `${categoryCount} Categor${categoryCount === 1 ? "y" : "ies"}`;
}

export function getCategoryManagerName(value: unknown) {
  if (value == null || value === "") return "Unassigned";

  if (typeof value === "string") {
    return value.trim() || "Unassigned";
  }

  if (typeof value !== "object") return "Unassigned";

  const manager = value as DepartmentManager;
  if (
    manager.name ||
    manager.firstName ||
    manager.lastName ||
    manager.email ||
    manager.id != null
  ) {
    return getDepartmentManagerName(manager);
  }

  return "Unassigned";
}

export function formatCategoryPrice(
  value: number | string | null | undefined,
  currency?: string | null,
) {
  if (value == null || value === "" || typeof value === "object") return "—";

  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) return "—";

  const code = currency?.trim();
  if (!code || code === "USD" || code === "$") {
    return `$ ${amount.toFixed(2)}`;
  }

  return `${code} ${amount.toFixed(2)}`;
}

export function formatCategoryZoneAreas(zone: CategoryZone) {
  if (zone.countryNames?.length) return zone.countryNames.join(", ");
  if (zone.countryCodes?.length) return zone.countryCodes.join(", ");
  return "—";
}

export function isFeatureVisibility(value: string): value is FeatureVisibility {
  return value === "public" || value === "private";
}

export function getCategoryFeaturePaymentTag(
  paymentType: string,
): PlanDetailFeatureTag | null {
  if (
    paymentType === "cash_only" ||
    paymentType === "installment" ||
    paymentType === "full_payment"
  ) {
    return paymentType;
  }

  return null;
}
