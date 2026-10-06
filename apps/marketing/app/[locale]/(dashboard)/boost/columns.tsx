"use client";

// The boosts table's columns (FS-MKT-9, MKT-058): readable objectives and buttons instead of
// OUTCOME_ENGAGEMENT and LEARN_MORE, money in its currency's own format, plural days, and the
// post the boost promotes.
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { WarningCircle } from "@phosphor-icons/react";
import { Button, Popover, PopoverContent, PopoverTrigger, useFormatter } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { useProjectContext } from "@/lib/project-context";
import type { IAdExecution } from "@/types/boost";

export function useBoostColumns(): ColumnDef<IAdExecution>[] {
  const t = useTranslations("Boost");
  const f = useFormatter();
  const locale = useLocale();
  const { timeZone } = useProjectContext();
  const regions = useMemo(() => new Intl.DisplayNames(locale, { type: "region" }), [locale]);

  return useMemo<ColumnDef<IAdExecution>[]>(
    () => [
      {
        id: "post",
        header: t("colPost"),
        meta: { truncate: true },
        cell: ({ row }) => {
          const title = (row.original.platformData?.postTitle as string | undefined) || t("untitledPost");
          return row.original.unifiedPostId ? (
            <Link href={`/posts/${row.original.unifiedPostId}`} dir="auto" className="block truncate font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
              {title}
            </Link>
          ) : (
            <span dir="auto" className="block truncate font-semibold text-fg">
              {title}
            </span>
          );
        },
      },
      { id: "platform", header: t("colPlatform"), cell: ({ row }) => <PlatformBadge platform={row.original.platform} /> },
      {
        id: "status",
        header: t("colStatus"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <MarketingStatus kind="boost" value={row.original.status} size="sm" />
            {row.original.errorMessage ? (
              <Popover>
                <PopoverTrigger render={<Button size="sm" variant="ghost" startIcon={<WarningCircle />} />}>{t("whyFailed")}</PopoverTrigger>
                <PopoverContent align="end" title={t("whyFailedTitle")}>
                  <p dir="auto" className="max-w-sm text-body-sm text-fg">
                    {row.original.errorMessage}
                  </p>
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
        ),
      },
      { id: "objective", header: t("colObjective"), cell: ({ row }) => t(`objective_${row.original.objective}`) },
      {
        id: "budget",
        header: t("colBudget"),
        meta: { numeric: true },
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="flex flex-col items-end">
              <span>{t("perDay", { amount: f.money(e.budgetAmount, e.currency) })}</span>
              <span className="text-caption text-fg-muted">{t("totalShort", { amount: f.money(e.budgetAmount * e.durationDays, e.currency) })}</span>
            </div>
          );
        },
      },
      { id: "days", header: t("colDuration"), meta: { numeric: true }, cell: ({ row }) => t("daysCount", { count: row.original.durationDays }) },
      {
        id: "audience",
        header: t("colAudience"),
        cell: ({ row }) => {
          const g = row.original.targeting;
          const where = (g?.geo_locations?.countries ?? []).map((c) => regions.of(c) ?? c).join(", ");
          const ages = g?.age_min && g?.age_max ? t("ages", { min: g.age_min, max: g.age_max }) : "";
          return <span className="text-body-sm">{[where, ages].filter(Boolean).join(" · ") || t("anyone")}</span>;
        },
      },
      {
        id: "started",
        header: t("colStart"),
        meta: { numeric: true },
        cell: ({ row }) => {
          const e = row.original;
          if (e.startedAt) return <time dateTime={e.startedAt}>{f.date(e.startedAt, { dateStyle: "medium", timeStyle: "short", timeZone })}</time>;
          if (e.scheduledAt) return <span className="text-fg-muted">{t("startsAt", { when: f.date(e.scheduledAt, { dateStyle: "medium", timeStyle: "short", timeZone }) })}</span>;
          return <span className="text-fg-subtle">{t("notStarted")}</span>;
        },
      },
    ],
    [t, f, timeZone, regions],
  );
}
