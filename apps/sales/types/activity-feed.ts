import { IPagination } from "@/types";

/** The feed's tabs, in the order they show. */
export const ACTIVITY_CATEGORIES = [
  "all",
  "projects",
  "offers",
  "customers",
  "commissions",
  "salesman",
  "invoices",
  "subscriptions",
  "tickets",
] as const;

export type ActivityFeedCategory = (typeof ACTIVITY_CATEGORIES)[number];

export interface ActivityFeedTarget {
  resource: string;
  id: string;
}

export interface ActivityFeedItem {
  id: string;
  category: Exclude<ActivityFeedCategory, "all">;
  type: string;
  priority: string;
  icon: string;
  tone: string;
  title: string;
  message: string;
  contextLabel: string;
  isRead: boolean;
  occurredAt: string;
  target: ActivityFeedTarget;
}

export interface ActivityFeedTab {
  category: ActivityFeedCategory;
  label: string;
  count: number;
}

export interface ActivityFeedGroup {
  date: string;
  count: number;
  items: ActivityFeedItem[];
}

export interface ActivityFeedResponse {
  category: ActivityFeedCategory;
  includeRead: boolean;
  tabs: ActivityFeedTab[];
  groups: ActivityFeedGroup[];
  meta: IPagination;
}

export interface ActivityFeedQueryParams {
  category?: ActivityFeedCategory;
  includeRead?: boolean;
  page?: number;
  limit?: number;
}
