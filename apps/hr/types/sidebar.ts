export type SidebarNavItem = {
  label?: string;
  labelKey?: string;
  path: string;
  roles?: string[];
  children?: SidebarNavItem[];
};

export type SidebarItem = {
  title?: string;
  titleKey?: string;
  items: SidebarNavItem[];
};
