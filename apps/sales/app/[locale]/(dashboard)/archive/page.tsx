"use client";

// The archive (FS-SAL-10): archived plans, features, categories, durations and packages, to look
// up, not to change. These are frozen catalog records that move to the Admin app with plan
// management (D-011), and the page says so. Admins and managers open it.
// - The tab, the duration kind, the search, the page and its size are in the URL.
// - Library DataTable with loading, error with Retry, empty and "no match" states (the old tables
//   showed an empty table on error, SAL-044).
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Info, MagnifyingGlass } from "@phosphor-icons/react";
import {
  Button,
  Field,
  Input,
  LoadingState,
  PageHeader,
  SegmentedControl,
  Tabs,
  TabsList,
  TabsPanel,
  type ListStatus,
} from "@orgtik/ui";
import { DataTable, type ColumnDef, type PaginationState } from "@orgtik/ui/table";
import { usePathname, useRouter } from "@/i18n/routing";
import {
  useGetArchiveCategoriesQuery,
  useGetArchiveDurationsQuery,
  useGetArchiveFeaturesQuery,
  useGetArchivePackagesQuery,
  useGetArchivePlansQuery,
} from "@/redux/features/archive/archiveApi";
import { ARCHIVE_RESOURCES, type ArchiveResourceType } from "@/types/archive";
import type { DurationKind } from "@/types/durations";
import type { IPagination } from "@/types";
import {
  useArchiveCategoryColumns,
  useArchiveDurationColumns,
  useArchiveFeatureColumns,
  useArchivePackageColumns,
  useArchivePlanColumns,
} from "./columns";

const SIZES = [10, 25, 50];

type QueryLike<T> = {
  data?: { data?: { items?: T[]; meta?: IPagination } };
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => unknown;
};

const statusOf = <T,>(q: QueryLike<T>): ListStatus => {
  if (q.isLoading || (q.isFetching && !q.data)) return "loading";
  if (q.isError && !q.data) return "error";
  return "ready";
};

function ArchiveView() {
  const t = useTranslations("SalesArchive");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawType = params.get("type");
  const resource: ArchiveResourceType = ARCHIVE_RESOURCES.includes(rawType as ArchiveResourceType) ? (rawType as ArchiveResourceType) : "plans";
  const kind: DurationKind = params.get("kind") === "installment" ? "installment" : "plan";
  const q = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const sizeParam = Number(params.get("size"));
  const limit = SIZES.includes(sizeParam) ? sizeParam : SIZES[0];

  const set = (next: { type?: ArchiveResourceType; kind?: DurationKind; q?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams(params.toString());
    const put = (k: string, v: string | null) => (v ? sp.set(k, v) : sp.delete(k));
    if (next.type !== undefined) put("type", next.type === "plans" ? null : next.type);
    if (next.kind !== undefined) put("kind", next.kind === "plan" ? null : next.kind);
    if (next.q !== undefined) put("q", next.q.trim() || null);
    if (next.size !== undefined) put("size", next.size === SIZES[0] ? null : String(next.size));
    if (next.page !== undefined) put("page", next.page > 1 ? String(next.page) : null);
    const qs = sp.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  // The search box commits to the URL after a short pause.
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);
  useEffect(() => {
    if (draft.trim() === q.trim()) return;
    const timer = setTimeout(() => set({ q: draft, page: 1 }), 400);
    return () => clearTimeout(timer);
    // `set` reads the current URL; re-running for it isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const args = { page, limit, search: q.trim() || undefined };
  const durations = useGetArchiveDurationsQuery({ ...args, type: kind }, { skip: resource !== "durations" });
  const features = useGetArchiveFeaturesQuery(args, { skip: resource !== "features" });
  const categories = useGetArchiveCategoriesQuery(args, { skip: resource !== "categories" });
  const plans = useGetArchivePlansQuery(args, { skip: resource !== "plans" });
  const packages = useGetArchivePackagesQuery(args, { skip: resource !== "packages" });

  const durationColumns = useArchiveDurationColumns();
  const featureColumns = useArchiveFeatureColumns();
  const categoryColumns = useArchiveCategoryColumns();
  const planColumns = useArchivePlanColumns();
  const packageColumns = useArchivePackageColumns();

  const pagination: PaginationState = { pageIndex: page - 1, pageSize: limit };
  const onPaginationChange = (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    set({ page: next.pageIndex + 1, size: next.pageSize });
  };

  const clearSearch = (
    <Button variant="secondary" onClick={() => set({ q: "", page: 1 })}>
      {t("clearSearch")}
    </Button>
  );

  function table<T extends { id: string }>(query: QueryLike<T>, columns: ColumnDef<T>[]): ReactNode {
    return (
      <DataTable<T>
        label={t(`archived.${resource}`)}
        mode="server"
        columns={columns}
        data={query.data?.data?.items ?? []}
        getRowId={(row) => row.id}
        status={statusOf(query)}
        onRetry={() => void query.refetch()}
        rowCount={query.data?.data?.meta?.total ?? 0}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        pageSizes={SIZES}
        error={{ title: t("loadError") }}
        empty={q.trim() ? { title: t("noMatchTitle"), description: t("noMatchBody"), action: clearSearch } : { title: t(`empty.${resource}`), description: t("emptyBody") }}
      />
    );
  }

  const tables: Record<ArchiveResourceType, () => ReactNode> = {
    plans: () => table(plans, planColumns),
    features: () => table(features, featureColumns),
    categories: () => table(categories, categoryColumns),
    durations: () => table(durations, durationColumns),
    packages: () => table(packages, packageColumns),
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />

      <p className="flex items-start gap-2 rounded-field bg-sunken px-3 py-2 text-body-sm text-fg-muted">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {t("movingNote")}
      </p>

      <Tabs value={resource} onValueChange={(v) => set({ type: v as ArchiveResourceType, kind: "plan", q: "", page: 1 })}>
        <TabsList items={ARCHIVE_RESOURCES.map((r) => ({ value: r, label: t(`resource.${r}`) }))} />
        <TabsPanel value={resource} className="flex flex-col gap-4 pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Field label={t("searchLabel")} className="min-w-56 flex-1 sm:max-w-96">
              <Input type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("searchPlaceholder")} startIcon={<MagnifyingGlass />} />
            </Field>
            {resource === "durations" ? (
              <SegmentedControl
                label={t("kindLabel")}
                value={kind}
                onValueChange={(v) => set({ kind: v, page: 1 })}
                segments={[
                  { value: "plan", label: t("kindPlan") },
                  { value: "installment", label: t("kindInstallment") },
                ]}
              />
            ) : null}
          </div>
          {tables[resource]()}
        </TabsPanel>
      </Tabs>
    </section>
  );
}

export default function ArchivePage() {
  return (
    <Suspense fallback={<LoadingState rows={6} />}>
      <ArchiveView />
    </Suspense>
  );
}
