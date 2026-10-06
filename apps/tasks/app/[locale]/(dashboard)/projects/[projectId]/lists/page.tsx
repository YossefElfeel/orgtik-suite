"use client";

// The project's tasks as a list, section by section (FS-TASKS-7). "Add task" creates the task in
// that section, by its id (TASKS-014).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ListStates, useStatusLabel } from "@orgtik/ui";
import { TaskSections, type TaskSection } from "@/components/shared/TaskSections";
import TaskFormDialog from "@/components/task/TaskFormDialog";
import { useProjectId } from "@/components/pages/projects/ProjectFrame";
import { useGetProjectDetailsQuery } from "@/redux/features/projects/projectsApi";
import { useTaskRoles } from "@/lib/permissions";
import { sectionTitle } from "@/lib/sections";

export default function ProjectListPage() {
  const t = useTranslations("TaskList");
  const id = useProjectId() ?? 0;
  const { canEdit } = useTaskRoles();
  const statusLabel = useStatusLabel();
  const [adding, setAdding] = useState<TaskSection | null>(null);
  // No search here: the old call sent search=undefined (TASKS-054).
  const { data, isLoading, isError, refetch } = useGetProjectDetailsQuery({ projectId: id }, { skip: !id });
  const sections = (data?.data?.sections ?? []).map((s) => ({ id: s.section.id, title: sectionTitle(s.section.title, statusLabel), flag: s.section.flag, tasks: s.tasks }));
  return (
    <>
      <ListStates
        status={isLoading ? "loading" : isError ? "error" : sections.length ? "ready" : "empty"}
        onRetry={() => refetch()}
        empty={{ title: t("noSectionsTitle"), description: t("noSectionsBody") }}
      >
        <TaskSections sections={sections} projectId={id} readOnly={!canEdit} onAdd={setAdding} />
      </ListStates>
      {adding ? <TaskFormDialog key={adding.id} projectId={id} sectionId={adding.id} open onOpenChange={(o) => !o && setAdding(null)} /> : null}
    </>
  );
}
