import type { DepartmentManager } from "@/types/departments";

export function getDepartmentManagerName(
  manager: DepartmentManager | null | undefined,
) {
  if (!manager) return "Unassigned";

  const fullName = [manager.firstName, manager.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return manager.name || fullName || manager.email || `Manager #${manager.id}`;
}
