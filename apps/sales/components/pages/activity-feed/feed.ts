"use client";

// What a notification or an activity item says, where it leads and when it happened, in the
// reader's language. The bell (top bar), the activity feed and the socket's toast share it.
// - The API's titles and messages are English whatever the reader's language (SAL-141), so the
//   title comes from the event's type; the English message is shown to English readers only.
// - Relative times used date-fns without a locale ("3 hours ago" in every language, SAL-050).
// - A row now opens what it's about, when the reader's role can open that page (SAL-038).
// Candidates to promote to the library afterwards (wave plan): the relative-time formatter.
import { createElement, useCallback, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Bell,
  Briefcase,
  FileText,
  IdentificationBadge,
  Receipt,
  Repeat,
  Ticket,
  UsersThree,
  Wallet,
} from "@phosphor-icons/react";
import { formatLocale, useOrgtik, type Tone } from "@orgtik/ui";
import { useSalesStatusLabel } from "@/components/shared/SalesStatus";
import { canAccessRoute } from "@/lib/role-access";
import type { AppRole } from "@/types/role";
import type { ActivityFeedCategory } from "@/types/activity-feed";

/** Dates read in the organisation's time zone (AGENTS.md: Words and formats). */
export const ORG_TIME_ZONE = process.env.NEXT_PUBLIC_ORG_TIME_ZONE || "Africa/Cairo";

export type FeedCategory = Exclude<ActivityFeedCategory, "all">;

/** The notification types the API sends. Each has a title in the catalogs (SalesNotify.types). */
export const KNOWN_TYPES = [
  "contract.approved",
  "contract.awaiting_confirmation",
  "contract.confirmed",
  "contract.created",
  "contract.rejected",
  "coupon.shared",
  "custom_invoice.created",
  "custom_invoice.paid",
  "customer.document_uploaded",
  "customer.meeting_scheduled",
  "customer.registered",
  "invoice.created",
  "invoice.due_soon",
  "invoice.overdue",
  "invoice.paid",
  "lead.created",
  "loyalty.points_adjusted",
  "offer.accepted",
  "offer.countered",
  "offer.created",
  "offer.rejected",
  "payment.received",
  "project.created",
  "project.priority_changed",
  "project.status_changed",
  "salesman.created",
  "salesman.note_added",
  "subscription.cancelled",
  "subscription.paused",
  "subscription.refunded",
  "subscription.renewed",
  "subscription.resumed",
  "ticket.assigned",
  "ticket.created",
  "ticket.note_added",
  "ticket.status_changed",
  "wallet.commission_added",
  "wallet.commission_paid",
] as const;

const typeKey = (type: string) => type.replace(/\./g, "_");

/** The module an event belongs to (the same grouping as the API's activity tabs). */
export function categoryOf(type: string): FeedCategory {
  const p = String(type).split(".")[0];
  if (p === "project" || p === "contract") return "projects";
  if (p === "invoice" || p === "custom_invoice" || p === "payment") return "invoices";
  if (p === "wallet") return "commissions";
  if (p === "customer" || p === "coupon" || p === "loyalty" || p === "lead") return "customers";
  if (p === "subscription") return "subscriptions";
  if (p === "ticket") return "tickets";
  if (p === "offer") return "offers";
  if (p === "salesman") return "salesman";
  return "projects";
}

const ICONS: Record<FeedCategory, typeof Bell> = {
  projects: Briefcase,
  invoices: Receipt,
  commissions: Wallet,
  customers: UsersThree,
  subscriptions: Repeat,
  tickets: Ticket,
  offers: FileText,
  salesman: IdentificationBadge,
};

export function categoryIcon(category: string): ReactNode {
  const Icon = ICONS[category as FeedCategory] ?? Bell;
  return createElement(Icon, { "aria-hidden": true });
}

/** The tone of an event, from its type and priority (as the API's feed does). */
export function toneOf(type: string, priority?: string): Tone {
  if (/(paid|approved|accepted|received|confirmed|resumed|renewed)$/.test(type)) return "success";
  if (priority === "critical") return "danger";
  if (priority === "high") return /(overdue|rejected|cancelled)$/.test(type) ? "danger" : "warning";
  return priority === "low" ? "neutral" : "info";
}

/** Token classes for an event's icon chip, by tone (never colour alone: the title says it). */
export const TONE_CHIP: Record<Tone, string> = {
  neutral: "bg-sunken text-fg-muted",
  info: "bg-info-subtle text-info",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  danger: "bg-danger-subtle text-danger",
  brand: "bg-brand-subtle text-fg-brand",
};

type Data = Record<string, unknown> | null | undefined;
const str = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));

/**
 * The page an event is about, if the reader's role may open it. Activity items carry a `target`;
 * notifications carry ids in `data`.
 */
export function eventHref(role: AppRole, data: Data, target?: { resource: string; id: string } | null): string | null {
  const d = data ?? {};
  const pick = (): string | null => {
    if (target && target.resource && target.resource !== "none" && target.id) {
      const id = encodeURIComponent(target.id);
      switch (target.resource) {
        case "offer":
          return `/offers/${id}`;
        case "project":
          return `/projects/${id}`;
        case "customer":
          return `/customers/${id}`;
        case "salesman":
          return `/salesman/${id}`;
        case "commission":
          return "/commissions";
        case "invoice":
          return `/invoices/${id}`;
        case "subscription":
          return `/subscriptions/${id}`;
        case "ticket":
          return `/tickets/${id}`;
        case "coupon":
          return "/coupons";
        default:
          break;
      }
    }
    const id = (k: string) => encodeURIComponent(String(d[k]));
    if (str(d.offerId)) return `/offers/${id("offerId")}`;
    if (str(d.projectId)) return `/projects/${id("projectId")}`;
    if (str(d.leadId)) return `/customers/${id("leadId")}`;
    if (str(d.customerId)) return `/customers/${id("customerId")}`;
    if (str(d.salesmanId)) return `/salesman/${id("salesmanId")}`;
    if (str(d.commissionId)) return "/commissions";
    if (str(d.invoiceId)) return `/invoices/${id("invoiceId")}`;
    if (str(d.subscriptionId)) return `/subscriptions/${id("subscriptionId")}`;
    if (str(d.ticketId)) return `/tickets/${id("ticketId")}`;
    if (str(d.couponId)) return "/coupons";
    return null;
  };
  const href = pick();
  return href && canAccessRoute(role, href) ? href : null;
}

/** The cache tags an event may have changed, so open screens refresh without a reload. */
export function tagsForType(type: string) {
  const p = String(type).split(".")[0];
  const tags: (
    | "Projects"
    | "Contracts"
    | "Offers"
    | "Customers"
    | "Commissions"
    | "Salesmen"
    | "Invoices"
    | "Subscriptions"
    | "Tickets"
    | "Coupons"
    | "LoyaltyCustomers"
    | "LoyaltyTransactions"
    | "Dashboard"
  )[] = ["Dashboard"];
  if (p === "project") tags.push("Projects");
  if (p === "contract") tags.push("Projects", "Contracts", "Commissions");
  if (p === "offer") tags.push("Offers", "Projects");
  if (p === "customer" || p === "lead") tags.push("Customers");
  if (p === "invoice" || p === "custom_invoice" || p === "payment") tags.push("Invoices", "Subscriptions");
  if (p === "subscription") tags.push("Subscriptions", "Invoices");
  if (p === "wallet") tags.push("Commissions", "Salesmen");
  if (p === "salesman") tags.push("Salesmen");
  if (p === "ticket") tags.push("Tickets");
  if (p === "coupon") tags.push("Coupons");
  if (p === "loyalty") tags.push("LoyaltyCustomers", "LoyaltyTransactions");
  return tags;
}

/** The Intl tag for the reader's language and digits (D-016). */
export function useFormatTag() {
  const { locale, digits } = useOrgtik();
  return formatLocale(locale, digits);
}

const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.35],
  ["month", 12],
  ["year", Infinity],
];

/** "3 hours ago", "yesterday", in the reader's language. */
export function timeAgo(iso: string, tag: string, now: number = Date.now()): string {
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return "";
  let value = (at - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
  for (const [unit, size] of STEPS) {
    if (Math.abs(value) < size) return rtf.format(Math.round(value), unit);
    value /= size;
  }
  return rtf.format(Math.round(value), "year");
}

/** The exact moment, for a tooltip or `title`: in the organisation's time zone. */
export function exactTime(iso: string, tag: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeStyle: "short", timeZone: ORG_TIME_ZONE }).format(d);
}

/** A day heading: "Today", "Yesterday", or the date. `day` is YYYY-MM-DD. */
export function dayHeading(day: string, tag: string, now: number = Date.now()): string {
  const at = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(at)) return day;
  const today = Date.parse(`${new Date(now).toISOString().slice(0, 10)}T00:00:00Z`);
  const diff = Math.round((at - today) / 86_400_000);
  if (diff === 0 || diff === -1) return new Intl.RelativeTimeFormat(tag, { numeric: "auto" }).format(diff, "day");
  return new Intl.DateTimeFormat(tag, { dateStyle: "full", timeZone: "UTC" }).format(new Date(at));
}

/**
 * The words for an event: its title from its type, and a short context line built from its data
 * (an invoice number, a ticket subject, a project's move between stages). The API's English
 * message is only offered to English readers.
 */
export function useEventText() {
  const t = useTranslations("SalesNotify");
  const locale = useLocale();
  const projectStatus = useSalesStatusLabel();
  const english = locale === "en";

  const title = useCallback(
    (type: string, fallback?: string | null) => {
      const key = `types.${typeKey(type)}`;
      if (t.has(key)) return t(key);
      return fallback || t("types.other");
    },
    [t],
  );

  const context = useCallback(
    (type: string, data: Data, message?: string | null): string | null => {
      if (english && message) return message;
      const d = data ?? {};
      if (type === "project.status_changed" && str(d.from) && str(d.to)) {
        return t("context.moved", { from: projectStatus("project", String(d.from)), to: projectStatus("project", String(d.to)) });
      }
      if (str(d.invoiceNumber)) return t("context.invoice", { number: String(d.invoiceNumber) });
      if (str(d.subject)) return t("context.ticket", { subject: String(d.subject) });
      if (str(d.code)) return t("context.coupon", { code: String(d.code) });
      if (str(d.projectName)) return t("context.project", { name: String(d.projectName) });
      return null;
    },
    [english, projectStatus, t],
  );

  return { title, context };
}
