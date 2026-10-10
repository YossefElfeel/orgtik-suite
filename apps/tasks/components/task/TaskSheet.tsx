"use client";

// One task sheet for the whole project (FS-TASKS-6), opened by ?task-id= on any of its views. The
// old board mounted a sheet and a form inside every card (TASKS-067), opened a task only if its card
// happened to be on screen (TASKS-033), stacked an edit sheet on top, and froze the board after a
// delete (TASKS-009). Now the sheet loads the task by id, says when it no longer exists or can't be
// seen, edits in a dialog of its own, and after a delete closes and leaves the board as it was.
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, Link as LinkIcon, PencilSimple, Trash } from "@phosphor-icons/react";
import {
  Button,
  ConfirmDialog,
  DialogTitle,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  NoPermissionState,
  Sheet,
  SheetContent,
  Tabs,
  TabsList,
  TabsPanel,
  toast,
  useFormatter,
  useStatusLabel,
} from "@orgtik/ui";
import { usePathname, useRouter } from "@/i18n/routing";
import PriorityBadge from "@/components/shared/PriorityBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import { AvatarStack } from "@/components/shared/AvatarStack";
import TaskFormDialog from "@/components/task/TaskFormDialog";
import { RichText } from "@/components/task/RichText";
import { TaskAttachments, type Attachment } from "@/components/task/TaskAttachments";
import { SubtasksPanel } from "@/components/task/SubtasksPanel";
import { CommentsPanel } from "@/components/task/CommentsPanel";
import { ActivityPanel } from "@/components/task/ActivityPanel";
import { useDeleteTaskMutation, useGetTaskQuery, useMoveTaskMutation } from "@/redux/features/task/taskApi";
import { useGetProjectDetailsQuery } from "@/redux/features/projects/projectsApi";
import { useTaskRoles } from "@/lib/permissions";
import { daysUntil, dueDay } from "@/lib/dates";
import { isolate } from "@/lib/bidi";
import type { IProjectMember } from "@/types/projects";
import { sectionTitle } from "@/lib/sections";
import { TaskOptions } from "./TaskOptions";
import type { TaskMetadata } from "@/redux/features/task/v3Api";

type FullTask = Partial<TaskMetadata> & {
  id: number;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: string;
  dueDate: string | null;
  startDate: string | null;
  projectId: number;
  sectionId: number;
  subtasksCount: number;
  commentsCount: number;
  canComplete: boolean;
  section: { id: number; title: string; flag: string };
  project: { id: number; title: string };
  members: { id: number; firstName?: string; lastName?: string; avatar?: string | null }[];
  attachments: Attachment[];
  dependencies?: { dependsOn: { id: number; title: string; status: string }[] };
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] items-start gap-3 py-1.5">
      <dt className="text-body-sm text-fg-muted">{label}</dt>
      <dd className="min-w-0 text-body-sm text-fg">{children}</dd>
    </div>
  );
}

function TaskView({ id, projectId, onClose }: { id: number; projectId: number; onClose: () => void }) {
  const t = useTranslations("TaskSheet");
  const statusLabel = useStatusLabel();
  const f = useFormatter();
  const roles = useTaskRoles();
  const { data, isLoading, isError, error, refetch } = useGetTaskQuery(id);
  const details = useGetProjectDetailsQuery({ projectId }, { skip: !projectId });
  const [del] = useDeleteTaskMutation();
  const [move] = useMoveTaskMutation();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const status = (error as { status?: number } | undefined)?.status;

  if (isLoading) return <LoadingState rows={6} />;
  if (status === 404) return <EmptyState size="page" titleAs="h2" title={t("goneTitle")} description={t("goneBody")} action={<Button onClick={onClose}>{t("close")}</Button>} />;
  if (status === 403) return <NoPermissionState size="page" titleAs="h2" title={t("noAccessTitle")} description={t("noAccessBody")} action={<Button onClick={onClose}>{t("close")}</Button>} />;
  if (isError || !data?.data) return <ErrorState size="page" titleAs="h2" title={t("errorTitle")} description={t("errorBody")} onRetry={() => refetch()} />;

  const task = data.data as unknown as FullTask;
  const archived = Boolean((details.data?.data as unknown as { archivedAt?: string })?.archivedAt);
  const canEdit = roles.canEdit && !archived, isManager = roles.isManager && !archived;
  // A task belongs to one project: a link to it from another project's page shows nothing.
  if (task.projectId !== projectId) return <EmptyState size="page" titleAs="h2" title={t("goneTitle")} description={t("goneBody")} action={<Button onClick={onClose}>{t("close")}</Button>} />;
  const members = ((details.data?.data as { members?: IProjectMember[] } | undefined)?.members ?? []) as unknown as { id: number; firstName?: string; lastName?: string }[];
  const done = task.status === "done";
  const left = task.dueDate ? daysUntil(task.dueDate) : null;
  const doneSection = (details.data?.data?.sections ?? []).find((s) => s.section.flag === "done");
  const day = (v: string) => f.date(dueDay(v), { dateStyle: "full", timeZone: "UTC" });

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success(t("linkCopied"));
  };
  const complete = async () => {
    if (!doneSection) return;
    await move({ taskId: task.id, sectionId: doneSection.section.id, order: doneSection.tasks.length + 1 }).unwrap();
    toast.success(t("completed", { name: isolate(task.title) }));
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p className="text-caption text-fg-muted">
          <span dir="auto">{task.project.title}</span> · <span dir="auto">{sectionTitle(task.section.title, statusLabel)}</span>
        </p>
        <DialogTitle className="text-title font-semibold text-fg">
          <span dir="auto">{task.title}</span>
        </DialogTitle>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && !done && doneSection ? (
            <Button variant="primary" size="sm" startIcon={<CheckCircle />} onClick={complete} disabled={!task.canComplete} title={task.canComplete ? undefined : t("waitingOnOthers")}>
              {t("complete")}
            </Button>
          ) : null}
          {canEdit ? (
            <Button variant="secondary" size="sm" startIcon={<PencilSimple />} onClick={() => setEditing(true)}>
              {t("edit")}
            </Button>
          ) : null}
          <IconButton label={t("copyLink")} icon={<LinkIcon />} variant="ghost" size="sm" onClick={copyLink} />
          {isManager ? <IconButton label={t("delete")} icon={<Trash />} variant="ghost" size="sm" onClick={() => setDeleting(true)} /> : null}
        </div>
      </header>
      <dl className="flex flex-col divide-y divide-line border-y border-line">
        <Fact label={t("status")}>
          <StatusBadge status={task.status as "todo"} size="sm" />
        </Fact>
        <Fact label={t("priority")}>
          <PriorityBadge priority={task.priority} size="sm" />
        </Fact>
        <Fact label={t("start")}>{task.startDate ? day(task.startDate) : <span className="text-fg-subtle">{t("notSet")}</span>}</Fact>
        <Fact label={t("due")}>
          {task.dueDate ? (
            <span className={!done && left != null && left < 0 ? "font-semibold text-danger" : undefined}>
              {day(task.dueDate)}
              {!done && left != null ? <span className="ms-2 text-caption text-fg-muted">{left < 0 ? t("overdueBy", { count: -left }) : left === 0 ? t("dueToday") : t("dueIn", { count: left })}</span> : null}
            </span>
          ) : (
            <span className="text-fg-subtle">{t("notSet")}</span>
          )}
        </Fact>
        <Fact label={t("assignees")}>
          {task.members.length ? (
            <span className="flex flex-col gap-1.5">
              <AvatarStack people={task.members} max={5} />
              <span dir="auto" className="text-caption text-fg-muted">
                {task.members.map((m) => `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim()).join(" · ")}
              </span>
            </span>
          ) : (
            <span className="text-fg-subtle">{t("nobody")}</span>
          )}
        </Fact>
        {task.dependencies?.dependsOn?.length ? (
          <Fact label={t("waitingFor")}>
            <ul className="flex flex-col gap-1">
              {task.dependencies.dependsOn.map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  <StatusBadge status={d.status as "todo"} size="sm" />
                  <span dir="auto">{d.title}</span>
                </li>
              ))}
            </ul>
          </Fact>
        ) : null}
      </dl>
      <section aria-labelledby="task-about" className="flex flex-col gap-2">
        <h3 id="task-about" className="text-label text-fg-muted">
          {t("description")}
        </h3>
        {task.description ? <RichText text={task.description} people={members} /> : <p className="text-body-sm text-fg-subtle">{t("noDescription")}</p>}
      </section>
      <TaskAttachments taskId={task.id} files={task.attachments ?? []} readOnly={!canEdit} />
      <TaskOptions task={task} projectId={projectId} people={members} readOnly={!canEdit} />
      <Tabs defaultValue="comments">
        <TabsList
          items={[
            { value: "comments", label: t("tabs.comments"), count: task.commentsCount || undefined },
            { value: "subtasks", label: t("tabs.subtasks"), count: task.subtasksCount || undefined },
            { value: "activity", label: t("tabs.activity") },
          ]}
        />
        <TabsPanel value="comments" className="pt-4">
          <CommentsPanel taskId={task.id} members={(details.data?.data as { members?: IProjectMember[] } | undefined)?.members ?? []} readOnly={!canEdit} />
        </TabsPanel>
        <TabsPanel value="subtasks" className="pt-4">
          <SubtasksPanel taskId={task.id} readOnly={!canEdit} />
        </TabsPanel>
        <TabsPanel value="activity" className="pt-4">
          <ActivityPanel taskId={task.id} />
        </TabsPanel>
      </Tabs>
      {canEdit ? <TaskFormDialog taskId={task.id} projectId={projectId} open={editing} onOpenChange={setEditing} /> : null}
      {isManager ? (
        <ConfirmDialog
          open={deleting}
          onOpenChange={setDeleting}
          title={t("deleteTitle", { name: isolate(task.title) })}
          impact={t("deleteImpact", { subtasks: task.subtasksCount, comments: task.commentsCount, files: task.attachments?.length ?? 0 })}
          irreversible
          confirmLabel={t("deleteConfirm")}
          cancelLabel={t("keep")}
          onConfirm={async () => {
            await del(String(task.id)).unwrap();
            onClose();
          }}
        />
      ) : null}
    </div>
  );
}

/** Mount once per project page. It opens when the address has ?task-id=. */
export function TaskSheet({ projectId }: { projectId: number }) {
  const t = useTranslations("TaskSheet");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("task-id");
  const id = raw && /^\d+$/.test(raw) ? Number(raw) : null;
  const close = () => {
    const sp = new URLSearchParams(params.toString());
    sp.delete("task-id");
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };
  return (
    <Sheet open={id != null} onOpenChange={(o) => !o && close()}>
      <SheetContent side="end" className="[--sheet-width:46rem]" aria-label={t("label")}>
        <div className="flex-1 overflow-y-auto p-6 pe-14">{id != null ? <TaskView key={id} id={id} projectId={projectId} onClose={close} /> : null}</div>
      </SheetContent>
    </Sheet>
  );
}
