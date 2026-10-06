"use client";

// The archive's columns, one set per catalog resource. The archive is read-only now (FS-SAL-10):
// its records are frozen catalog data that moves to the Admin app (D-011), so the restore column
// went (its failure was an unhandled rejection too, SAL-146). Dates are in the organisation's time
// zone and the reader's language; counts and percents use the reader's digits.
// The features' price column went with it: it showed the first zone's price, whichever zone that
// was (the SAL-022 pattern), and an archived feature has no deal to price.
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFormatter } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { ORG_TIME_ZONE, useFormatTag } from "@/components/pages/activity-feed/feed";
import type {
  ArchivedCategory,
  ArchivedDuration,
  ArchivedFeature,
  ArchivedPackage,
  ArchivedPlan,
} from "@/types/archive";

function useArchivedAt<T extends { archivedAt: string }>(): ColumnDef<T> {
  const t = useTranslations("SalesArchive");
  const f = useFormatter();
  return useMemo<ColumnDef<T>>(
    () => ({
      id: "archivedAt",
      header: t("columnArchivedAt"),
      meta: { numeric: true, width: "1%" },
      cell: ({ row }) => (
        <time dateTime={row.original.archivedAt} className="text-fg-muted">
          {f.date(row.original.archivedAt, { dateStyle: "medium", timeStyle: "short", timeZone: ORG_TIME_ZONE })}
        </time>
      ),
    }),
    [f, t],
  );
}

const name = (text: string) => (
  <span dir="auto" className="font-medium text-fg">
    {text}
  </span>
);

export function useArchiveDurationColumns(): ColumnDef<ArchivedDuration>[] {
  const t = useTranslations("SalesArchive");
  const f = useFormatter();
  const archivedAt = useArchivedAt<ArchivedDuration>();
  return useMemo<ColumnDef<ArchivedDuration>[]>(
    () => [
      {
        id: "months",
        header: t("columnLength"),
        cell: ({ row }) => <span className="font-medium text-fg">{t("months", { count: row.original.months })}</span>,
      },
      {
        id: "percentage",
        header: t("columnDiscount"),
        meta: { numeric: true },
        cell: ({ row }) => {
          const p = Number.parseFloat(String(row.original.percentage));
          return Number.isFinite(p) ? f.percent(p / 100, 2) : "—";
        },
      },
      archivedAt,
    ],
    [archivedAt, f, t],
  );
}

export function useArchiveFeatureColumns(): ColumnDef<ArchivedFeature>[] {
  const t = useTranslations("SalesArchive");
  const archivedAt = useArchivedAt<ArchivedFeature>();
  return useMemo<ColumnDef<ArchivedFeature>[]>(
    () => [
      { id: "name", header: t("columnName"), meta: { truncate: true }, cell: ({ row }) => name(row.original.name) },
      {
        id: "category",
        header: t("columnCategory"),
        cell: ({ row }) => (
          <span dir="auto" className="text-fg-muted">
            {row.original.categoryName || "—"}
          </span>
        ),
      },
      {
        id: "paymentType",
        header: t("columnPaymentType"),
        cell: ({ row }) => (row.original.paymentType === "installment" ? t("paymentInstallment") : t("paymentFull")),
      },
      archivedAt,
    ],
    [archivedAt, t],
  );
}

export function useArchiveCategoryColumns(): ColumnDef<ArchivedCategory>[] {
  const t = useTranslations("SalesArchive");
  const f = useFormatter();
  const text = useCatalogDisplayText();
  const archivedAt = useArchivedAt<ArchivedCategory>();
  return useMemo<ColumnDef<ArchivedCategory>[]>(
    () => [
      { id: "name", header: t("columnName"), meta: { truncate: true }, cell: ({ row }) => name(text(row.original.name)) },
      {
        id: "department",
        header: t("columnDepartment"),
        cell: ({ row }) => (
          <span dir="auto" className="text-fg-muted">
            {text(row.original.departmentName) || "—"}
          </span>
        ),
      },
      { id: "plans", header: t("columnPlans"), meta: { numeric: true }, cell: ({ row }) => f.number(row.original.planCount ?? 0) },
      archivedAt,
    ],
    [archivedAt, f, t, text],
  );
}

export function useArchivePlanColumns(): ColumnDef<ArchivedPlan>[] {
  const t = useTranslations("SalesArchive");
  const f = useFormatter();
  const text = useCatalogDisplayText();
  const archivedAt = useArchivedAt<ArchivedPlan>();
  return useMemo<ColumnDef<ArchivedPlan>[]>(
    () => [
      { id: "name", header: t("columnName"), meta: { truncate: true }, cell: ({ row }) => name(text(row.original.name)) },
      {
        id: "category",
        header: t("columnCategory"),
        cell: ({ row }) => (
          <span dir="auto" className="text-fg-muted">
            {text(row.original.category?.name) || "—"}
          </span>
        ),
      },
      {
        id: "department",
        header: t("columnDepartment"),
        cell: ({ row }) => (
          <span dir="auto" className="text-fg-muted">
            {text(row.original.department?.name) || "—"}
          </span>
        ),
      },
      { id: "features", header: t("columnFeatures"), meta: { numeric: true }, cell: ({ row }) => f.number(row.original.featureCount ?? 0) },
      archivedAt,
    ],
    [archivedAt, f, t, text],
  );
}

export function useArchivePackageColumns(): ColumnDef<ArchivedPackage>[] {
  const t = useTranslations("SalesArchive");
  const tag = useFormatTag();
  const text = useCatalogDisplayText();
  const archivedAt = useArchivedAt<ArchivedPackage>();
  return useMemo<ColumnDef<ArchivedPackage>[]>(() => {
    const list = new Intl.ListFormat(tag, { type: "conjunction" });
    return [
      { id: "name", header: t("columnName"), meta: { truncate: true }, cell: ({ row }) => name(text(row.original.name)) },
      {
        id: "description",
        header: t("columnDescription"),
        meta: { wrap: true },
        cell: ({ row }) => (
          <span dir="auto" className="line-clamp-2 text-fg-muted">
            {text(row.original.description) || "—"}
          </span>
        ),
      },
      {
        id: "plans",
        header: t("columnPlans"),
        meta: { wrap: true },
        cell: ({ row }) => {
          const names = (row.original.planNames ?? []).map((n) => text(n)).filter(Boolean);
          return names.length ? <span dir="auto">{list.format(names)}</span> : "—";
        },
      },
      archivedAt,
    ];
  }, [archivedAt, t, tag, text]);
}
