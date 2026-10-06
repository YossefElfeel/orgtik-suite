"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useUserRoles } from "@/hooks/useUserRoles";
import { UserRole } from "@/types/user";
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  ImageIcon,
  Wrench,
  Layers,
  Newspaper,
  Globe,
  TrendingUp,
  UserCog,
  UserCircle,
  MapPin,
  Star,
} from "lucide-react";
import {
  useGetAllPagesQuery,
  useGetSharedSectionsQuery,
} from "@/redux/features/seo/seoApi";

export type SidebarChild = {
  label: string;
  href?: string;
  children?: SidebarChild[];
  roles?: UserRole[];
};

export type SidebarItem = {
  label: string;
  Icon: React.ElementType;
  path?: string;
  children?: SidebarChild[];
  roles?: UserRole[];
};
function normalizePathname(pathname: string) {
  const parts = pathname.split("/");
  if (["en", "ar", "de", "fr"].includes(parts[1])) {
    return "/" + parts.slice(2).join("/");
  }
  return pathname;
}
export const useSidebarItems = () => {
  const pathname = usePathname();
  const normalizedPath = normalizePathname(pathname);
  const { roles: userRoles } = useUserRoles();

  const { data: pages } = useGetAllPagesQuery();
  const { data: sharedSections } = useGetSharedSectionsQuery();

  const contentItems: SidebarChild[] =
    pages?.data
      .filter((page) => page.sections && page.sections.length > 0)
      .map((page) => ({
        label: page.type,
        children: page.sections.map((section) => ({
          label: section.name,
          href: `/content/${section.id}`,
        })),
      }))
      .concat({
        label: "shared",
        children:
          sharedSections?.data.map((section) => ({
            label: section.sectionTypeName,
            href: `/content/${section.id}`,
          })) || [],
      }) || [];

  const seoItems: SidebarChild[] =
    pages?.data.map((page) => ({
      label: page.type,
      href: `/seo?name=${page.type}&id=${page.id}`,
    })) || [];

  // === Sidebar structure remains unchanged ===
  const sidebarItems: SidebarItem[] = [
    { label: "Dashboard", Icon: LayoutDashboard, path: "/" },
    { label: "Contacts", Icon: Users, path: "/contacts" },
    // { label: "Jobs", Icon: BriefcaseBusiness, path: "/jobs" },
    { label: "Gallery", Icon: ImageIcon, path: "/gallery" },
    { label: "Services", Icon: Wrench, path: "/services" },
    { label: "Projects", Icon: Layers, path: "/projects" },
    { label: "Blogs", Icon: Newspaper, path: "/blogs" },
    { label: "Reviews", Icon: Star, path: "/reviews" },
    // Site Structure
    {
      label: "Sitemap",
      Icon: MapPin,
      children: [
        {
          label: "Categories",
          href: "/sitemap/categories",
        },
        {
          label: "Blogs",
          href: "/sitemap/blogs",
        },
      ],
    },
    { label: "Web Content", Icon: Globe, children: contentItems },
    { label: "SEO", Icon: TrendingUp, children: seoItems },
    // { label: "Blogs", Icon: PenSquare, path: "/blogs" },
    // { label: "Gallery", Icon: Image, path: "/gallery" },
    // { label: "Contacts Managements", Icon: UserCog, path: "/contacts-management" },
    // { label: "Profile Setting", Icon: UserCircle, path: "/profile" },
  ];

  const canAccess = (roles?: UserRole[]) => {
    if (!roles?.length) return true;
    return roles.some((role) => userRoles.includes(role));
  };

  const filterChildren = (children: SidebarChild[]): SidebarChild[] =>
    children
      .filter((child) => canAccess(child.roles))
      .map((child) =>
        child.children
          ? { ...child, children: filterChildren(child.children) }
          : child
      )
      .filter(
        (child) => child.href || (child.children && child.children.length > 0)
      );

  const sidebarItemsWithAccess = useMemo(
    () =>
      sidebarItems
        .filter((item) => canAccess(item.roles))
        .map((item) =>
          item.children
            ? { ...item, children: filterChildren(item.children) }
            : item
        )
        .filter(
          (item) => item.path || (item.children && item.children.length > 0)
        ),
    [sidebarItems, userRoles]
  );

  /**  Check if the given path exactly matches the current route */
  const isActive = ({ path }: { path: string }) => normalizedPath === path;

  /**  Check if the current route starts with the given path (for nested items) */
  const isActiveStartsWith = ({ path }: { path: string }) =>
    normalizedPath.startsWith(path);

  return { sidebarItems: sidebarItemsWithAccess, isActive, isActiveStartsWith };
};
