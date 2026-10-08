"use client";

// Tasks grouped by section, as tables (FS-TASKS-7). The old list made each row a draggable "button"
// with links and menus inside it: no table semantics, no keyboard reorder, a hydration error from
// stray text in a row (TASKS-045, 046). Now rows are rows; moving is a named "Move to…" menu, and
// reordering is the board's job.
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ArrowsLeftRight, DotsThreeVertical, Plus } from "@phosphor-icons/react";
import { Button, Card, Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger, cn, useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import PriorityBadge from "@/components/shared/PriorityBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import { AvatarStack } from "@/components/shared/AvatarStack";
import { useMoveTaskMutation } from "@/redux/features/task/taskApi";
import { daysUntil, dueDay } from "@/lib/dates";
import { isolate } from "@/lib/bidi";
import type { IProjectTask } from "@/types/tasks";

export type TaskSection = { id: number; title: string; flag?: string; tasks: IProjectTask[] };

const assigneesOf = (t: IProjectTask) =>
  (t.assignments ?? []).map((a) => a.assignee).filter(Boolean).map((p) => ({ id: p.id, name: p.name ?? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(), avatar: p.avatar }));

function MoveMenu({ task, sections, from }: { task: IProjectTask; sections: TaskSection[]; from: TaskSection }) {
  const t = useTranslations("TaskList");
  const [move] = useMoveTaskMutation();
  return (
    <Menu>
      <MenuTrigger
        aria-label={t("actionsFor", { name: isolate(task.title) })}
        className="grid size-8 place-items-center rounded-pill text-fg-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus"
      >
        <DotsThreeVertical weight="bold" aria-hidden="true" className="size-5" />
      </MenuTrigger>
      <MenuContent align="end">
        <MenuLabel>{t("moveTo")}</MenuLabel>
        {sections
          .filter((s) => s.id !== from.id)
          .map((s) => (
            <MenuItem key={s.id} icon={<ArrowsLeftRight />} onClick={() => move({ taskId: task.id, sectionId: s.id, order: s.tasks.length + 1 })}>
              <span dir="auto">{s.title}</span>
            </MenuItem>
          ))}
      </MenuContent>
    </Menu>
  );
}

export function TaskSections({
  sections,
  projectId,
  showProject = false,
  readOnly = false,
  onAdd,
}: {
  sections: TaskSection[];
  /** The project the tasks belong to; My tasks reads each task's own. */
  projectId?: number;
  showProject?: boolean;
  readOnly?: boolean;
  onAdd?: (section: TaskSection) => void;
}) {
  const t = useTranslations("TaskList");
  const f = useFormatter();

  const columnsFor = useMemo(
    () =>
      (section: TaskSection): ColumnDef<IProjectTask>[] => [
        {
          id: "title",
          header: t("task"),
          meta: { truncate: true },
          cell: ({ row }) => {
            const task = row.original;
            const pid = task.project?.id ?? projectId;
            return (
              <div className="flex min-w-0 flex-col">
                <Link href={`/projects/${pid}/board?task-id=${task.id}`} dir="auto" className="truncate font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                  {task.title}
                </Link>
                {showProject && task.project ? (
                  <span dir="auto" className="truncate text-caption text-fg-muted">
                    {(task.project as { title?: string; name?: string }).title ?? (task.project as { name?: string }).name}
                  </span>
                ) : null}
              </div>
            );
          },
        },
        { id: "people", header: t("assignees"), cell: ({ row }) => <AvatarStack people={assigneesOf(row.original)} max={3} /> },
        {
          id: "due",
          header: t("due"),
          meta: { numeric: true },
          cell: ({ row }) => {
            const due = row.original.dueDate;
            if (!due) return <span className="text-fg-subtle">{t("noDue")}</span>;
            const left = daysUntil(String(due));
            const done = ["done", "completed"].includes(String(row.original.status));
            return (
              <span className={cn(!done && left < 0 && "font-semibold text-danger")}>
                {f.date(dueDay(String(due)), { dateStyle: "medium", timeZone: "UTC" })}
                {!done && left < 0 ? <span className="sr-only"> · {t("overdue")}</span> : null}
              </span>
            );
          },
        },
        { id: "priority", header: t("priority"), cell: ({ row }) => <PriorityBadge priority={row.original.priority} size="sm" /> },
        { id: "status", header: t("status"), cell: ({ row }) => (row.original.status ? <StatusBadge status={row.original.status as "todo"} size="sm" /> : null) },
        ...(readOnly
          ? []
          : [{ id: "actions", header: () => <span className="sr-only">{t("actions")}</span>, meta: { width: "1%" }, cell: ({ row }) => <MoveMenu task={row.original} sections={sections} from={section} /> } as ColumnDef<IProjectTask>]),
      ],
    [t, f, projectId, showProject, readOnly, sections],
  );

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <Card key={section.id} padding="none" className="overflow-hidden">
          <section aria-labelledby={`section-${section.id}`}>
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <h2 id={`section-${section.id}`} dir="auto" className="text-body font-semibold text-fg">
                {section.title}
              </h2>
              <span className="text-caption text-fg-muted">{t("count", { count: section.tasks.length })}</span>
              {onAdd && !readOnly ? (
                <Button variant="ghost" size="sm" className="ms-auto" startIcon={<Plus />} onClick={() => onAdd(section)}>
                  {t("addTo", { section: isolate(section.title) })}
                </Button>
              ) : null}
            </header>
            <DataTable
              label={section.title}
              columns={columnsFor(section)}
              data={section.tasks}
              getRowId={(r) => String(r.id)}
              paginate
              status={section.tasks.length ? "ready" : "empty"}
              empty={{ title: t("emptySection") }}
              className="rounded-none border-0"
            />
          </section>
        </Card>
      ))}
    </div>
  );
}
