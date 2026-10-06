"use client";

// Activity logs (FS-FILES-6): who did what to which file or folder, filtered by person and by a
// period (the library's range picker, with its own labels: FILES-011's raw "Common.from"/"to" are
// gone), server-paged, with every state from the library.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "@phosphor-icons/react";
import { Button, Combobox, Field, ListStates, PageHeader, Pagination, type ListStatus } from "@orgtik/ui";
import { DateRangePicker, type DateRange } from "@orgtik/ui/dates";
import { useGetActivityLogsQuery } from "@/redux/features/activity/activityApi";
import { useGetUsersQuery } from "@/redux/features/users/usersApi";
import ActivityItem from "@/components/shared/ActivityItem";

// A period's days in the reader's time zone, as the instants the API filters on.
const startOf = (d: string) => new Date(`${d}T00:00:00`).toISOString();
const endOf = (d: string) => new Date(`${d}T23:59:59.999`).toISOString();

const ActivityLogs = () => {
  const t = useTranslations("Activity");
  const tc = useTranslations("Common");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [actorId, setActorId] = useState<string | null>(null);
  const [period, setPeriod] = useState<DateRange | null>(null);
  const { data, isLoading, isError, error, refetch } = useGetActivityLogsQuery({
    page,
    limit,
    actorId: actorId ?? undefined,
    from: period ? startOf(period.start) : undefined,
    to: period ? endOf(period.end) : undefined,
  });
  const { data: usersData } = useGetUsersQuery();
  const activities = data?.data?.items || [];
  const total = data?.data?.meta?.total ?? 0;
  const people = useMemo(() => (usersData?.data || []).map((u) => ({ value: String(u.id), label: `${u.firstName || ""} ${u.lastName || ""}`.trim() || String(u.id) })), [usersData]);
  const filtered = Boolean(actorId || period);
  const clear = () => (setActorId(null), setPeriod(null), setPage(1));
  const status: ListStatus = isLoading ? "loading" : isError ? ((error as { status?: number })?.status === 403 ? "forbidden" : "error") : activities.length === 0 ? "empty" : "ready";
  const empty = filtered
    ? { title: t("noMatch"), description: t("noMatchBody"), action: <Button size="sm" variant="secondary" startIcon={<X />} onClick={clear}>{t("clearFilters")}</Button> }
    : { title: t("empty"), description: t("emptyBody") };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("person")} className="w-full sm:w-64">
          <Combobox value={actorId} onValueChange={(v) => (setActorId(v), setPage(1))} options={people} placeholder={t("everyone")} emptyText={tc("noResultsFound")} />
        </Field>
        <Field label={t("period")} className="w-full sm:w-72">
          <DateRangePicker value={period} onChange={(v) => (setPeriod(v), setPage(1))} />
        </Field>
        {filtered ? (
          <Button variant="ghost" startIcon={<X />} onClick={clear}>
            {t("clearFilters")}
          </Button>
        ) : null}
      </div>
      <ListStates
        status={status}
        empty={empty}
        onRetry={refetch}
        loadingRows={3}
      >
        <ol aria-label={t("feed")}>
          {activities.map((activity, index) => (
            <ActivityItem key={activity.id} activity={activity} isLast={index === activities.length - 1} />
          ))}
        </ol>
        {total > limit ? (
          <Pagination
            page={page}
            pageSize={limit}
            total={total}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onPageSizeChange={(n) => (setLimit(n), setPage(1))}
          />
        ) : null}
      </ListStates>
    </div>
  );
};

export default ActivityLogs;
