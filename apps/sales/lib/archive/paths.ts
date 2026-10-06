import type { ArchiveResourceType } from "@/types/archive";

export const ARCHIVE_LIST_PATHS = {
  durations: "/durations/archived",
  features: "/features/archived",
  categories: "/categories/archived",
  plans: "/plans/archived",
  packages: "/packages/archived",
} as const satisfies Record<ArchiveResourceType, string>;
