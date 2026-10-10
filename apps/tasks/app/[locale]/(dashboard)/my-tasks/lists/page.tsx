"use client";
import { useStatusLabel } from "@orgtik/ui";
import { TaskWorkbench } from "@/components/task/TaskWorkbench";
import { useGetMyTasksSectionsQuery } from "@/redux/features/task/taskApi";
export default function MyTaskListPage() {
  const label = useStatusLabel(), result = useGetMyTasksSectionsQuery();
  const sections = (result.data?.data.sections || []).map(({ section, tasks }) => ({ id: section.id, title: label("task", section.flag as "todo"), flag: section.flag, tasks }));
  return <TaskWorkbench sections={sections} loading={result.isLoading} error={result.error as { status?: number }} onRetry={() => void result.refetch()} />;
}
