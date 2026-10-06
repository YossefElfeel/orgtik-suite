"use client";

import { TaskCalendar } from "@/components/task/TaskCalendar";
import { useGetMyTasksSectionsQuery } from "@/redux/features/task/taskApi";

// My tasks on a calendar, from every project, with a project filter that really filters.
export default function MyTasksCalendarPage() {
  const { data, isLoading, isError, refetch } = useGetMyTasksSectionsQuery();
  const tasks = (data?.data?.sections ?? []).flatMap((s) => s.tasks);
  return <TaskCalendar tasks={tasks as never} loading={isLoading} error={isError} onRetry={() => refetch()} filterByProject />;
}
