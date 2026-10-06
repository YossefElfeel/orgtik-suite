"use client";

// The posts list's filters: search, the month, platforms, status and labels. The old panel used
// coloured chips with no pressed state, said "Search Assets" (MKT-055) and showed a month it
// didn't filter by. Every chip here reports aria-pressed, and the parent keeps the values in the
// address.
import { useTranslations } from "next-intl";
import { CalendarBlank, CaretLeft, CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import { Button, FilterChips, IconButton, Input, MultiSelect, useFormatter } from "@orgtik/ui";
import { PLATFORMS } from "@/components/shared/PlatformBadge";
import { useMarketingStatusLabel } from "@/components/shared/MarketingStatus";
import { useGetLabelsListQuery } from "@/redux/features/labels/labelsApi";

export const POST_PLATFORMS = ["FACEBOOK", "INSTAGRAM", "X", "LINKEDIN", "TIKTOK", "YOUTUBE"] as const;
export const POST_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SCHEDULED", "PUBLISHED", "FAILED", "SYNCED"] as const;

/** "2026-10" → the next or previous month, same shape. */
export const shiftMonth = (ym: string, by: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  /** "YYYY-MM", or null for any date. */
  month: string | null;
  currentMonth: string;
  onMonthChange: (v: string | null) => void;
  platforms: string[];
  onPlatformsChange: (v: string[]) => void;
  statuses: string[];
  onStatusesChange: (v: string[]) => void;
  labels: string[];
  onLabelsChange: (v: string[]) => void;
};

export default function PostsFilter(p: Props) {
  const t = useTranslations("Posts");
  const f = useFormatter();
  const statusLabel = useMarketingStatusLabel();
  const { data: labelsData } = useGetLabelsListQuery();
  const labelOptions = (labelsData?.data ?? []).map((l) => ({ value: l.id, label: l.name }));

  const monthText = p.month
    ? f.date(`${p.month}-01T12:00:00Z`, { month: "long", year: "numeric", timeZone: "UTC" })
    : t("anyDate");

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-raised p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input
          type="search"
          value={p.search}
          onChange={(e) => p.onSearchChange(e.target.value)}
          startIcon={<MagnifyingGlass />}
          placeholder={t("search")}
          aria-label={t("search")}
          className="lg:max-w-sm"
        />
        <div role="group" aria-label={t("month")} className="flex items-center gap-1">
          <IconButton
            size="sm"
            variant="ghost"
            label={t("previousMonth")}
            icon={<CaretLeft className="rtl:-scale-x-100" />}
            onClick={() => p.onMonthChange(shiftMonth(p.month ?? p.currentMonth, -1))}
          />
          <span aria-live="polite" className="inline-flex min-w-36 items-center justify-center gap-1.5 px-2 text-body font-semibold text-fg">
            <CalendarBlank aria-hidden className="size-4 text-fg-muted" />
            {monthText}
          </span>
          <IconButton
            size="sm"
            variant="ghost"
            label={t("nextMonth")}
            icon={<CaretRight className="rtl:-scale-x-100" />}
            onClick={() => p.onMonthChange(shiftMonth(p.month ?? p.currentMonth, 1))}
          />
          {p.month ? (
            <Button size="sm" variant="ghost" onClick={() => p.onMonthChange(null)}>
              {t("anyDate")}
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => p.onMonthChange(p.currentMonth)}>
              {t("thisMonth")}
            </Button>
          )}
        </div>
        {labelOptions.length ? (
          <MultiSelect
            aria-label={t("labels")}
            placeholder={t("labelsPlaceholder")}
            options={labelOptions}
            value={p.labels}
            onValueChange={p.onLabelsChange}
            emptyText={t("noLabels")}
            className="lg:ms-auto lg:w-72"
          />
        ) : null}
      </div>
      <FilterChips
        label={t("platforms")}
        chips={POST_PLATFORMS.map((k) => ({ value: k, label: <bdi>{PLATFORMS[k].name}</bdi> }))}
        value={p.platforms}
        onValueChange={p.onPlatformsChange}
      />
      <FilterChips
        label={t("status")}
        chips={POST_STATUSES.map((s) => ({ value: s, label: s === "SYNCED" ? t("imported") : statusLabel("post", s) }))}
        value={p.statuses}
        onValueChange={p.onStatusesChange}
      />
    </div>
  );
}
