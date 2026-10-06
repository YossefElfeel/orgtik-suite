import type { PaginationOptions } from "@/types";
import type { CatalogLocalizedField, LocalizedText } from "@/types/localized";

export type DepartmentManager = {
  id: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type DepartmentCatalogManager = {
  id: number;
  displayName: string;
  avatar: string | null;
  isActive: boolean;
  isAvailable: boolean;
};

export type DepartmentCategory = {
  id: string;
  name: CatalogLocalizedField;
  description: string;
  department: {
    id: string;
    name: CatalogLocalizedField;
  };
  planCount: number;
  featureCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Department = {
  id: string;
  name: CatalogLocalizedField;
  manager: DepartmentManager | null;
  categoryCount: number;
  categories: DepartmentCategory[];
  createdAt: string;
  updatedAt: string;
};

export type DepartmentListItem = {
  id: string;
  name: CatalogLocalizedField;
};

export type DepartmentDTO = {
  name: LocalizedText;
  managerId?: number;
};

export type DepartmentsQueryParams = PaginationOptions;
