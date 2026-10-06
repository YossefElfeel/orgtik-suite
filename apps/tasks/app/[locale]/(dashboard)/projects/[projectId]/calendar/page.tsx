"use client";

import { TaskCalendar } from "@/components/task/TaskCalendar";
import { useProjectId } from "@/components/pages/projects/ProjectFrame";
import { useGetProjectDetailsQuery } from "@/redux/features/projects/projectsApi";

// The project's tasks on a calendar; a task opens in the project's sheet.
export default function ProjectCalendarPage() {
  const id = useProjectId() ?? 0;
  const { data, isLoading, isError, refetch } = useGetProjectDetailsQuery({ projectId: id }, { skip: !id });
  const tasks = (data?.data?.sections ?? []).flatMap((s) => s.tasks).map((x) => ({ ...x, project: { id } }));
  return <TaskCalendar tasks={tasks as never} projectId={id} loading={isLoading} error={isError} onRetry={() => refetch()} />;
}
