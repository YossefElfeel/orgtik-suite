"use client";

// The posts list (FS-MKT-7) on the library's DataTable, paged by the server. Search, month,
// platforms, status, labels and the page are in the address, so a reload or a shared link keeps
// them. The month picker now filters (MKT-055): no month means any date, and the header says so.
// Every state has its own screen: loading, an error with Retry, no posts yet with the next step,
// and no match with a way to clear the filters (MKT-051). Search waits for the typing to stop.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { Button, PageHeader } from "@orgtik/ui";
import { DataTable, type PaginationState } from "@orgtik/ui/table";
import { usePathname, useRouter } from "@/i18n/routing";
import { ButtonLink } from "@/components/shared/ButtonLink";
import PostsFilter, { POST_PLATFORMS, POST_STATUSES } from "@/components/pages/posts/PostsFilter";
import { useMarketingRoles } from "@/lib/permissions";
import { dayInZone, useProjectContext } from "@/lib/project-context";
import { useGetPostsQuery } from "@/redux/features/posts/postsApi";
import type { IGetAllPostsParams } from "@/types/post";
import { usePostColumns } from "./columns";

const SIZES = [10];
const list = (v: string | null, allowed?: readonly string[]) => (v ? v.split(",").filter((x) => x && (!allowed || allowed.includes(x))) : []);

export default function PostsPage() {
  const t = useTranslations("Posts");
  const can = useMarketingRoles();
  const { timeZone } = useProjectContext();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = SIZES.includes(Number(params.get("size"))) ? Number(params.get("size")) : SIZES[0];
  const q = params.get("q") ?? "";
  const monthParam = params.get("month");
  const month = monthParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam) ? monthParam : null;
  const platforms = list(params.get("platforms"), POST_PLATFORMS);
  const statuses = list(params.get("status"), POST_STATUSES);
  const labels = list(params.get("labels"));
  const currentMonth = useMemo(() => dayInZone(new Date(), timeZone).slice(0, 7), [timeZone]);

  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  const go = (next: { page?: number; size?: number; q?: string; month?: string | null; platforms?: string[]; status?: string[]; labels?: string[] }) => {
    const sp = new URLSearchParams(params.toString());
    const set = (k: string, v: string | undefined | null) => (v ? sp.set(k, v) : sp.delete(k));
    if (next.q !== undefined) set("q", next.q.trim());
    if (next.month !== undefined) set("month", next.month);
    if (next.platforms !== undefined) set("platforms", next.platforms.join(","));
    if (next.status !== undefined) set("status", next.status.join(","));
    if (next.labels !== undefined) set("labels", next.labels.join(","));
    if (next.size !== undefined) set("size", next.size === SIZES[0] ? undefined : String(next.size));
    set("page", next.page && next.page > 1 ? String(next.page) : undefined);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    if (search.trim() === q) return;
    const id = setTimeout(() => go({ q: search }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const query: IGetAllPostsParams = {
    page,
    limit: pageSize,
    ...(q ? { search: q } : {}),
    ...(platforms.length ? { platforms } : {}),
    ...(statuses.length ? { uiStatuses: statuses } : {}),
    ...(labels.length ? { labelIds: labels } : {}),
    ...(month ? { year: Number(month.slice(0, 4)), month: Number(month.slice(5, 7)) } : {}),
  };
  const { data, isLoading, isError, error, refetch } = useGetPostsQuery(query);
  const items = data?.data?.items ?? [];
  const total = data?.data?.meta?.total ?? 0;
  const columns = usePostColumns();

  const filtered = Boolean(q || month || platforms.length || statuses.length || labels.length);
  const newPost = can.editPosts ? (
    <ButtonLink href="/posts/create-post" variant="primary">
      <Plus aria-hidden className="size-4" />
      {t("newPost")}
    </ButtonLink>
  ) : null;
  const pagination: PaginationState = { pageIndex: page - 1, pageSize };
  const status = isLoading ? "loading" : isError ? ((error as { status?: number })?.status === 403 ? "forbidden" : "error") : items.length ? "ready" : "empty";

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} actions={newPost} />
      <PostsFilter
        search={search}
        onSearchChange={setSearch}
        month={month}
        currentMonth={currentMonth}
        onMonthChange={(m) => go({ month: m })}
        platforms={platforms}
        onPlatformsChange={(v) => go({ platforms: v })}
        statuses={statuses}
        onStatusesChange={(v) => go({ status: v })}
        labels={labels}
        onLabelsChange={(v) => go({ labels: v })}
      />
      <DataTable
        label={t("tableLabel")}
        columns={columns}
        data={items}
        getRowId={(r) => r.id}
        mode="server"
        rowCount={total}
        pagination={pagination}
        onPaginationChange={(u) => {
          const next = typeof u === "function" ? u(pagination) : u;
          go({ page: next.pageIndex + 1, size: next.pageSize });
        }}
        pageSizes={SIZES}
        status={status}
        onRetry={() => refetch()}
        error={{ title: t("errorTitle"), description: t("errorBody") }}
        forbidden={{ title: t("forbiddenTitle"), description: t("forbiddenBody") }}
        empty={
          filtered
            ? {
                title: t("noMatchTitle"),
                description: t("noMatchBody"),
                action: (
                  <Button variant="secondary" onClick={() => go({ q: "", month: null, platforms: [], status: [], labels: [] })}>
                    {t("clearFilters")}
                  </Button>
                ),
              }
            : { title: t("emptyTitle"), description: can.editPosts ? t("emptyBody") : t("emptyBodyReader"), action: newPost ?? undefined }
        }
      />
    </section>
  );
}
