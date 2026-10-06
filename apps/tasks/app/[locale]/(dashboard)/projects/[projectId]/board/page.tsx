"use client";

// The project's board (FS-TASKS-5) on the library's Board: drag, touch and keyboard moves with
// announcements, a "Move to…" menu on every card, and rollback when the API refuses a move (the old
// board kept the card where it was dropped, TASKS-006, 007). The search filters the board here, and
// a move is placed among ALL the column's cards, so a filtered move can't renumber cards you can't
// see (TASKS-035). The Archive column stays when it's shown (TASKS-034); column titles are shown as
// written (TASKS-066). Cards open the project's one task sheet (?task-id=).
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Archive, ChatCircle, MagnifyingGlass, Paperclip, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { Board, Button, ConfirmDialog, Input, MenuItem, Switch, toast, useFormatter, useStatusLabel, type BoardColumn, type BoardMove } from "@orgtik/ui";
import { sectionTitle } from "@/lib/sections";
import { usePathname, useRouter } from "@/i18n/routing";
import PriorityBadge from "@/components/shared/PriorityBadge";
import { AvatarStack } from "@/components/shared/AvatarStack";
import TaskFormDialog from "@/components/task/TaskFormDialog";
import { SectionFormDialog } from "@/components/dialogs/projects/SectionFormDialog";
import { useProjectId } from "@/components/pages/projects/ProjectFrame";
import { useDeleteProjectSectionMutation, useGetProjectArchiveTasksQuery, useGetProjectBoardQuery } from "@/redux/features/projects/projectsApi";
import { useMoveTaskMutation } from "@/redux/features/task/taskApi";
import { useTaskRoles } from "@/lib/permissions";
import { daysUntil, dueDay } from "@/lib/dates";
import { isolate } from "@/lib/bidi";
import type { IProjectTask } from "@/types/tasks";

type Column = { id: number; title: string; color: string; order: number; flag?: string };
type Item = { id: string; columnId: string; title: string; task: IProjectTask };

const assigneesOf = (t: IProjectTask) =>
  (t.assignments ?? []).map((a) => a.assignee).filter(Boolean).map((p) => ({ id: p.id, name: p.name ?? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(), avatar: p.avatar }));

function Card({ task }: { task: IProjectTask }) {
  const t = useTranslations("BoardPage");
  const f = useFormatter();
  const left = task.dueDate ? daysUntil(String(task.dueDate)) : null;
  const done = String(task.status) === "done";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} size="sm" />
        {task.dueDate ? (
          <span className={!done && left != null && left < 0 ? "text-caption font-semibold text-danger" : "text-caption text-fg-muted"}>
            {f.date(dueDay(String(task.dueDate)), { day: "numeric", month: "short", timeZone: "UTC" })}
            {!done && left != null && left < 0 ? ` · ${t("overdue")}` : null}
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <AvatarStack people={assigneesOf(task)} max={3} />
        <span className="flex items-center gap-2 text-caption text-fg-muted">
          {task.attachmentsCount ? (
            <span className="inline-flex items-center gap-0.5" aria-label={t("files", { count: task.attachmentsCount })}>
              <Paperclip aria-hidden="true" className="size-3.5" />
              {task.attachmentsCount}
            </span>
          ) : null}
          {task.commentsCount ? (
            <span className="inline-flex items-center gap-0.5" aria-label={t("comments", { count: task.commentsCount })}>
              <ChatCircle aria-hidden="true" className="size-3.5" />
              {task.commentsCount}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

export default function BoardPage() {
  const t = useTranslations("BoardPage");
  const id = useProjectId() ?? 0;
  const { canEdit, isManager } = useTaskRoles();
  const statusLabel = useStatusLabel();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = (params.get("q") ?? "").trim();
  const showArchive = params.get("archive") === "1";
  const setParam = (k: string, v: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (v) sp.set(k, v);
    else sp.delete(k);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const board = useGetProjectBoardQuery({ projectId: id, search: "" }, { skip: !id });
  const archive = useGetProjectArchiveTasksQuery(id, { skip: !id || !showArchive });
  const [move] = useMoveTaskMutation();
  const [removeSection] = useDeleteProjectSectionMutation();
  const [search, setSearch] = useState(q);
  useEffect(() => {
    if (search.trim() === q) return;
    const timer = setTimeout(() => setParam("q", search.trim() || null), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  const [adding, setAdding] = useState<number | null>(null);
  const [editing, setEditing] = useState<Column | null>(null);
  const [deleting, setDeleting] = useState<Column | null>(null);

  const cols: Column[] = useMemo(() => {
    const list = [...((board.data?.data?.columns ?? []) as Column[])];
    const a = (archive.data?.data as { column?: Column } | undefined)?.column;
    if (showArchive && a && !list.some((c) => c.id === a.id)) list.push(a);
    return list;
  }, [board.data, archive.data, showArchive]);
  const all: IProjectTask[] = useMemo(
    () => [...((board.data?.data?.tasks ?? []) as IProjectTask[]), ...(showArchive ? (((archive.data?.data as { tasks?: IProjectTask[] } | undefined)?.tasks ?? []) as IProjectTask[]) : [])],
    [board.data, archive.data, showArchive],
  );
  const matches = (task: IProjectTask) => !q || task.title.toLowerCase().includes(q.toLowerCase());
  const items: Item[] = all.filter(matches).map((task) => ({ id: String(task.id), columnId: String(task.columnId), title: task.title, task }));
  const columns: BoardColumn[] = cols.map((c) => ({
    id: String(c.id),
    title: sectionTitle(c.title, statusLabel),
    color: c.color,
    // The count is the column's real total, also when the search hides some cards.
    count: all.filter((x) => x.columnId === c.id).length,
    locked: c.flag === "archive",
  }));
  const byId = new Map(cols.map((c) => [String(c.id), c]));

  // The board says where the card went among the cards it shows; the API wants its place among all.
  const onMove = async (m: BoardMove) => {
    const target = all.filter((x) => String(x.columnId) === m.toColumnId && String(x.id) !== m.itemId);
    const after = m.afterId ? target.findIndex((x) => String(x.id) === m.afterId) : -1;
    const before = m.beforeId ? target.findIndex((x) => String(x.id) === m.beforeId) : -1;
    const index = after >= 0 ? after + 1 : before >= 0 ? before : m.toIndex;
    try {
      await move({ taskId: Number(m.itemId), sectionId: Number(m.toColumnId), order: index + 1 }).unwrap();
    } catch (e) {
      const status = (e as { status?: number | string; data?: { code?: string } })?.status;
      const code = (e as { data?: { code?: string } })?.data?.code;
      toast.error(code === "read_only" ? t("moveReadOnly") : status === 403 ? t("moveForbidden") : status === "FETCH_ERROR" ? t("moveOffline") : t("moveFailed"));
      throw e;
    }
  };

  const status = board.isLoading ? "loading" : board.isError ? ((board.error as { status?: number })?.status === 403 ? "no-permission" : "error") : cols.length ? "ready" : "empty";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<MagnifyingGlass />}
          placeholder={t("search")}
          aria-label={t("search")}
          className="md:max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Switch checked={showArchive} onCheckedChange={(v) => setParam("archive", v ? "1" : null)} label={t("showArchive")} />
          {isManager ? (
            <SectionFormDialog
              projectId={id}
              trigger={
                <Button variant="secondary" startIcon={<Plus />}>
                  {t("addSection")}
                </Button>
              }
            />
          ) : null}
        </div>
      </div>
      <Board
        label={t("label")}
        columns={columns}
        items={items}
        status={status}
        onRetry={() => board.refetch()}
        readOnly={!canEdit}
        canDrop={(_item, column) => !column.locked}
        onOpen={(item) => setParam("task-id", item.id)}
        onMove={onMove}
        onAdd={canEdit ? (column) => !column.locked && setAdding(Number(column.id)) : undefined}
        addLabel={(column) => t("addTo", { section: isolate(column.title) })}
        countLabel={(n) => t("count", { count: n })}
        noResults={q ? { onClear: () => { setSearch(""); setParam("q", null); } } : undefined}
        emptyAction={
          isManager ? (
            <SectionFormDialog
              projectId={id}
              trigger={
                <Button variant="primary" startIcon={<Plus />}>
                  {t("addSection")}
                </Button>
              }
            />
          ) : undefined
        }
        columnActions={
          isManager
            ? (column) => {
                const c = byId.get(column.id);
                if (!c || c.flag === "archive") return null;
                return (
                  <>
                    <MenuItem icon={<PencilSimple />} onClick={() => setEditing(c)}>
                      {t("editSection")}
                    </MenuItem>
                    <MenuItem icon={<Trash />} tone="danger" onClick={() => setDeleting(c)}>
                      {t("deleteSection")}
                    </MenuItem>
                  </>
                );
              }
            : undefined
        }
        renderCard={(item) => <Card task={item.task} />}
      />
      {adding != null ? <TaskFormDialog key={adding} projectId={id} sectionId={adding} open onOpenChange={(o) => !o && setAdding(null)} /> : null}
      {editing ? <SectionFormDialog projectId={id} section={editing} open onOpenChange={(o) => !o && setEditing(null)} /> : null}
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("deleteSectionTitle", { name: isolate(deleting?.title) })}
        impact={t("deleteSectionImpact", { count: deleting ? all.filter((x) => x.columnId === deleting.id).length : 0 })}
        tone="danger"
        confirmLabel={t("deleteSectionConfirm")}
        cancelLabel={t("keepSection")}
        onConfirm={() => (deleting ? removeSection({ projectId: id, sectionId: deleting.id }).unwrap() : undefined)}
      />
      {showArchive && archive.isFetching ? <p className="inline-flex items-center gap-2 text-caption text-fg-muted"><Archive aria-hidden="true" className="size-4" />{t("loadingArchive")}</p> : null}
    </div>
  );
}
