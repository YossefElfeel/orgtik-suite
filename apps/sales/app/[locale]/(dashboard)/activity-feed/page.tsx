"use client";

// The activity feed (FS-SAL-10): a timeline of what changed across customers, deals, offers and
// commissions. Admins and managers open it (the shell shows no-access to others).
// - The category, "show read", the page and its size are in the URL, so a filtered view can be
//   shared and survives a reload (they were component state).
// - Tab names come from the catalogs, not the API's English labels.
// - Loading, error with Retry, empty and "no match" states; a failed load used to read
//   "No notifications yet." (SAL-044).
// - Marking read changes the row in place and doesn't toast; a View as session marks nothing.
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Checks, Pulse } from "@phosphor-icons/react";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Pagination,
  Switch,
  Tabs,
  TabsList,
  TabsPanel,
} from "@orgtik/ui";
import { usePathname, useRouter } from "@/i18n/routing";
import { useRole } from "@/hooks/useRole";
import ActivityFeedList from "@/components/pages/activity-feed/ActivityFeedList";
import {
  useGetActivityFeedQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "@/redux/features/activity-feed/activityFeedApi";
import { useGetUnreadCountQuery } from "@/redux/features/notifications/notificationsApi";
import { ACTIVITY_CATEGORIES, type ActivityFeedCategory } from "@/types/activity-feed";

const SIZES = [10];

function ActivityFeed() {
  const t = useTranslations("SalesActivity");
  const { canEdit } = useRole();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawCategory = params.get("category");
  const category: ActivityFeedCategory = ACTIVITY_CATEGORIES.includes(rawCategory as ActivityFeedCategory) ? (rawCategory as ActivityFeedCategory) : "all";
  const includeRead = params.get("read") !== "hide";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const sizeParam = Number(params.get("size"));
  const limit = SIZES.includes(sizeParam) ? sizeParam : SIZES[0];

  const set = (next: { category?: ActivityFeedCategory; read?: boolean; page?: number; size?: number }) => {
    const sp = new URLSearchParams(params.toString());
    const put = (k: string, v: string | null) => (v ? sp.set(k, v) : sp.delete(k));
    if (next.category !== undefined) put("category", next.category === "all" ? null : next.category);
    if (next.read !== undefined) put("read", next.read ? null : "hide");
    if (next.size !== undefined) put("size", next.size === SIZES[0] ? null : String(next.size));
    if (next.page !== undefined) put("page", next.page > 1 ? String(next.page) : null);
    const qs = sp.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const feed = useGetActivityFeedQuery({ category, includeRead, page, limit });
  const unread = useGetUnreadCountQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAll, markingAll] = useMarkAllAsReadMutation();

  const data = feed.data?.data;
  const groups = data?.groups ?? [];
  const meta = data?.meta;
  const unreadCount = unread.data?.data?.count ?? 0;
  const filtered = category !== "all" || !includeRead;

  // Every category with something in it, plus the one that's open.
  const tabs = useMemo(() => {
    const counts = new Map((data?.tabs ?? []).map((tab) => [tab.category, tab.count]));
    return ACTIVITY_CATEGORIES.filter((c) => c === "all" || c === category || (counts.get(c) ?? 0) > 0).map((c) => ({
      value: c,
      label: t(`category.${c}`),
      count: counts.get(c),
    }));
  }, [category, data?.tabs, t]);

  const body = () => {
    if (feed.isLoading) return <LoadingState rows={5} label={t("loading")} />;
    if (feed.isError && !data) return <ErrorState title={t("loadError")} description={t("loadErrorBody")} onRetry={() => void feed.refetch()} />;
    if (!groups.length) {
      return filtered ? (
        <EmptyState
          title={t("noMatchTitle")}
          description={t("noMatchBody")}
          action={
            <Button variant="secondary" onClick={() => set({ category: "all", read: true, page: 1 })}>
              {t("showEverything")}
            </Button>
          }
        />
      ) : (
        <EmptyState icon={<Pulse />} title={t("emptyTitle")} description={t("emptyBody")} />
      );
    }
    return (
      <div aria-busy={feed.isFetching || undefined} className="flex flex-col gap-6">
        <ActivityFeedList groups={groups} onMarkRead={canEdit ? (id) => void markAsRead(id).unwrap().catch(() => undefined) : undefined} />
        {meta && meta.total > limit ? (
          <Pagination
            page={meta.page}
            pageSize={limit}
            total={meta.total}
            pageSizes={SIZES}
            onPageChange={(p) => set({ page: p })}
            onPageSizeChange={(s) => set({ size: s, page: 1 })}
          />
        ) : null}
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canEdit && unreadCount > 0 ? (
            <Button variant="secondary" startIcon={<Checks />} loading={markingAll.isLoading} onClick={() => void markAll().unwrap().catch(() => undefined)}>
              {t("markAllRead")}
            </Button>
          ) : undefined
        }
      />

      <Tabs value={category} onValueChange={(v) => set({ category: v as ActivityFeedCategory, page: 1 })}>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <TabsList items={tabs} className="min-w-0 flex-1" />
          <Switch checked={includeRead} onCheckedChange={(on) => set({ read: on, page: 1 })} label={t("showRead")} />
        </div>
        <TabsPanel value={category} className="pt-5">
          {body()}
        </TabsPanel>
      </Tabs>
    </section>
  );
}

export default function ActivityFeedPage() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <ActivityFeed />
    </Suspense>
  );
}
