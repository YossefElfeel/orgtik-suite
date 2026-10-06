"use client";

// Notifications (FS-TASKS-12): filters in the address, grouped by day in the reader's language,
// and "Mark all as read" instead of a "Delete All" that only hid them, in English (TASKS-059). The
// date range is sent as the days picked (the old filter shifted a day in UTC+ zones, TASKS-051).
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Checks, BellSimple } from "@phosphor-icons/react";
import { Button, ListStates, PageHeader, SegmentedControl, Select, toast, useFormatter } from "@orgtik/ui";
import { DateRangePicker } from "@orgtik/ui/dates";
import { usePathname, useRouter } from "@/i18n/routing";
import { NotificationItem } from "@/components/shared/NotificationItem";
import { useGetAllNotificationsQuery, useMarkReadnotificationsMutation } from "@/redux/features/notifications/notificationsApi";
import type { NotificationLike } from "@/lib/notifications";

type Status = "all" | "unread" | "read" | "cleared";
type Group = "all" | "mentions" | "assigned";
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export default function NotificationsPage() {
  const t = useTranslations("Notifications");
  const f = useFormatter();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = (["unread", "read", "cleared"].includes(params.get("status") ?? "") ? params.get("status") : "all") as Status;
  const group = (["mentions", "assigned"].includes(params.get("group") ?? "") ? params.get("group") : "all") as Group;
  const from = DAY.test(params.get("from") ?? "") ? params.get("from")! : null;
  const to = DAY.test(params.get("to") ?? "") ? params.get("to")! : null;
  const go = (next: Partial<{ status: Status; group: Group; from: string | null; to: string | null }>) => {
    const sp = new URLSearchParams(params.toString());
    const set = (k: string, v: string | null | undefined, empty: string | null = null) => (v && v !== empty ? sp.set(k, v) : sp.delete(k));
    if ("status" in next) set("status", next.status, "all");
    if ("group" in next) set("group", next.group, "all");
    if ("from" in next) set("from", next.from);
    if ("to" in next) set("to", next.to);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`);
  };

  const { data, isLoading, isError, refetch } = useGetAllNotificationsQuery({
    ...(status === "all" ? {} : { status }),
    ...(group === "all" ? {} : { group }),
    ...(from ? { startDate: from } : {}),
    ...(to ? { endDate: to } : {}),
  });
  const [markRead, marking] = useMarkReadnotificationsMutation();
  const groups = data?.data?.groupedNotifications ?? [];
  const unread = groups.flatMap((g) => g.notifications).filter((n) => !n.readAt && !n.clearedAt).length;
  const filtered = status !== "all" || group !== "all" || Boolean(from || to);
  const dayLabel = (key: string) => (DAY.test(key) ? f.date(`${key}T00:00:00Z`, { dateStyle: "full", timeZone: "UTC" }) : key);

  const markAll = async () => {
    await markRead({ notificationIds: [] }).unwrap();
    toast.success(t("allRead"));
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button variant="secondary" startIcon={<Checks />} onClick={markAll} loading={marking.isLoading} disabled={!unread}>
            {t("markAllRead")}
          </Button>
        }
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl<Status>
          label={t("status")}
          value={status}
          onValueChange={(v) => go({ status: v })}
          segments={[
            { value: "all", label: t("statuses.all") },
            { value: "unread", label: t("statuses.unread") },
            { value: "read", label: t("statuses.read") },
            { value: "cleared", label: t("statuses.cleared") },
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="sm:w-48">
            <Select<Group>
              aria-label={t("group")}
              value={group}
              onValueChange={(v) => v && go({ group: v })}
              options={[
                { value: "all", label: t("groups.all") },
                { value: "mentions", label: t("groups.mentions") },
                { value: "assigned", label: t("groups.assigned") },
              ]}
            />
          </div>
          <DateRangePicker aria-label={t("period")} placeholder={t("anyDate")} value={from && to ? { start: from, end: to } : null} onChange={(r) => go({ from: r.start, to: r.end })} />
          {from || to ? (
            <Button variant="ghost" onClick={() => go({ from: null, to: null })}>
              {t("anyDate")}
            </Button>
          ) : null}
        </div>
      </div>
      <ListStates
        status={isLoading ? "loading" : isError ? "error" : groups.length ? "ready" : "empty"}
        onRetry={() => refetch()}
        empty={
          filtered
            ? {
                icon: <BellSimple weight="duotone" />,
                title: t("noMatchTitle"),
                action: (
                  <Button variant="secondary" onClick={() => go({ status: "all", group: "all", from: null, to: null })}>
                    {t("clearFilters")}
                  </Button>
                ),
              }
            : { icon: <BellSimple weight="duotone" />, title: t("emptyTitle"), description: t("emptyBody") }
        }
      >
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.date} aria-labelledby={`n-${g.date}`} className="flex flex-col gap-2">
              <h2 id={`n-${g.date}`} className="text-label text-fg-muted">
                {dayLabel(g.date)}
              </h2>
              <ul className="flex flex-col gap-2">
                {g.notifications.map((n) => (
                  <li key={n.id}>
                    <NotificationItem n={n as unknown as NotificationLike} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </ListStates>
    </section>
  );
}
