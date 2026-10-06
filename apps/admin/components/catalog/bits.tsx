"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Browser,
  Calendar,
  ChartLineUp,
  Chats,
  CheckSquare,
  Cube,
  EnvelopeSimple,
  Eye,
  Folder,
  HardDrives,
  Lightning,
  Megaphone,
  Robot,
  SquaresFour,
  Storefront,
  UsersThree,
  WarningCircle,
  type Icon,
} from "@phosphor-icons/react";
import { Badge, EmptyState, Select, type Tone } from "@orgtik/ui";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import type { Locale, Localized } from "@/store/api";
import { useToolsQuery, type ToolStatus } from "@/store/catalog";

/** The icons a tool can have, by the name the API stores (Phosphor's web-font names). */
export const TOOL_ICONS: Record<string, Icon> = {
  "ph-squares-four": SquaresFour,
  "ph-check-square": CheckSquare,
  "ph-folder": Folder,
  "ph-chats": Chats,
  "ph-users-three": UsersThree,
  "ph-chart-line-up": ChartLineUp,
  "ph-megaphone": Megaphone,
  "ph-envelope-simple": EnvelopeSimple,
  "ph-browser": Browser,
  "ph-hard-drives": HardDrives,
  "ph-calendar": Calendar,
  "ph-storefront": Storefront,
  "ph-robot": Robot,
  "ph-lightning": Lightning,
  "ph-cube": Cube,
};

export function ToolIcon({ icon, className }: { icon: string; className?: string }) {
  const I = TOOL_ICONS[icon] ?? Cube;
  return (
    <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-field bg-brand-subtle text-fg-brand [&_svg]:size-4 ${className ?? ""}`}>
      <I />
    </span>
  );
}

const STATUS_TONE: Record<ToolStatus, Tone> = { coming_soon: "info", beta: "warning", live: "success", retired: "neutral" };

/** A tool's release status. Catalog statuses aren't in the status matrix (its tool_state is a workspace's), so: tone and words. */
export function ToolStatusBadge({ status, size = "sm" }: { status: ToolStatus; size?: "sm" | "md" }) {
  const t = useTranslations("Catalog.status");
  return (
    <Badge size={size} tone={STATUS_TONE[status]}>
      {t(status)}
    </Badge>
  );
}

/** A localized value in the page's language, else English (D-014's fallback). */
export function useLocalized() {
  const locale = useLocale() as Locale;
  return (v: Partial<Localized> | undefined | null) => (v ? v[locale]?.trim() || v.en || "" : "");
}

/** Said where an editor can't change anything: the controls are gone, so say why. */
export function ViewOnlyNote() {
  const tc = useTranslations("Common");
  return (
    <p role="note" className="flex items-center gap-2 rounded-field border border-line bg-sunken px-3 py-2 text-body-sm text-fg-muted">
      <Eye aria-hidden="true" className="size-4 shrink-0" />
      {tc("viewOnly")}
    </p>
  );
}

/** An answer from the API shown where it happened (a refused delete, a refused status). */
export function InlineAlert({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div role="alert" className="flex flex-wrap items-start gap-2 rounded-field bg-danger-subtle px-3 py-2 text-body-sm text-danger">
      <WarningCircle aria-hidden="true" weight="fill" className="mt-[0.15em] size-[1.1em] shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

/** A page for a key or id the API doesn't know. */
export function NotFound({ title, body, back, backHref }: { title: string; body: string; back: string; backHref: string }) {
  return (
    <EmptyState
      size="page"
      titleAs="h1"
      title={title}
      description={body}
      action={
        <Link href={backHref} className="text-body font-semibold text-fg-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-focus">
          {back}
        </Link>
      }
    />
  );
}

/** "All tools" or one tool, kept in the address (?tool=) so a link opens the same view. */
export function ToolFilter({ value, label }: { value: string; label: string }) {
  const t = useTranslations("Catalog");
  const name = useLocalized();
  const router = useRouter();
  const pathname = usePathname();
  const tools = useToolsQuery();
  return (
    <Select
      size="sm"
      aria-label={label}
      className="w-full sm:w-56"
      value={value || "all"}
      onValueChange={(v) => router.replace(v && v !== "all" ? `${pathname}?tool=${v}` : pathname)}
      options={[{ value: "all", label: t("allTools") }, ...(tools.data ?? []).map((x) => ({ value: x.key, label: name(x.name) }))]}
    />
  );
}

/** The tool's name for a key, from the (cached) tools list. */
export function useToolName() {
  const name = useLocalized();
  const tools = useToolsQuery();
  return (key: string) => name(tools.data?.find((x) => x.key === key)?.name) || key;
}

/** Plans and Features and limits are one area (Nav: "Plans and features"): two views, two addresses. */
export function PlansTabs({ current, tool }: { current: "plans" | "features"; tool?: string }) {
  const t = useTranslations("Catalog");
  const q = tool ? `?tool=${tool}` : "";
  const cls = (on: boolean) =>
    `-mb-px border-b-2 px-1 pb-2 text-body font-semibold focus-visible:outline-2 focus-visible:outline-focus ${on ? "border-fg-brand text-fg" : "border-transparent text-fg-muted hover:text-fg"}`;
  return (
    <nav aria-label={t("plansArea")} className="flex gap-6 border-b border-line">
      <Link href={`/plans${q}`} aria-current={current === "plans" ? "page" : undefined} className={cls(current === "plans")}>
        {t("plans.title")}
      </Link>
      <Link href={`/plans/features${q}`} aria-current={current === "features" ? "page" : undefined} className={cls(current === "features")}>
        {t("features.title")}
      </Link>
    </nav>
  );
}

/** A server field error's code in words. */
export function useFieldError() {
  const t = useTranslations("Catalog.fieldError");
  return (code: string | undefined) => (code ? (["required", "invalid", "taken", "min", "range", "unknown"].includes(code) ? t(code) : t("invalid")) : undefined);
}

/** An address for library components that take a plain href (Breadcrumb): with the language. */
export function useLocaleHref() {
  const locale = useLocale();
  return (p: string) => `/${locale}${p}`;
}
