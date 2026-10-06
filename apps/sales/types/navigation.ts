import type { AppRole } from "@/types/role";

export type SidebarNavItem = {
  label: string;
  icon: string;
  path: string;
};

export type SidebarItem = {
  title: string;
  items: SidebarNavItem[];
};

export type NavItemConfig = {
  /** Canonical path used for routing and access checks */
  path: string;
  /** Default sidebar label */
  label: string;
  icon: string;
  /** Roles allowed to see this item and access this route */
  roles: AppRole[];
  /**
   * A SaaS-admin module that moves to the Admin app (D-011). Frozen in this wave (user decision,
   * 2026-10-03): listed in its own sidebar group and not migrated.
   */
  frozen?: boolean;
  /** Optional label override per role (Figma aliases) */
  labelsByRole?: Partial<Record<AppRole, string>>;
};

export type RouteAccessConfig = {
  path: string;
  roles: AppRole[];
  /** If true, also matches pathname.startsWith(`${path}/`) */
  matchPrefix?: boolean;
};
