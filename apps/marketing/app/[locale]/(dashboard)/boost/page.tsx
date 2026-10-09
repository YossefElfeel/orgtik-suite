"use client";

// Boosts (FS-MKT-9): every paid promotion in the project, newest first, with the platform, status,
// sort and page in the address. It was titled "Ad Executions" while the menu said Boosts (MKT-058),
// and with no project it ended on "No results." (MKT-051).
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, FilterChips, NoPermissionState, PageHeader, Select } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import { usePathname, useRouter } from "@/i18n/routing";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { PLATFORMS } from "@/components/shared/PlatformBadge";
import { useMarketingStatusLabel } from "@/components/shared/MarketingStatus";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useMarketingRoles } from "@/lib/permissions";
import { useGetAdExecutionsQuery } from "@/redux/features/boost/boostApi";
import { AdExecutionStatus, type AdExecutionSortBy, type AdExecutionSortOrder, type IGetAdExecutionsParams } from "@/types/boost";
import { useBoostColumns } from "./columns";

const SIZES = [10];
const PLATFORM_KEYS = ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "TIKTOK", "X", "YOUTUBE"];
const STATUSES = [AdExecutionStatus.QUEUED, AdExecutionStatus.ACTIVE, AdExecutionStatus.PAUSED, AdExecutionStatus.STOPPED, AdExecutionStatus.FAILED];
const SORTS: Record<string, [AdExecutionSortBy, AdExecutionSortOrder]> = {
  newest: ["createdAt", "DESC"],
  oldest: ["createdAt", "ASC"],
  started: ["startedAt", "DESC"],
  budget: ["budgetAmount", "DESC"],
};

export default function BoostsPage() {
  const t = useTranslations("Boost");
  const statusLabel = useMarketingStatusLabel();
  const can = useMarketingRoles();
  const { activeProjectId, isLoadingActiveProject } = useActiveProject();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const columns = useBoostColumns();

  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = SIZES.includes(Number(params.get("size"))) ? Number(params.get("size")) : SIZES[0];
  const platform = PLATFORM_KEYS.includes(params.get("platform") ?? "") ? params.get("platform")! : "all";
  const statuses = (params.get("status") ?? "").split(",").filter((s) => (STATUSES as string[]).includes(s));
  const sort = params.get("sort") && SORTS[params.get("sort")!] ? params.get("sort")! : "newest";
  const go = (next: { page?: number; size?: number; platform?: string; status?: string[]; sort?: string }) => {
    const sp = new URLSearchParams(params.toString());
    const set = (k: string, v: string | undefined) => (v ? sp.set(k, v) : sp.delete(k));
    if (next.platform !== undefined) set("platform", next.platform === "all" ? undefined : next.platform);
    if (next.status !== undefined) set("status", next.status.join(","));
    if (next.sort !== undefined) set("sort", next.sort === "newest" ? undefined : next.sort);
    if (next.size !== undefined) set("size", next.size === SIZES[0] ? undefined : String(next.size));
    set("page", next.page && next.page > 1 ? String(next.page) : undefined);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const [sortBy, sortOrder] = SORTS[sort];
  const query: IGetAdExecutionsParams = {
    page,
    limit: pageSize,
    projectId: activeProjectId,
    sortBy,
    sortOrder,
    ...(platform !== "all" ? { platforms: [platform] } : {}),
    ...(statuses.length ? { statuses: statuses as AdExecutionStatus[] } : {}),
  };
  const { data, isLoading, isError, error, refetch } = useGetAdExecutionsQuery(query, { skip: !activeProjectId || !can.boost });
  const items = data?.data?.items ?? [];
  const pagination: PaginationState = { pageIndex: page - 1, pageSize };

  if (!can.boost) {
    return (
      <NoPermissionState
        size="page"
        titleAs="h1"
        title={t("noAccessTitle")}
        description={can.readOnlySession ? t("noAccessReadOnly") : t("noAccessBody")}
        action={<ButtonLink href="/posts" variant="secondary">{t("toPosts")}</ButtonLink>}
      />
    );
  }

  const filtered = platform !== "all" || statuses.length > 0;
  const status = isLoading || isLoadingActiveProject ? "loading" : !activeProjectId ? "empty" : isError ? ((error as { status?: number })?.status === 403 ? "forbidden" : "error") : items.length ? "ready" : "empty";

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("listTitle")} description={t("listDescription")} />
      <div className="flex flex-col gap-3 rounded-card border border-line bg-raised p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Select
            aria-label={t("platformFilter")}
            value={platform}
            onValueChange={(v) => go({ platform: v ?? "all" })}
            options={[{ value: "all", label: t("allPlatforms") }, ...PLATFORM_KEYS.map((k) => ({ value: k, label: PLATFORMS[k].name }))]}
            className="md:w-56"
          />
          <Select
            aria-label={t("sortLabel")}
            value={sort}
            onValueChange={(v) => go({ sort: v ?? "newest" })}
            options={Object.keys(SORTS).map((k) => ({ value: k, label: t(`sort_${k}`) }))}
            className="md:ms-auto md:w-56"
          />
        </div>
        <FilterChips label={t("statusFilter")} chips={STATUSES.map((s) => ({ value: s, label: statusLabel("boost", s) }))} value={statuses} onValueChange={(v) => go({ status: v })} />
      </div>
      <DataTable
        label={t("listTitle")}
        columns={columns}
        data={items}
        getRowId={(r) => r.id}
        mode="server"
        rowCount={data?.data?.meta?.total ?? 0}
        pagination={pagination}
        onPaginationChange={(u) => {
          const next = typeof u === "function" ? u(pagination) : u;
          go({ page: next.pageIndex + 1, size: next.pageSize });
        }}
        pageSizes={SIZES}
        status={status}
        onRetry={() => refetch()}
        error={{ title: t("errorTitle"), description: t("errorBody") }}
        forbidden={{ title: t("noAccessTitle"), description: t("noAccessBody") }}
        empty={
          !activeProjectId
            ? { title: t("noProjectTitle"), description: t("noProjectBody") }
            : filtered
              ? {
                  title: t("noMatchTitle"),
                  description: t("noMatchBody"),
                  action: (
                    <Button variant="secondary" onClick={() => go({ platform: "all", status: [] })}>
                      {t("clearFilters")}
                    </Button>
                  ),
                }
              : {
                  title: t("emptyTitle"),
                  description: t("emptyBody"),
                  action: (
                    <ButtonLink href="/posts?status=PUBLISHED" variant="secondary">
                      {t("openPublished")}
                    </ButtonLink>
                  ),
                }
        }
      />
    </section>
  );
}
