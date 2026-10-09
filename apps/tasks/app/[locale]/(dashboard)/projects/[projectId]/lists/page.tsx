"use client";
import { useStatusLabel } from "@orgtik/ui";
import { TaskWorkbench } from "@/components/task/TaskWorkbench";
import { useProjectId } from "@/components/pages/projects/ProjectFrame";
import { useGetProjectDetailsQuery } from "@/redux/features/projects/projectsApi";
export default function ProjectListPage() {
  const id = useProjectId() || 0, label = useStatusLabel(), result = useGetProjectDetailsQuery({ projectId: id }, { skip: !id });
  const sections = (result.data?.data.sections || []).map(({ section, tasks }) => ({ id: section.id, title: label("task", section.flag as "todo"), flag: section.flag, tasks }));
  return <TaskWorkbench projectId={id} sections={sections} loading={result.isLoading} error={result.error as { status?: number }} onRetry={() => void result.refetch()} readOnly={Boolean((result.data?.data as unknown as { archivedAt?: string })?.archivedAt)} />;
}
