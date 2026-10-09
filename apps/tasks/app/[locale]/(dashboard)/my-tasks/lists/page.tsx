"use client";

// My tasks as a list, by status (FS-TASKS-7). Each row says which project it's in.
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, ListStates, Toolbar, useStatusLabel, type Density } from "@orgtik/ui";
import { Plus } from "@phosphor-icons/react";
import TaskFormDialog from "@/components/task/TaskFormDialog";
import { TaskSections } from "@/components/shared/TaskSections";
import { useGetMyTasksSectionsQuery } from "@/redux/features/task/taskApi";

export default function MyTaskListPage() {
  const t = useTranslations("TaskList");
  const statusLabel = useStatusLabel();
  const [query, setQuery] = useState("");
  const [density, setDensity] = useState<Density>("comfortable");
  const { data, isLoading, isError, refetch } = useGetMyTasksSectionsQuery();
  // These sections are the statuses; their names come from the status matrix, in the reader's language.
  const sections = (data?.data?.sections ?? []).map((s) => {
    const flag = s.section.flag as string | undefined;
    const known = flag && ["backlog", "todo", "in_progress", "in_review", "done"].includes(flag);
    return { id: s.section.id, title: known ? statusLabel("task", flag as "todo") : s.section.title, flag, tasks: s.tasks.filter(task => !query.trim() || task.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) };
  });
  const total = sections.reduce((n, s) => n + s.tasks.length, 0);
  // A task created here asks which project and section it goes in (it used to land in whichever
  // project was updated last, TASKS-014).
  return (
    <div className="flex flex-col gap-4">
      <Toolbar label={t("toolbar")} search={{ value: query, onChange: setQuery, label: t("search") }} density={density} onDensityChange={setDensity} actions={
        <TaskFormDialog
          trigger={
            <Button variant="primary" startIcon={<Plus />}>
              {t("create")}
            </Button>
          }
        />
      } />
    <ListStates
      status={isLoading ? "loading" : isError ? "error" : total ? "ready" : "empty"}
      onRetry={() => refetch()}
      empty={{ title: query.trim() ? t("noResults") : t("nothingAssignedTitle"), description: query.trim() ? t("clearSearch") : t("nothingAssignedBody") }}
    >
      <TaskSections sections={sections} showProject density={density} />
    </ListStates>
    </div>
  );
}
