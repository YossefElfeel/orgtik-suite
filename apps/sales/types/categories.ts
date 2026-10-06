import type { PaginationOptions } from "@/types";
import type { DepartmentManager } from "@/types/departments";
import type { PlanStatus } from "@/types/plans";
import type { CatalogLocalizedField, LocalizedText } from "@/types/localized";

export type CategoryListItem = {
  id: string;
  name: CatalogLocalizedField;
};

export type GroupedCategoryItem = {
  id: string;
  name: CatalogLocalizedField;
  description: CatalogLocalizedField;
  planCount: number;
};

export type GroupedDepartment = {
  departmentId: string;
  departmentName: CatalogLocalizedField;
  managerName: string;
  categoryCount: number;
  categories: GroupedCategoryItem[];
};

export type DepartmentGroupHeader = {
  departmentId: string;
  departmentName: CatalogLocalizedField;
  managerName: string;
  categoryCount: number;
};

export type Category = GroupedCategoryItem & {
  departmentId: string;
};

export type CategoryDTO = {
  departmentId: string;
  name: LocalizedText;
  description: LocalizedText;
};

export type CategoriesQueryParams = PaginationOptions & {
  departmentId?: string;
  _locale?: string;
};

export type GroupedCategoriesQueryParams = CategoriesQueryParams & {
  q?: string;
};

export type CategoryPrice = number | string | null;

export type CategoryZone = {
  id: string;
  name: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  countryCodes: string[];
  countryNames: string[];
  planCount: number;
  price: string;
  priceSource: "zone_override";
};

export type CategoryPlan = {
  id: string;
  name: CatalogLocalizedField;
  description: CatalogLocalizedField;
  featureCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryFeature = {
  id: string;
  name: string;
  description: string;
  zonePrices?: {
    zoneId: string;
    zoneName: string;
    currencyCode: string;
    basePrice: string;
  }[];
  resolvedPrice?: {
    zoneId: string;
    zoneName: string;
    currencyCode: string;
    price: string;
  }[];
  paymentType: string;
  visibility: string;
  isActive: boolean;
  planCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryDetail = {
  id: string;
  name: CatalogLocalizedField;
  description: CatalogLocalizedField;
  departmentId: string;
  departmentName: CatalogLocalizedField;
  departmentManagerName: string | DepartmentManager | null;
  activePlanCount: number;
  planCount: number;
  featureCount: number;
  zoneCount: number;
  zones: CategoryZone[];
  plans: CategoryPlan[];
  features: CategoryFeature[];
  createdAt: string;
  updatedAt: string;
};

export type PlanDepartmentManager = {
  id: string;
  name: string;
};

export type PlanCategoryItem = {
  id: string;
  name: string;
  description: string;
  plansCount: number;
};

export type PlanDepartment = {
  id: string;
  name: string;
  managerId: string;
  managerName: string;
  categories: PlanCategoryItem[];
};

export type CategoryFeatureTag = "main" | "optional";

export type CategoryDetailZone = {
  id: string;
  name: string;
  currency: string;
  price: number;
  areasLabel: string;
};

export type CategoryDetailFeature = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  tags: CategoryFeatureTag[];
};

export type CategoryPlanSummary = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  status: PlanStatus;
};

export type PlanCategoryDetail = PlanCategoryItem & {
  departmentId: string;
  departmentName: string;
  managerId: string;
  managerName: string;
  activePlansCount: number;
  featuresPoints: number;
  zonesServed: number;
  zonesTotal: number;
  zones: CategoryDetailZone[];
  plans: CategoryPlanSummary[];
  features: CategoryDetailFeature[];
};
