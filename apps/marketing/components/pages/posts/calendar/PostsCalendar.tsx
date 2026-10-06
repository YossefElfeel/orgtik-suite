"use client";

// The calendar (FS-MKT-8, MKT-015): posts on the day they go out, read in the project's time zone,
// on the library's CalendarGrid (arrow keys, the week starting where the reader's language starts
// it, mirrored in Arabic). Each chip leads with the time and the platform and opens the post; a day
// opens its agenda in a sheet. The page was a 2000px debug block, and the finished calendar beside
// it was never used.
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { parseDate, startOfMonth, today, type CalendarDate } from "@internationalized/date";
import { Plus } from "@phosphor-icons/react";
import { DialogTitle, EmptyState, PageHeader, SegmentedControl, Sheet, SheetContent, useFormatter, type Tone } from "@orgtik/ui";
import { CalendarGrid } from "@orgtik/ui/dates";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { PlatformIcon, platformMeta } from "@/components/shared/PlatformBadge";
import { useMarketingRoles } from "@/lib/permissions";
import { dayInZone, useProjectContext } from "@/lib/project-context";
import { useGetPostsQuery } from "@/redux/features/posts/postsApi";
import type { IPostListItem } from "@/types/post";
import { PostStatusBadge } from "../shared/PostStatusBadge";
import { zoneName } from "../shared/zone";
import { useListFormat } from "../shared/useList";

type Event = { id: string; title: string; start: string; tone?: Tone; at: string; post: IPostListItem };

const TONE: Record<string, Tone> = { DRAFT: "neutral", PENDING_APPROVAL: "warning", APPROVED: "info", SCHEDULED: "info", PUBLISHED: "success", SYNCED: "success", FAILED: "danger" };

/** The months to ask for: the one shown and its neighbours, whose days show at the grid's edges. */
const monthsAround = (d: CalendarDate) => [-1, 0, 1].map((n) => startOfMonth(d).add({ months: n }));

export function PostsCalendar() {
  const t = useTranslations("PostCalendar");
  const f = useFormatter();
  const locale = useLocale();
  const can = useMarketingRoles();
  const list = useListFormat();
  const { timeZone } = useProjectContext();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const now = today(timeZone);
  const view = params.get("view") === "week" ? "week" : "month";
  const month: CalendarDate = useMemo(() => {
    const raw = params.get("date");
    try {
      return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? parseDate(raw) : now;
    } catch {
      return now;
    }
  }, [params, now]);
  const set = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) (v ? sp.set(k, v) : sp.delete(k));
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };
  const [day, setDay] = useState<CalendarDate | null>(null);

  const [m0, m1, m2] = monthsAround(month);
  const q = (m: CalendarDate) => ({ page: 1, limit: 200, year: m.year, month: m.month });
  const a = useGetPostsQuery(q(m0));
  const b = useGetPostsQuery(q(m1));
  const c = useGetPostsQuery(q(m2));
  const loading = a.isLoading || b.isLoading || c.isLoading;
  const failed = a.isError || b.isError || c.isError;

  const events = useMemo<Event[]>(() => {
    const seen = new Map<string, IPostListItem>();
    for (const r of [a.data, b.data, c.data]) for (const p of r?.data?.items ?? []) seen.set(p.id, p);
    const out: Event[] = [];
    for (const p of seen.values()) {
      const at = p.publishedAt || p.effectiveScheduledAt;
      if (!at) continue;
      const time = f.date(at, { timeStyle: "short", timeZone });
      const platforms = list(p.platforms.map((x) => platformMeta(x.platform).name));
      out.push({ id: p.id, at, post: p, start: dayInZone(at, timeZone), tone: TONE[p.status] ?? "neutral", title: `${time} · ${platforms} · ${p.postTitle || t("untitled")}` });
    }
    return out.sort((x, y) => x.at.localeCompare(y.at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.data, b.data, c.data, f, timeZone, t]);

  const dayEvents = day ? events.filter((e) => e.start === day.toString()) : [];
  const newPost = can.editPosts ? (
    <ButtonLink href="/posts/create-post" variant="primary">
      <Plus aria-hidden className="size-4" />
      {t("newPost")}
    </ButtonLink>
  ) : null;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description", { zone: zoneName(timeZone, locale) })} actions={newPost} />
      <SegmentedControl<"month" | "week">
        label={t("view")}
        value={view}
        onValueChange={(v) => set({ view: v === "month" ? null : v })}
        segments={[
          { value: "month", label: t("month") },
          { value: "week", label: t("week") },
        ]}
      />
      <CalendarGrid<Event>
        view={view}
        month={month}
        today={now}
        timeZone={timeZone}
        onMonthChange={(d) => set({ date: d.compare(now) === 0 ? null : d.toString() })}
        events={events}
        status={loading ? "loading" : failed ? "error" : "ready"}
        onRetry={() => {
          void a.refetch();
          void b.refetch();
          void c.refetch();
        }}
        onSelectDay={setDay}
        onOpenEvent={(e) => router.push(`/posts/${e.id}`)}
        renderEvent={(e) => (
          <span className="flex min-w-0 items-center gap-1">
            <time dateTime={e.at} className="shrink-0 font-semibold tabular-nums">
              {f.date(e.at, { timeStyle: "short", timeZone })}
            </time>
            {e.post.platforms[0] ? <PlatformIcon platform={e.post.platforms[0].platform} className="size-3.5" /> : null}
            {e.post.platforms.length > 1 ? <span className="shrink-0 tabular-nums">+{e.post.platforms.length - 1}</span> : null}
            <span dir="auto" className="truncate">
              {e.post.postTitle || t("untitled")}
            </span>
          </span>
        )}
      />

      <Sheet open={Boolean(day)} onOpenChange={(open) => !open && setDay(null)}>
        <SheetContent side="end" className="flex flex-col gap-4 overflow-y-auto p-6">
          {day ? (
            <>
              <DialogTitle className="pe-10 font-display text-title text-fg">{f.date(`${day.toString()}T12:00:00Z`, { dateStyle: "full", timeZone: "UTC" })}</DialogTitle>
              <p className="text-body-sm text-fg-muted">{t("dayCount", { count: dayEvents.length })}</p>
              {dayEvents.length ? (
                <ol className="flex flex-col gap-2">
                  {dayEvents.map((e) => (
                    <li key={e.id} className="flex flex-col gap-1.5 rounded-card border border-line bg-raised p-3">
                      <div className="flex items-center gap-2">
                        <time dateTime={e.at} className="text-body-sm font-semibold tabular-nums text-fg">
                          {f.date(e.at, { timeStyle: "short", timeZone })}
                        </time>
                        <span className="flex items-center gap-1">
                          {e.post.platforms.map((x) => (
                            <PlatformIcon key={x.id} platform={x.platform} label={platformMeta(x.platform).name} className="size-4 text-fg-muted" />
                          ))}
                        </span>
                        <span className="ms-auto">
                          <PostStatusBadge value={e.post.status} />
                        </span>
                      </div>
                      <Link href={`/posts/${e.id}`} dir="auto" className="text-body font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                        {e.post.postTitle || t("untitled")}
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState size="compact" title={t("emptyDay")} description={can.editPosts ? t("emptyDayBody") : t("emptyDayReader")} action={newPost ?? undefined} />
              )}
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}
