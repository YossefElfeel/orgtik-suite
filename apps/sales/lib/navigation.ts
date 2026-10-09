import type { NavItemConfig } from "@/types/navigation";

export const NAV_ITEMS: NavItemConfig[] = [
  { path: "/service-catalog", label: "serviceCatalog", icon: "", roles: ["admin", "manager", "salesman", "customer"] },
  { path: "/service-requests", label: "serviceRequests", icon: "", roles: ["admin", "manager", "salesman", "customer"] },
  { path: "/admin", label: "toolAdmin", icon: "", roles: ["admin", "manager", "salesman", "customer"] },
  {
    path: "/",
    label: "dashboard",
    icon: "solar:home-2-linear",
    roles: ["admin", "manager", "salesman", "customer"],
  },
  {
    path: "/projects",
    label: "projects",
    icon: "solar:folder-linear",
    roles: ["admin", "manager", "salesman", "customer"],
    labelsByRole: { salesman: "deals" },
  },
  {
    path: "/plan-management",
    frozen: true,
    label: "planManagement",
    icon: "solar:chart-2-linear",
    roles: ["admin", "manager", "customer", "salesman"],
    labelsByRole: { customer: "plans" },
  },
  {
    path: "/packages",
    frozen: true,
    label: "packages",
    icon: "solar:box-linear",
    roles: ["admin", "manager", "salesman"],
    labelsByRole: { salesman: "bundles" },
  },
  {
    path: "/archive",
    label: "archive",
    icon: "solar:archive-linear",
    roles: ["admin", "manager"],
  },
  {
    path: "/salesman",
    label: "salesman",
    icon: "solar:users-group-rounded-linear",
    roles: ["admin", "manager"],
  },
  {
    path: "/customers",
    label: "customers",
    icon: "solar:user-linear",
    roles: ["admin", "manager", "salesman"],
  },
  {
    // The D-028 leads pipeline (wave 6): the same customers and leads on a board by stage.
    path: "/customers/pipeline",
    label: "leadsPipeline",
    icon: "solar:widget-linear",
    roles: ["admin", "manager", "salesman"],
  },
  {
    path: "/subscriptions",
    frozen: true,
    label: "subscriptions",
    icon: "solar:refresh-circle-linear",
    roles: ["admin", "manager", "customer"],
  },
  {
    path: "/user-management",
    label: "userManagement",
    icon: "solar:user-plus-linear",
    // Managers read it (role matrix); changes happen in SOS.
    roles: ["admin", "manager"],
  },
  {
    path: "/coupons",
    frozen: true,
    label: "coupons",
    icon: "solar:sale-linear",
    roles: ["admin", "manager", "salesman"],
  },
  {
    path: "/loyalty",
    label: "loyalty",
    icon: "solar:cup-star-linear",
    roles: ["admin", "manager", "customer"],
    labelsByRole: { customer: "rewards" },
  },
  {
    path: "/invoices",
    frozen: true,
    label: "invoices",
    icon: "solar:bill-list-linear",
    roles: ["admin", "manager", "customer"],
  },
  {
    path: "/offers",
    label: "offers",
    icon: "solar:document-text-linear",
    // Salespeople create and send offers for their own customers (user decision, 2026-10-03).
    roles: ["admin", "manager", "salesman", "customer"],
  },
  {
    path: "/tickets",
    frozen: true,
    label: "tickets",
    icon: "solar:ticket-linear",
    roles: ["admin", "manager", "customer"],
  },
  {
    path: "/activity-feed",
    label: "activityFeed",
    icon: "solar:graph-up-linear",
    roles: ["admin", "manager"],
  },
  {
    path: "/commissions",
    label: "commissions",
    icon: "solar:wallet-money-linear",
    roles: ["admin", "manager", "salesman"],
  },
];
