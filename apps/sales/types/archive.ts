import type { IPaginated, PaginationOptions } from "@/types";
import type { GroupedCategoryItem } from "@/types/categories";
import type { Duration, DurationKind } from "@/types/durations";
import type { FeatureListItem } from "@/types/features";
import type { PackageItem } from "@/types/packages";
import type { PlanListItem } from "@/types/plans";
import type { CatalogLocalizedField } from "@/types/localized";

/** The archive's tabs, in the order they show. */
export const ARCHIVE_RESOURCES = ["plans", "features", "categories", "durations", "packages"] as const;

export type ArchiveResourceType = (typeof ARCHIVE_RESOURCES)[number];

export type WithArchivedAt<T> = T & {
  archivedAt: string;
};

export type ArchivedDuration = WithArchivedAt<Duration>;

export type ArchivedFeature = WithArchivedAt<FeatureListItem>;

export type ArchivedCategory = WithArchivedAt<
  GroupedCategoryItem & {
    departmentName: CatalogLocalizedField;
  }
>;

export type ArchivedPlan = WithArchivedAt<PlanListItem>;

export type ArchivedPackage = WithArchivedAt<PackageItem>;

export type ArchiveQueryParams = PaginationOptions & {
  type?: DurationKind;
  _locale?: string;
};

export type ArchivedDurationsPageData = IPaginated<ArchivedDuration> & {
  totals?: {
    plan: number;
    installment: number;
  };
};
