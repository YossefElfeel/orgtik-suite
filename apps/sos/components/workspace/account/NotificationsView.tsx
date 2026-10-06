"use client";
// Notifications (USR-24, spec 05): the person's own in this workspace, newest first and grouped by
// day, all or unread only (in the address). Mark one or all read; `me` is refetched, so the
// sidebar's count follows at once.
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, Briefcase, Checks, Check, CreditCard, Hourglass, Tag as TagIcon } from "@phosphor-icons/react";
import { Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, SegmentedControl, toast, useFormatter } from "@orgtik/ui";
import { cn } from "@orgtik/ui";
import useWorkspace from "@/hooks/use-workspace";
import { useGetNotificationsQuery, useMarkNotificationsReadMutation, type AppNotification } from "@/redux/features/platform/account";
import { usePlatformProblem } from "./problems";
import { Notice } from "./Notice";

const ICONS: Record<string, React.ReactNode> = {
  trial_ending: <Hourglass />,
  payment_failed: <CreditCard />,
  price_change: <TagIcon />,
  service_update: <Briefcase />,
};
// Where each kind is acted on; billing pages are the owner's.
const TARGET: Record<string, { href: string; owner?: boolean }> = {
  trial_ending: { href: "/tools" },
  payment_failed: { href: "/billing", owner: true },
  price_change: { href: "/billing", owner: true },
  service_update: { href: "/services/requests" },
};

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export function NotificationsView() {
  const t = useTranslations("Account.notifications");
  const f = useFormatter();
  const ws = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const show = params.get("show") === "unread" ? "unread" : "all";
  const problem = usePlatformProblem();
  const { data, isLoading, isError, refetch } = useGetNotificationsQuery({});
  const [mark, { isLoading: marking }] = useMarkNotificationsReadMutation();
  const [failed, setFailed] = useState<string | null>(null);

  const items = useMemo(() => (data?.items ?? []).filter((n) => show === "all" || !n.read), [data, show]);
  const unread = (data?.items ?? []).filter((n) => !n.read).length;
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: AppNotification[] }[] = [];
    const today = dayKey(new Date().toISOString());
    const yesterday = dayKey(new Date(Date.now() - 86400000).toISOString());
    for (const n of items) {
      const k = dayKey(n.at);
      let g = out.find((x) => x.key === k);
      if (!g) {
        g = { key: k, label: k === today ? t("today") : k === yesterday ? t("yesterday") : f.date(n.at, { dateStyle: "full" }), items: [] };
        out.push(g);
      }
      g.items.push(n);
    }
    return out;
  }, [items, t, f]);

  const markRead = async (ids?: string[]) => {
    setFailed(null);
    try {
      await mark(ids ? { ids } : {}).unwrap();
      if (!ids) toast.success(t("allMarked"));
    } catch (e) {
      setFailed(problem(e));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={unread ? t("unreadCount", { count: unread }) : t("allRead")}
        actions={
          unread ? (
            <Button variant="secondary" startIcon={<Checks />} loading={marking} onClick={() => markRead()}>
              {t("markAll")}
            </Button>
          ) : null
        }
      />
      <SegmentedControl
        label={t("filter")}
        value={show}
        onValueChange={(v) => router.replace(v === "unread" ? `${pathname}?show=unread` : pathname, { scroll: false })}
        segments={[
          { value: "all", label: t("all") },
          { value: "unread", label: t("unread") },
        ]}
      />
      {failed ? <Notice tone="danger">{failed}</Notice> : null}
      {isLoading ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState title={t("failedTitle")} description={t("failedBody")} onRetry={refetch} />
      ) : !items.length ? (
        <EmptyState
          icon={<Bell />}
          title={show === "unread" ? t("noUnreadTitle") : t("emptyTitle")}
          description={show === "unread" ? t("noUnreadBody") : t("emptyBody")}
          action={
            show === "unread" ? (
              <Button variant="secondary" onClick={() => router.replace(pathname, { scroll: false })}>
                {t("showAll")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.key} aria-labelledby={`day-${g.key}`} className="flex flex-col gap-2">
              <h2 id={`day-${g.key}`} className="text-label text-fg-muted">
                {g.label}
              </h2>
              <Card padding="none">
                <ul className="divide-y divide-line">
                  {g.items.map((n) => {
                    const target = TARGET[n.kind];
                    const href = target && (!target.owner || ws.isOwner) ? target.href : null;
                    return (
                      <li key={n.id} className={cn("flex flex-wrap items-center gap-3 px-4 py-3", !n.read && "bg-brand-subtle")}>
                        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-sunken text-fg-muted">
                          {ICONS[n.kind] ?? <Bell />}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="flex items-center gap-2">
                            {!n.read ? <span className="sr-only">{t("unreadMark")}</span> : null}
                            {!n.read ? <span aria-hidden="true" className="size-2 shrink-0 rounded-pill bg-action-brand" /> : null}
                            {href ? (
                              <Link href={href} dir="auto" className={cn("break-words text-body text-fg underline-offset-2 hover:underline", !n.read && "font-semibold")} onClick={() => !n.read && markRead([n.id])}>
                                {n.title}
                              </Link>
                            ) : (
                              <span dir="auto" className={cn("break-words text-body text-fg", !n.read && "font-semibold")}>
                                {n.title}
                              </span>
                            )}
                          </p>
                          <time dateTime={n.at} className="text-caption text-fg-muted">
                            {f.date(n.at, { timeStyle: "short" })}
                          </time>
                        </div>
                        {!n.read ? (
                          <Button size="sm" variant="ghost" startIcon={<Check />} onClick={() => markRead([n.id])}>
                            {t("markOne")}
                            <span className="sr-only">
                              : <span dir="auto">{n.title}</span>
                            </span>
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
