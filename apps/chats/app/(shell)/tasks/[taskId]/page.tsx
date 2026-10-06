import { TaskScreen } from "@/features/shell/TaskScreen";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return <TaskScreen taskId={taskId} />;
}
