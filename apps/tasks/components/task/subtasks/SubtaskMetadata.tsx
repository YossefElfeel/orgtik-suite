"use client";
import { useTranslations } from "next-intl";
import { Field, Input, Select } from "@orgtik/ui";
import { useGetTaskQuery, useUpdateSubtaskMutation } from "@/redux/features/task/taskApi";
import { useGetProjectDetailsQuery } from "@/redux/features/projects/projectsApi";
import type { ISetupItem } from "@/types/tasks";
export function SubtaskMetadata({ subtask, readOnly }: { subtask: ISetupItem; readOnly: boolean }) {
  const t = useTranslations("Roadmap"), task = useGetTaskQuery(subtask.taskId || 0, { skip: !subtask.taskId });
  const projectId = task.data?.data.projectId;
  const project = useGetProjectDetailsQuery({ projectId: Number(projectId) }, { skip: !projectId });
  const [update, state] = useUpdateSubtaskMutation();
  if (!subtask.taskId) return null;
  const change = async (values: { assigneeId?: number | null; dueDate?: string | null }) => { try { await update({ subTaskId: subtask.id, subTask: values }).unwrap(); } catch { /* Localized API feedback retains the saved values. */ } };
  return <details className="w-full text-caption"><summary className="cursor-pointer text-fg-muted">{t("assignee")} · {t("dueDate")}{subtask.dueDate ? <bdi className="ms-2">{subtask.dueDate}</bdi> : null}</summary><div className="mt-2 grid gap-3 sm:grid-cols-2"><Field label={t("assignee")}><Select disabled={readOnly || state.isLoading || project.isLoading || project.isError} value={subtask.assigneeId ? String(subtask.assigneeId) : ""} options={[{ value: "", label: "—" }, ...(project.data?.data.members || []).map(member => ({ value: String(member.id), label: [member.firstName, member.lastName].filter(Boolean).join(" ") }))]} onValueChange={value => void change({ assigneeId: value ? Number(value) : null })} /></Field><Field label={t("dueDate")}><Input type="date" disabled={readOnly || state.isLoading} value={subtask.dueDate || ""} onChange={event => void change({ dueDate: event.target.value || null })} /></Field></div></details>;
}
