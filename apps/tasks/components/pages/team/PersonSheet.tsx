"use client";

// A team member's work (FS-TASKS-11): who they are, what they did, what's on their plate and what
// they said, in a sheet opened from the team's People tab. Rebuilt on the library: a named trigger,
// Tabs, the reader's language for every label and date, and the states each list needs.
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Eye } from "@phosphor-icons/react";
import {
  Avatar,
  Button,
  DialogTitle,
  EmptyState,
  ErrorState,
  ListStates,
  LoadingState,
  Pagination,
  Progress,
  SegmentedControl,
  Sheet,
  SheetContent,
  SheetTrigger,
  Tabs,
  TabsList,
  TabsPanel,
  useFormatter,
} from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import TaskActivityCard from "@/components/shared/TaskActivityCard";
import PriorityBadge from "@/components/shared/PriorityBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import { useGetUserCommentsQuery, useGetUserQuery, useGetUserTaskActivityQuery, useGetUserWorkQuery } from "@/redux/features/users/usersApi";
import { dueDay } from "@/lib/dates";
import { timeAgo } from "@/lib/relative";
import { isolate } from "@/lib/bidi";
import type { ITaskActivity } from "@/types";

const PERIODS = ["all", "7d", "1m"] as const;

function ActivityTab({ userId }: { userId: number }) {
  const t = useTranslations("PersonSheet");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("7d");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useGetUserTaskActivityQuery({ id: userId, duration: period, page, limit: 6 });
  const list = Object.values(data?.data?.tasks ?? {}).flat() as ITaskActivity[];
  const meta = data?.data?.meta;
  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        label={t("period")}
        size="sm"
        value={period}
        onValueChange={(v) => {
          setPeriod(v);
          setPage(1);
        }}
        segments={PERIODS.map((p) => ({ value: p, label: t(`periods.${p}`) }))}
      />
      <ListStates status={isLoading ? "loading" : isError ? "error" : list.length ? "ready" : "empty"} onRetry={() => refetch()} empty={{ title: t("noActivity") }} size="compact">
        <ul className="flex flex-col gap-3">
          {list.map((a) => (
            <li key={a.id}>
              <TaskActivityCard TaskActivity={a} />
            </li>
          ))}
        </ul>
        {meta && meta.totalPages > 1 ? <Pagination page={meta.page} pageSize={meta.limit} total={meta.total} onPageChange={setPage} /> : null}
      </ListStates>
    </div>
  );
}

function WorkTab({ userId }: { userId: number }) {
  const t = useTranslations("PersonSheet");
  const f = useFormatter();
  const { data, isLoading, isError, refetch } = useGetUserWorkQuery({ id: userId, sectionFlags: "" });
  const groups = ((data?.data?.groups ?? []) as { key?: string; groupName: string; tasks: { id: number; title: string; progress: number; dueDate: string | null; projectName: string; projectId?: number; priority?: "low"; status?: string }[] }[]).filter((g) => g.tasks.length);
  if (isLoading) return <LoadingState rows={4} />;
  if (isError) return <ErrorState size="compact" title={t("errorTitle")} onRetry={() => refetch()} />;
  if (!groups.length) return <EmptyState size="compact" title={t("noWork")} />;
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <section key={g.key ?? g.groupName} aria-labelledby={`work-${g.key}`} className="flex flex-col gap-2">
          <h3 id={`work-${g.key}`} className="text-label text-fg-muted">
            {g.key ? t(`groups.${g.key}`, { count: g.tasks.length }) : g.groupName}
          </h3>
          <ul className="flex flex-col gap-2">
            {g.tasks.map((task) => (
              <li key={task.id} className="flex flex-col gap-2 rounded-card border border-line bg-raised p-3">
                <div className="flex items-start justify-between gap-2">
                  {task.projectId ? (
                    <Link href={`/projects/${task.projectId}/board?task-id=${task.id}`} dir="auto" className="font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                      {task.title}
                    </Link>
                  ) : (
                    <span dir="auto" className="font-semibold text-fg">
                      {task.title}
                    </span>
                  )}
                  {task.priority ? <PriorityBadge priority={task.priority} size="sm" /> : null}
                </div>
                <span className="flex flex-wrap items-center gap-2 text-caption text-fg-muted">
                  <span dir="auto">{task.projectName}</span>
                  {task.dueDate ? <span>· {t("dueOn", { date: f.date(dueDay(task.dueDate), { dateStyle: "medium", timeZone: "UTC" }) })}</span> : null}
                  {task.status ? <StatusBadge status={task.status as "todo"} size="sm" /> : null}
                </span>
                <Progress value={Math.round(task.progress ?? 0)} label={t("progress")} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function CommentsTab({ userId }: { userId: number }) {
  const t = useTranslations("PersonSheet");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useGetUserCommentsQuery({ id: userId, page, limit: 8 });
  const items = (data?.data?.items ?? []) as unknown as { id: number; content: string; createdAt?: string; task: { id: number; title: string }; project?: { id: number }; projectId?: number }[];
  const meta = data?.data?.meta;
  return (
    <ListStates status={isLoading ? "loading" : isError ? "error" : items.length ? "ready" : "empty"} onRetry={() => refetch()} empty={{ title: t("noComments") }} size="compact">
      <ul className="flex flex-col gap-3">
        {items.map((c) => (
          <li key={c.id} className="flex flex-col gap-1 rounded-card border border-line bg-raised p-3">
            <span className="text-caption text-fg-muted">{t("onTask", { task: isolate(c.task?.title) })}</span>
            <p dir="auto" className="whitespace-pre-wrap text-body-sm text-fg">
              {c.content.replace(/@\[(\d+)\]/g, "@…")}
            </p>
            {c.createdAt ? (
              <time dateTime={c.createdAt} className="text-caption text-fg-subtle">
                {timeAgo(c.createdAt, locale)}
              </time>
            ) : null}
          </li>
        ))}
      </ul>
      {meta && meta.totalPages > 1 ? <Pagination page={meta.page} pageSize={meta.limit} total={meta.total} onPageChange={setPage} /> : null}
    </ListStates>
  );
}

export default function PersonSheet({ userId, name }: { userId: number; name: string }) {
  const t = useTranslations("PersonSheet");
  const [open, setOpen] = useState(false);
  const { data } = useGetUserQuery(userId, { skip: !open });
  const u = data?.data as unknown as { firstName?: string; lastName?: string; avatar?: string | null; email?: string; profile?: { jobTitle?: string; department?: string; timezone?: string } } | undefined;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="sm" startIcon={<Eye />} aria-label={t("openFor", { name: isolate(name) })} />}>{t("open")}</SheetTrigger>
      <SheetContent side="end" className="[--sheet-width:40rem]">
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6 pe-14">
          <header className="flex items-center gap-3">
            <Avatar name={name} src={u?.avatar || undefined} size="lg" decorative />
            <div className="flex min-w-0 flex-col">
              <DialogTitle className="text-body-lg font-semibold text-fg">
                <span dir="auto">{name}</span>
              </DialogTitle>
              {u?.profile?.jobTitle ? (
                <span dir="auto" className="text-body-sm text-fg-muted">
                  {u.profile.jobTitle}
                  {u.profile.department ? ` · ${u.profile.department}` : ""}
                </span>
              ) : null}
              {u?.email ? (
                <bdi dir="ltr" className="text-caption text-fg-subtle">
                  {u.email}
                </bdi>
              ) : null}
            </div>
          </header>
          <Tabs defaultValue="work">
            <TabsList
              items={[
                { value: "work", label: t("tabs.work") },
                { value: "activity", label: t("tabs.activity") },
                { value: "comments", label: t("tabs.comments") },
              ]}
            />
            <TabsPanel value="work" className="pt-4">
              <WorkTab userId={userId} />
            </TabsPanel>
            <TabsPanel value="activity" className="pt-4">
              <ActivityTab userId={userId} />
            </TabsPanel>
            <TabsPanel value="comments" className="pt-4">
              <CommentsTab userId={userId} />
            </TabsPanel>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
