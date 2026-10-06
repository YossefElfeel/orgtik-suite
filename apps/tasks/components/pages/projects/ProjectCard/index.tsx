"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChatCircle, DotsThreeVertical, Paperclip, PencilSimple, Trash } from "@phosphor-icons/react";
import { Avatar, Card, ConfirmDialog, Menu, MenuContent, MenuItem, MenuTrigger, Progress } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import PriorityBadge from "@/components/shared/PriorityBadge";
import ProjectStatusBadge from "@/components/shared/ProjectStatusBadge";
import ProjectFormDialog from "@/components/dialogs/projects/ProjectFormDialog";
import { useDeleteProjectMutation } from "@/redux/features/projects/projectsApi";
import { useTaskRoles } from "@/lib/permissions";
import type { IProjects } from "@/types/projects";
import { isolate } from "@/lib/bidi";

/**
 * One project in the list (FS-TASKS-10). Its name is the link to the board; the actions are a
 * named menu, shown only to people who can use them; the counts and the progress say what they
 * count; Delete states what goes with the project.
 */
export default function ProjectCard({ project }: { project: IProjects }) {
  const t = useTranslations("ProjectList");
  const { isManager } = useTaskRoles();
  const [deleteProject] = useDeleteProjectMutation();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pct = Math.round(project.completedTasksPercentage ?? 0);

  return (
    <Card padding="md" className="flex h-full flex-col gap-3">
      <div className="flex items-start gap-2">
        <h2 className="min-w-0 flex-1 text-body-lg font-semibold text-fg">
          <Link href={`/projects/${project.id}/board`} dir="auto" className="line-clamp-2 rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {project.title}
          </Link>
        </h2>
        {isManager ? (
          <Menu>
            <MenuTrigger
              aria-label={t("actionsFor", { name: isolate(project.title) })}
              className="grid size-8 shrink-0 place-items-center rounded-pill text-fg-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus"
            >
              <DotsThreeVertical weight="bold" aria-hidden="true" className="size-5" />
            </MenuTrigger>
            <MenuContent align="end">
              <MenuItem icon={<PencilSimple />} onClick={() => setEditing(true)}>
                {t("edit")}
              </MenuItem>
              <MenuItem icon={<Trash />} tone="danger" onClick={() => setDeleting(true)}>
                {t("delete")}
              </MenuItem>
            </MenuContent>
          </Menu>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <ProjectStatusBadge status={project.status} size="sm" />
        <PriorityBadge priority={project.priority} size="sm" />
      </div>
      {project.description ? (
        <p dir="auto" className="line-clamp-3 text-body-sm text-fg-muted">
          {project.description}
        </p>
      ) : null}
      <Progress value={pct} label={t("progress")} className="mt-auto" />
      <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
        <ul className="flex [&>*+*]:-ms-2" aria-label={t("teams")}>
          {project.teams.slice(0, 3).map((team) => (
            <li key={team.id}>
              <Avatar name={team.name} src={team.teamImage || undefined} size="sm" className="ring-2 ring-raised" />
            </li>
          ))}
          {project.teams.length > 3 ? (
            <li className="grid size-8 place-items-center rounded-pill bg-sunken text-caption text-fg-muted ring-2 ring-raised">+{project.teams.length - 3}</li>
          ) : null}
        </ul>
        <div className="flex items-center gap-3 text-caption text-fg-muted">
          <span className="inline-flex items-center gap-1">
            <Paperclip aria-hidden="true" className="size-4" />
            <span>{t("attachments", { count: project.totalAttachmentsCount ?? 0 })}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <ChatCircle aria-hidden="true" className="size-4" />
            <span>{t("comments", { count: project.totalCommentsCount ?? 0 })}</span>
          </span>
        </div>
      </div>
      {isManager ? (
        <>
          <ProjectFormDialog projectId={project.id} open={editing} onOpenChange={setEditing} />
          <ConfirmDialog
            open={deleting}
            onOpenChange={setDeleting}
            title={t("deleteTitle", { name: isolate(project.title) })}
            impact={t("deleteImpact")}
            irreversible
            confirmLabel={t("deleteConfirm")}
            cancelLabel={t("keep")}
            onConfirm={() => deleteProject(project.id).unwrap()}
          />
        </>
      ) : null}
    </Card>
  );
}
