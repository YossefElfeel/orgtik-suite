"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, PageHeader, Select, StatusBadge, Tabs, TabsList, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { Link } from "@/i18n/routing";
import { TYPES } from "@/lib/contentTypes";
import { useEntryName } from "@/lib/entryName";
import { statusOf, useLocalizationQuery, type EntryType, type Locale, type LocalizationRow, type TranslationState } from "@/store/api";

const LANGS: Locale[] = ["ar", "de", "fr", "it"];
const NATIVE: Record<Locale, string> = { en: "English", ar: "العربية", de: "Deutsch", fr: "Français", it: "Italiano" };
const FILTERS = ["all", "needs_review", "outdated", "in_progress", "not_started"] as const;
type Filter = (typeof FILTERS)[number];
const DONE: TranslationState[] = ["ready", "published"];

// Every entry in every language: where each translation stands, and a way into it.
function Matrix() {
  const t = useTranslations("Localization");
  const tt = useTranslations("Types");
  const f = useFormatter();
  const entryName = useEntryName();
  const [filter, setFilter] = useState<Filter>("all");
  const [type, setType] = useState<"all" | EntryType>("all");
  const { data, isLoading, error, refetch } = useLocalizationQuery();
  // Prices are numbers and keys; they have nothing to translate beyond their words, kept with them.
  const all = (data?.items ?? []).filter((r) => r.type !== "pricing");
  const rows = all.filter((r) => (type === "all" || r.type === type) && (filter === "all" || LANGS.some((l) => r.translation[l] === filter)));
  const count = (s: Filter) => (s === "all" ? all.length : all.filter((r) => LANGS.some((l) => r.translation[l] === s)).length);

  const columns = useMemo<ColumnDef<LocalizationRow, any>[]>(
    () => [
      {
        id: "entry",
        header: t("colEntry"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col">
            <Link href={`/content/${TYPES[row.original.type].area}/${row.original.id}`} dir="auto" className="truncate font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
              {entryName(row.original)}
            </Link>
            <span className="text-caption text-fg-subtle">{tt(`${row.original.type}.one`)}</span>
          </span>
        ),
      },
      ...LANGS.map<ColumnDef<LocalizationRow, any>>((l) => ({
        id: l,
        header: () => (
          <span lang={l} dir={l === "ar" ? "rtl" : "ltr"}>
            {NATIVE[l]}
          </span>
        ),
        cell: ({ row }) => (
          <Link href={`/content/${TYPES[row.original.type].area}/${row.original.id}?lang=${l}`} aria-label={t("openIn", { language: NATIVE[l] })} className="inline-flex rounded-pill focus-visible:outline-2 focus-visible:outline-focus">
            <StatusBadge entity="translation" state={row.original.translation[l]} size="sm" />
          </Link>
        ),
      })),
    ],
    [t, tt, entryName],
  );

  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      {data ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(12rem,100%),1fr))] gap-3">
          {LANGS.map((l) => {
            const done = all.filter((r) => DONE.includes(r.translation[l])).length;
            return (
              <Card key={l} padding="sm" className="flex flex-col gap-1">
                <span lang={l} dir={l === "ar" ? "rtl" : "ltr"} className="text-start text-body-sm text-fg-muted">{NATIVE[l]}</span>
                <span className="font-display text-title text-fg tabular-nums">{f.number(done)} <span className="text-body-sm text-fg-subtle">/ {f.number(all.length)}</span></span>
                <span className="text-caption text-fg-subtle">{t("readyCount")}</span>
              </Card>
            );
          })}
        </div>
      ) : null}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList items={FILTERS.map((x) => ({ value: x, label: t(`filters.${x}`), count: count(x) }))} />
      </Tabs>
      <Select
        size="sm"
        aria-label={t("type")}
        value={type}
        onValueChange={(v) => setType((v ?? "all") as "all" | EntryType)}
        options={[{ value: "all", label: t("allTypes") }, ...(Object.keys(TYPES) as EntryType[]).filter((k) => k !== "pricing").map((k) => ({ value: k, label: tt(`${k}.many`) }))]}
        className="w-60"
      />
      <DataTable label={t("title")} columns={columns} data={rows} getRowId={(r) => r.id} status={status} paginate={rows.length > 25} onRetry={refetch} empty={{ title: t("empty") }} />
    </div>
  );
}

export default function LocalizationPage() {
  return (
    <RequirePermission permission="localization:view">
      <Matrix />
    </RequirePermission>
  );
}
