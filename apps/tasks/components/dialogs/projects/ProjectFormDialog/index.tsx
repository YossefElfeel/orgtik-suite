"use client";

// Create and edit a project with one form and one set of rules (FS-TASKS-10, TASKS-057): before,
// Create wanted 2 characters and Edit 6, and the two said their results differently. The workflow
// editor that did nothing is gone (TASKS-044): a new project gets the standard sections, and its
// status is one of the status matrix's three.
import { useEffect, useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Checkbox, Input, MultiSelect, Select, Textarea, toast, useStatusLabel } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useRouter } from "@/i18n/routing";
import { useCreateProjectMutation, useLazyGetProjectByIdQuery, useUpdateProjectMutation } from "@/redux/features/projects/projectsApi";
import { useGetTeamsListQuery } from "@/redux/features/teams/teamsApi";
import { useGetAllUsersQuery } from "@/redux/features/users/usersApi";
import type { IPriority, IProjectStatus } from "@/types/projects";
import { isolate } from "@/lib/bidi";

type Values = { title: string; description: string; priority: IPriority; status: IProjectStatus; isPrivate: boolean; teamIds: string[]; memberIds: string[] };
const EMPTY: Values = { title: "", description: "", priority: "medium", status: "todo", isPrivate: false, teamIds: [], memberIds: [] };
const PRIORITIES: IPriority[] = ["low", "medium", "high", "urgent"];
const STATUSES: IProjectStatus[] = ["todo", "in_progress", "done"];

// The standard sections, one per task status. The board shows each title as written.
const SECTIONS = (t: (k: string) => string) => [
  { title: t("backlog"), flag: "backlog", color: "neutral", order: 1 },
  { title: t("todo"), flag: "todo", color: "info", order: 2 },
  { title: t("in_progress"), flag: "in_progress", color: "warning", order: 3 },
  { title: t("in_review"), flag: "in_review", color: "brand", order: 4 },
  { title: t("done"), flag: "done", color: "success", order: 5 },
];

export default function ProjectFormDialog({ projectId, trigger, open, onOpenChange }: { projectId?: number; trigger?: ReactElement; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const t = useTranslations("ProjectForm");
  const tp = useTranslations("Priority");
  const statusLabel = useStatusLabel();
  const router = useRouter();
  const editing = projectId != null;
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<Values>({ defaultValues: EMPTY });
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [load, loaded] = useLazyGetProjectByIdQuery();
  const shown = open ?? isOpen;
  const { data: teams } = useGetTeamsListQuery(undefined, { skip: !shown || editing });
  const { data: users } = useGetAllUsersQuery(undefined, { skip: !shown || editing });

  useEffect(() => {
    if (shown && editing) load(projectId);
  }, [shown, editing, projectId, load]);
  useEffect(() => {
    const p = loaded.data?.data;
    if (editing && p) form.reset({ ...EMPTY, title: p.title, description: p.description ?? "", priority: p.priority, status: p.status, isPrivate: p.isPrivate });
  }, [loaded.data, editing, form]);

  const onSubmit = async () => {
    if (!(await form.trigger())) throw new Error("invalid");
    const v = form.getValues();
    const base = { title: v.title.trim(), description: v.description.trim(), priority: v.priority, status: v.status, isPrivate: v.isPrivate };
    if (editing) {
      await updateProject({ id: projectId, data: base }).unwrap();
      return;
    }
    const created = await createProject({
      ...base,
      teamIds: v.teamIds.map(Number),
      memberIds: v.memberIds.map(Number),
      customSections: SECTIONS((k) => statusLabel("task", k as "todo")),
    }).unwrap();
    const id = (created as { data?: { id?: number } })?.data?.id;
    // The list may be filtered so the new project isn't in it (TASKS-015): the toast opens it.
    toast.success(t("created", { name: isolate(base.title) }), id ? { action: { label: t("open"), onClick: () => router.push(`/projects/${id}/board`) } } : undefined);
  };

  return (
    <FormDialog
      trigger={trigger}
      open={open ?? isOpen}
      onOpenChange={onOpenChange ?? setIsOpen}
      onClosed={() => form.reset(EMPTY)}
      title={editing ? t("editTitle") : t("createTitle")}
      submitLabel={editing ? t("save") : t("create")}
      cancelLabel={t("cancel")}
      onSubmit={onSubmit}
    >
      <RHFField
        control={form.control}
        name="title"
        label={t("name")}
        required
        rules={{ validate: (v: string) => v.trim().length >= 2 || t("nameRequired") }}
        render={(field) => <Input dir="auto" autoFocus {...field} />}
      />
      <RHFField control={form.control} name="description" label={t("description")} optional render={(field) => <Textarea dir="auto" rows={3} maxRows={8} {...field} />} />
      <div className="grid gap-5 sm:grid-cols-2">
        <RHFField
          control={form.control}
          name="priority"
          label={t("priority")}
          render={({ value, onChange }) => <Select value={value} onValueChange={(v) => v && onChange(v)} options={PRIORITIES.map((p) => ({ value: p, label: tp(p) }))} />}
        />
        <RHFField
          control={form.control}
          name="status"
          label={t("status")}
          render={({ value, onChange }) => <Select value={value} onValueChange={(v) => v && onChange(v)} options={STATUSES.map((s) => ({ value: s, label: statusLabel("task", s) }))} />}
        />
      </div>
      {editing ? null : (
        <>
          <RHFField
            control={form.control}
            name="teamIds"
            label={t("teams")}
            optional
            render={({ value, onChange }) => (
              <MultiSelect value={value} onValueChange={onChange} placeholder={t("pickTeams")} emptyText={t("noTeams")} options={(teams?.data ?? []).map((tm) => ({ value: String(tm.id), label: tm.name }))} />
            )}
          />
          <RHFField
            control={form.control}
            name="memberIds"
            label={t("members")}
            optional
            render={({ value, onChange }) => (
              <MultiSelect
                value={value}
                onValueChange={onChange}
                placeholder={t("pickMembers")}
                emptyText={t("noMembers")}
                options={(users?.data ?? []).map((u) => ({ value: String(u.id), label: `${u.firstName} ${u.lastName}`, hint: u.email }))}
              />
            )}
          />
        </>
      )}
      <Checkbox checked={form.watch("isPrivate")} onCheckedChange={(v) => form.setValue("isPrivate", Boolean(v))} label={t("private")} description={t("privateHint")} />
    </FormDialog>
  );
}
