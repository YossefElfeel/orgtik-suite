"use client";

// Create or edit a task (FS-TASKS-6). One form for both. A new task goes into the section it was
// opened from, by that section's id: the old sheet guessed a status from the column's title and the
// server then moved the card to another column (TASKS-008, 014). Opened outside a project (My
// tasks), it asks which project and section. Due and start dates are days, and both are optional:
// the old form filled in "now" without saying so (TASKS-040).
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { X } from "@phosphor-icons/react";
import { Button, Input, MultiSelect, Select, Textarea, RichTextEditor, toast } from "@orgtik/ui";
import { DatePicker } from "@orgtik/ui/dates";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useRouter } from "@/i18n/routing";
import { useGetAllProjectsQuery, useGetProjectDetailsQuery } from "@/redux/features/projects/projectsApi";
import { useCreateTaskMutation, useGetTaskQuery, useMoveTaskMutation, useUpdateTaskMutation } from "@/redux/features/task/taskApi";
import { editableDescription } from "@/lib/rich-description";
import { dueDayKey } from "@/lib/dates";
import { isolate } from "@/lib/bidi";

type Priority = "low" | "medium" | "high" | "urgent";
type Values = {
  projectId: string;
  sectionId: string;
  title: string;
  description: string;
  priority: Priority;
  startDate: string | null;
  dueDate: string | null;
  assignedUserIds: string[];
  dependsOnTaskIds: string[];
};
const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

function DayField({ value, onChange, label, clearLabel }: { value: string | null; onChange: (v: string | null) => void; label: string; clearLabel: string }) {
  return (
    <div className="flex items-center gap-2">
      <DatePicker aria-label={label} value={value} onChange={onChange} className="flex-1" />
      {value ? (
        <Button variant="ghost" size="sm" startIcon={<X />} onClick={() => onChange(null)}>
          {clearLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default function TaskFormDialog({
  taskId,
  projectId: fixedProject,
  sectionId: fixedSection,
  open,
  onOpenChange,
  trigger,
}: {
  /** Edit this task; without it, create one. */
  taskId?: number;
  projectId?: number;
  sectionId?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactElement;
}) {
  const t = useTranslations("TaskForm");
  const tf = useTranslations("FileReferences");
  const tp = useTranslations("Priority");
  const router = useRouter();
  const editing = taskId != null;
  const [own, setOwn] = useState(false);
  const shown = open ?? own;
  const form = useForm<Values>({
    defaultValues: {
      projectId: fixedProject ? String(fixedProject) : "",
      sectionId: fixedSection ? String(fixedSection) : "",
      title: "",
      description: "",
      priority: "medium",
      startDate: null,
      dueDate: null,
      assignedUserIds: [],
      dependsOnTaskIds: [],
    },
  });
  const projectId = Number(form.watch("projectId")) || 0;

  const task = useGetTaskQuery(taskId ?? 0, { skip: !shown || !editing });
  const projects = useGetAllProjectsQuery({ page: 1, limit: 100, status: "" }, { skip: !shown || Boolean(fixedProject) || editing });
  const details = useGetProjectDetailsQuery({ projectId }, { skip: !shown || !projectId });
  const sections = useMemo(() => (details.data?.data?.sections ?? []).map((s) => s.section), [details.data]);
  const members = (details.data?.data as { members?: { id: number; firstName?: string; lastName?: string; email?: string }[] } | undefined)?.members ?? [];
  const otherTasks = (details.data?.data?.sections ?? []).flatMap((s) => s.tasks).filter((x) => x.id !== taskId);

  // Editing: fill the form from the task once it's loaded.
  useEffect(() => {
    const d = task.data?.data as unknown as
      | { title: string; description?: string; priority: Priority; startDate?: string | null; dueDate?: string | null; projectId?: number; sectionId?: number; project?: { id: number }; assignments?: { assigneeType: string; assigneeId: number }[]; dependencies?: { dependsOn?: { id: number }[] } }
      | undefined;
    if (!editing || !d) return;
    form.reset({
      projectId: String(d.projectId ?? d.project?.id ?? fixedProject ?? ""),
      sectionId: String(d.sectionId ?? fixedSection ?? ""),
      title: d.title ?? "",
      description: d.description ?? "",
      priority: d.priority ?? "medium",
      startDate: d.startDate ? dueDayKey(d.startDate) : null,
      dueDate: d.dueDate ? dueDayKey(d.dueDate) : null,
      assignedUserIds: (d.assignments ?? []).filter((a) => a.assigneeType === "user").map((a) => String(a.assigneeId)),
      dependsOnTaskIds: (d.dependencies?.dependsOn ?? []).map((x) => String(x.id)),
    });
  }, [task.data, editing, form, fixedProject, fixedSection]);
  // A new task in a chosen project starts in its first section.
  useEffect(() => {
    if (!editing && !fixedSection && sections.length && !form.getValues("sectionId")) form.setValue("sectionId", String(sections[0].id));
  }, [sections, editing, fixedSection, form]);

  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [moveTask] = useMoveTaskMutation();

  const onSubmit = async () => {
    if (!(await form.trigger())) throw new Error("invalid");
    const v = form.getValues();
    const common = {
      title: v.title.trim(),
      description: v.description.trim(),
      priority: v.priority,
      startDate: v.startDate,
      dueDate: v.dueDate,
      assignedUserIds: v.assignedUserIds.map(Number),
      dependsOnTaskIds: v.dependsOnTaskIds.map(Number),
    };
    if (editing) {
      await updateTask({ taskId, body: common as never }).unwrap();
      const before = String((task.data?.data as { sectionId?: number } | undefined)?.sectionId ?? "");
      if (v.sectionId && v.sectionId !== before) {
        const target = details.data?.data?.sections?.find((s) => String(s.section.id) === v.sectionId);
        await moveTask({ taskId, sectionId: Number(v.sectionId), order: (target?.tasks.length ?? 0) + 1 }).unwrap();
      }
      return;
    }
    // No status is sent: the task stays in the section it was created in.
    const created = await createTask({ sectionId: v.sectionId, body: common }).unwrap();
    const id = (created as { data?: { id?: number } })?.data?.id;
    if (id && !fixedProject) {
      toast.success(t("created", { name: isolate(common.title) }), { action: { label: t("open"), onClick: () => router.push(`/projects/${projectId}/board?task-id=${id}`) } });
    }
  };

  const day = (name: "startDate" | "dueDate", label: string) => (
    <RHFField control={form.control} name={name} label={label} optional render={({ value, onChange }) => <DayField value={value} onChange={onChange} label={label} clearLabel={t("clearDate")} />} />
  );

  return (
    <FormDialog
      trigger={trigger}
      open={shown}
      onOpenChange={onOpenChange ?? setOwn}
      onClosed={() => {
        if (!editing) form.reset();
      }}
      size="xl"
      title={editing ? t("editTitle") : t("createTitle")}
      submitLabel={editing ? t("save") : t("create")}
      cancelLabel={t("cancel")}
      onSubmit={onSubmit}
    >
      {!fixedProject && !editing ? (
        <RHFField
          control={form.control}
          name="projectId"
          label={t("project")}
          required
          rules={{ validate: (v: string) => Boolean(v) || t("projectRequired") }}
          render={({ value, onChange }) => (
            <Select
              value={value || null}
              onValueChange={(v) => {
                onChange(v ?? "");
                form.setValue("sectionId", "");
              }}
              placeholder={t("pickProject")}
              options={(projects.data?.data?.items ?? []).map((p) => ({ value: String(p.id), label: p.title }))}
            />
          )}
        />
      ) : null}
      <RHFField
        control={form.control}
        name="title"
        label={t("name")}
        required
        rules={{ validate: (v: string) => v.trim().length >= 2 || t("nameRequired") }}
        render={(field) => <Input dir="auto" autoFocus {...field} />}
      />
      <RHFField control={form.control} name="description" label={t("description")} optional render={(field) => <RichTextEditor label={t("description")} value={editableDescription(field.value)} onChange={field.onChange} onBlur={field.onBlur} maxLength={10000} />} />
      <div className="grid gap-5 sm:grid-cols-2">
        <RHFField
          control={form.control}
          name="sectionId"
          label={t("section")}
          required
          rules={{ validate: (v: string) => Boolean(v) || t("sectionRequired") }}
          render={({ value, onChange }) => (
            <Select value={value || null} onValueChange={(v) => onChange(v ?? "")} disabled={!projectId} placeholder={t("pickSection")} options={sections.map((s) => ({ value: String(s.id), label: s.title }))} />
          )}
        />
        <RHFField
          control={form.control}
          name="priority"
          label={t("priority")}
          render={({ value, onChange }) => <Select value={value} onValueChange={(v) => v && onChange(v)} options={PRIORITIES.map((p) => ({ value: p, label: tp(p) }))} />}
        />
        {day("startDate", t("start"))}
        {day("dueDate", t("due"))}
      </div>
      <RHFField
        control={form.control}
        name="assignedUserIds"
        label={t("assignees")}
        optional
        render={({ value, onChange }) => (
          <MultiSelect
            value={value}
            onValueChange={onChange}
            disabled={!projectId}
            placeholder={t("pickPeople")}
            emptyText={t("noPeople")}
            options={members.map((m) => ({ value: String(m.id), label: `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim(), hint: m.email }))}
          />
        )}
      />
      <RHFField
        control={form.control}
        name="dependsOnTaskIds"
        label={t("waitingFor")}
        description={t("waitingForHint")}
        optional
        render={({ value, onChange }) => (
          <MultiSelect value={value} onValueChange={onChange} disabled={!projectId} placeholder={t("pickTasks")} emptyText={t("noTasks")} options={otherTasks.map((x) => ({ value: String(x.id), label: x.title }))} />
        )}
      />
      {editing ? null : <p className="text-caption text-fg-muted">{tf("afterCreate")}</p>}
    </FormDialog>
  );
}
