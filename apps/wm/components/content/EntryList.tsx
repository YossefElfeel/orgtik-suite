"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Input,
  Progress,
  Select,
  StatusBadge,
  useFormatter,
} from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { LanguageDots } from "@/components/content/LanguageDots";
import { NewEntry } from "@/components/content/NewEntry";
import { useCan } from "@/lib/permissions";
import { Link } from "@/i18n/routing";
import { DEPARTMENTS } from "@/lib/caseStudySchema";
import { TYPES } from "@/lib/contentTypes";
import { useEntryName } from "@/lib/entryName";
import { mediaUrl } from "@/lib/env";
import {
  statusOf,
  useEntriesQuery,
  usePricingQuery,
  type EntrySummary,
  type EntryType,
} from "@/store/api";

/**
 * One content type's entries as a table: name and address, what that type needs to be told apart
 * (format, family, date, price), workflow state, languages, last change. Filters: search, plus
 * department for case studies and family for services.
 */
// Where the site's design takes a list of any length, entries can be added; elsewhere the design
// has a place for each one (the five families, their services, the six modules).
const CREATABLE = new Set<EntryType>(["article", "caseStudy", "roadmapItem"]);
const FIXED_SET = new Set<EntryType>([
  "serviceFamily",
  "service",
  "softwareModule",
]);

export function EntryList({ type: key }: { type: EntryType }) {
  const t = useTranslations("Editor");
  const can = useCan();
  const tt = useTranslations("Types");
  const tf = useTranslations("Formats");
  const f = useFormatter();
  const type = TYPES[key];
  const entryName = useEntryName();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const filterKey =
    key === "caseStudy" ? "department" : key === "service" ? "parent" : null;
  const { data, isLoading, error, refetch, isFetching } = useEntriesQuery({
    type: key,
    pageSize: 100,
    search: search || undefined,
    ...(filterKey && filter !== "all" ? { [filterKey]: filter } : {}),
  });
  const needsFamilies =
    key === "service" || key === "article" || key === "serviceFamily";
  const families = useEntriesQuery(
    { type: "serviceFamily", pageSize: 100 },
    { skip: !needsFamilies || key === "serviceFamily" },
  );
  const services = useEntriesQuery(
    { type: "service", pageSize: 100 },
    { skip: key !== "serviceFamily" },
  );
  const pricing = usePricingQuery(undefined, {
    skip: key !== "softwareModule",
  });
  const familyList =
    key === "serviceFamily" ? data?.items : families.data?.items;
  const familyById = useMemo(
    () => new Map((familyList ?? []).map((x) => [x.id, x])),
    [familyList],
  );
  const familyBySlug = useMemo(
    () => new Map((familyList ?? []).map((x) => [x.slug.en ?? "", x])),
    [familyList],
  );
  const filtered = Boolean(search) || filter !== "all";

  const columns = useMemo<ColumnDef<EntrySummary, any>[]>(() => {
    const cols: ColumnDef<EntrySummary, any>[] = [
      {
        id: "name",
        header: t("colName"),
        meta: { truncate: true },
        cell: ({ row }) => {
          const c = row.original;
          const family = c.parent
            ? familyById.get(c.parent)?.slug.en
            : undefined;
          return (
            <span className="inline-flex max-w-full items-center gap-3">
              {c.image ? (
                <img
                  src={mediaUrl(c.image.src)}
                  alt=""
                  className="size-10 shrink-0 rounded-field bg-sunken object-cover"
                />
              ) : null}
              <span className="flex min-w-0 flex-col">
                <Link
                  href={`/content/${type.area}/${c.id}`}
                  dir="auto"
                  className="truncate font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus"
                >
                  {entryName(c)}
                </Link>
                {type.path(c.slug.en ?? "", family) ? (
                  <span
                    dir="ltr"
                    className="truncate text-start font-mono text-caption text-fg-subtle"
                  >
                    {type.path(c.slug.en ?? "", family)}
                  </span>
                ) : null}
              </span>
            </span>
          );
        },
      },
    ];
    if (key === "caseStudy") {
      cols.push({
        id: "format",
        header: t("colFormat"),
        cell: ({ row }) => (
          <span className="text-fg-muted">
            {row.original.department ? tf(row.original.department) : null}
          </span>
        ),
      });
      cols.push({
        id: "figures",
        header: t("colFigures"),
        cell: ({ row }) =>
          row.original.figures === "sample" ? (
            <Badge tone="warning" size="sm">
              {t("figuresSample")}
            </Badge>
          ) : (
            <Badge tone="success" size="sm">
              {t("figuresApproved")}
            </Badge>
          ),
      });
    }
    if (key === "service")
      cols.push({
        id: "family",
        header: t("colFamily"),
        cell: ({ row }) => (
          <span dir="auto" className="text-fg-muted">
            {familyById.get(row.original.parent ?? "")?.name}
          </span>
        ),
      });
    if (key === "serviceFamily")
      cols.push({
        id: "services",
        header: tt("service.many"),
        cell: ({ row }) => (
          <span className="text-fg-muted">
            {t("servicesCount", {
              count: (services.data?.items ?? []).filter(
                (s) => s.parent === row.original.id,
              ).length,
            })}
          </span>
        ),
      });
    if (key === "article") {
      cols.push({
        id: "family",
        header: t("colFamily"),
        cell: ({ row }) => (
          <span dir="auto" className="text-fg-muted">
            {familyBySlug.get(row.original.category ?? "")?.name}
          </span>
        ),
      });
      cols.push({
        id: "published",
        header: t("colPublished"),
        meta: { numeric: true },
        cell: ({ row }) => (
          <span className="flex flex-col text-fg-muted">
            <span>
              {row.original.publishedOn
                ? f.date(row.original.publishedOn + "T00:00:00", {
                    dateStyle: "medium",
                  })
                : null}
            </span>
            <span className="text-caption text-fg-subtle">
              {t("readingTime", { count: row.original.readingMinutes ?? 0 })}
            </span>
          </span>
        ),
      });
    }
    if (key === "roadmapItem") {
      cols.push({
        id: "timeline",
        header: t("colTimeline"),
        cell: ({ row }) => (
          <span className="flex flex-col items-start gap-1">
            {row.original.status ? (
              <StatusBadge
                entity="roadmap_idea"
                state={row.original.status}
                size="sm"
              />
            ) : null}
            <span className="text-caption text-fg-subtle">
              {row.original.period ? t(`periods.${row.original.period}`) : null}{" "}
              · <span dir="ltr">{row.original.year}</span>
            </span>
          </span>
        ),
      });
      cols.push({
        id: "progress",
        header: t("colProgress"),
        cell: ({ row }) => (
          <Progress
            value={row.original.progress ?? 0}
            label={<span className="sr-only">{t("colProgress")}</span>}
            className="w-32"
          />
        ),
      });
    }
    if (key === "legalDocument")
      cols.push({
        id: "version",
        header: t("colVersion"),
        cell: ({ row }) => (
          <span className="flex flex-col">
            <span
              dir="ltr"
              className="text-start font-semibold text-fg tabular-nums"
            >
              {row.original.versionLabel}
            </span>
            <span className="text-caption text-fg-subtle">
              {row.original.effectiveFrom
                ? t("effectiveOn", {
                    date: f.date(row.original.effectiveFrom + "T00:00:00", {
                      dateStyle: "medium",
                    }),
                  })
                : t("noEffectiveDate")}
            </span>
          </span>
        ),
      });
    if (key === "strings" || key === "page" || key === "global")
      cols.push({
        id: "slots",
        header: t("colTexts"),
        meta: { numeric: true },
        cell: ({ row }) => (
          <span className="text-fg-muted tabular-nums">
            {f.number(row.original.slots ?? 0)}
          </span>
        ),
      });
    if (key === "softwareModule")
      cols.push({
        id: "price",
        header: t("colPrice"),
        meta: { numeric: true },
        cell: ({ row }) => {
          const p = pricing.data?.modules[row.original.slug.en ?? ""];
          return (
            <span className="text-fg-muted tabular-nums">
              {p ? f.money(p.monthly, pricing.data?.currency ?? "CHF") : null}
            </span>
          );
        },
      });
    cols.push(
      {
        id: "state",
        header: t("colState"),
        cell: ({ row }) => (
          <StatusBadge
            entity="cms_revision"
            state={row.original.state}
            size="sm"
          />
        ),
      },
      {
        id: "languages",
        header: t("colLanguages"),
        cell: ({ row }) => (
          <LanguageDots translation={row.original.translation} />
        ),
      },
      {
        id: "updated",
        header: t("colUpdated"),
        meta: { numeric: true },
        cell: ({ row }) => {
          const u = row.original.updatedBy;
          return (
            <span className="text-fg-muted">
              {t.rich("updatedBy", {
                date: f.date(row.original.updatedAt),
                name: u.name ?? t("imported"),
                who: (c) => <bdi dir="auto">{c}</bdi>,
              })}
            </span>
          );
        },
      },
    );
    return cols;
  }, [
    t,
    tt,
    tf,
    f,
    key,
    type,
    entryName,
    familyById,
    familyBySlug,
    services.data,
    pricing.data,
  ]);

  const filterOptions =
    key === "caseStudy"
      ? [
          { value: "all", label: t("allDepartments") },
          ...DEPARTMENTS.map((d) => ({ value: d, label: tf(d) })),
        ]
      : key === "service"
        ? [
            { value: "all", label: t("allFamilies") },
            ...(families.data?.items ?? []).map((x) => ({
              value: x.id,
              label: <span dir="auto">{x.name}</span>,
            })),
          ]
        : null;
  const status = isLoading
    ? "loading"
    : error
      ? statusOf(error) === 403
        ? "forbidden"
        : "error"
      : "ready";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          size="sm"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={tt(`${key}.search`)}
          placeholder={tt(`${key}.search`)}
          startIcon={<MagnifyingGlass className="size-4" />}
          className="w-full sm:w-72"
        />
        {filterOptions ? (
          <Select
            size="sm"
            aria-label={key === "caseStudy" ? t("department") : t("family")}
            value={filter}
            onValueChange={(v) => setFilter(v ?? "all")}
            options={filterOptions}
            className="w-56"
          />
        ) : null}
        {CREATABLE.has(key) && can("content:edit") ? (
          <NewEntry type={key} entries={data?.items ?? []} />
        ) : null}
      </div>
      {FIXED_SET.has(key) ? (
        <p className="-mt-1 text-body-sm text-fg-muted">{t("fixedSet")}</p>
      ) : null}
      <DataTable
        label={tt(`${key}.many`)}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(r) => r.id}
        status={status}
        paginate={(data?.total ?? 0) > 25}
        onRetry={refetch}
        className={isFetching && !isLoading ? "opacity-70" : undefined}
        empty={
          filtered
            ? {
                title: tt(`${key}.noMatch`),
                description: t("noMatchBody"),
                action: (
                  <Button
                    size="sm"
                    variant="secondary"
                    startIcon={<X />}
                    onClick={() => (setSearch(""), setFilter("all"))}
                  >
                    {t("clear")}
                  </Button>
                ),
              }
            : { title: tt(`${key}.empty`), description: tt(`${key}.emptyBody`) }
        }
      />
    </div>
  );
}
