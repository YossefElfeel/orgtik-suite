"use client";

// The team's actions on a project.
// - Anyone on the team (a salesperson on their own deals) edits the name and description and sets
//   the due date.
// - Admins and managers set the priority, move an approved project through delivery one step at a
//   time with a confirmation (it could jump anywhere, SAL-069), and delete it.
// Nothing changes on screen before the API agrees (the badges used to flip and stay wrong, SAL-068).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, CalendarBlank, DotsThree, PencilSimple, Trash } from "@phosphor-icons/react";
import {
  Button,
  ConfirmDialog,
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@orgtik/ui";
import EditProjectDetailsDialog from "@/components/dialogs/projects/EditProjectDetailsDialog";
import SetProjectDueDateDialog from "@/components/dialogs/projects/SetProjectDueDateDialog";
import { useSalesStatusLabel } from "@/components/shared/SalesStatus";
import { useRouter } from "@/i18n/routing";
import { useRole } from "@/hooks/useRole";
import { useDeleteProjectMutation, useUpdateProjectPriorityMutation, useUpdateProjectStatusMutation } from "@/redux/features/projects/projectsApi";
import { isolate } from "@/lib/bidi";
import { DELIVERY_STATUSES, PROJECT_PRIORITIES, type DeliveryStatus, type ProjectDetail, type ProjectPriority } from "@/types/projects";

export default function ProjectHeaderActions({ project }: { project: ProjectDetail }) {
  const t = useTranslations("Projects");
  const statusLabel = useSalesStatusLabel();
  const router = useRouter();
  const { isAdmin, isManager, canEdit } = useRole();
  const approver = (isAdmin || isManager) && canEdit;
  const [editing, setEditing] = useState(false);
  const [dating, setDating] = useState(false);
  const [moveTo, setMoveTo] = useState<DeliveryStatus | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [setPriority, priorityState] = useUpdateProjectPriorityMutation();
  const [setStatus] = useUpdateProjectStatusMutation();
  const [remove] = useDeleteProjectMutation();

  if (!canEdit) return null;

  const current = (project.status === "inProgress" ? "in_progress" : project.status) as string;
  const at = (DELIVERY_STATUSES as readonly string[]).indexOf(current);
  const previous = at > 0 ? DELIVERY_STATUSES[at - 1] : null;
  const next = at >= 0 && at < DELIVERY_STATUSES.length - 1 ? DELIVERY_STATUSES[at + 1] : null;
  const approved = project.latestContract?.status === "approved";

  return (
    <>
      <Button variant="secondary" onClick={() => setEditing(true)} startIcon={<PencilSimple aria-hidden className="size-4" />}>
        {t("editDetails")}
      </Button>
      <Menu>
        <MenuTrigger render={<Button variant="secondary" startIcon={<DotsThree aria-hidden weight="bold" className="size-4" />} />}>
          {t("more")}
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem icon={<CalendarBlank />} onClick={() => setDating(true)}>
            {project.dueDate ? t("changeDueDate") : t("setDueDate")}
          </MenuItem>
          {approver ? (
            <>
              <MenuSeparator />
              <MenuGroup>
                <MenuLabel>{t("fieldPriority")}</MenuLabel>
                <MenuRadioGroup
                  value={project.priority}
                  onValueChange={(v) => {
                    if (v !== project.priority && !priorityState.isLoading) void setPriority({ id: project.id, body: { priority: v as ProjectPriority } });
                  }}
                >
                  {PROJECT_PRIORITIES.map((p) => (
                    <MenuRadioItem key={p} value={p}>
                      {t(`priority.${p}`)}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuGroup>
              {previous || next ? (
                <>
                  <MenuSeparator />
                  <MenuGroup>
                    <MenuLabel>{t("delivery")}</MenuLabel>
                    {next ? (
                      <MenuItem icon={<ArrowRight className="rtl:-scale-x-100" />} onClick={() => setMoveTo(next)}>
                        {t("moveTo", { status: statusLabel("project", next) })}
                      </MenuItem>
                    ) : null}
                    {previous ? (
                      <MenuItem icon={<ArrowLeft className="rtl:-scale-x-100" />} onClick={() => setMoveTo(previous)}>
                        {t("moveBackTo", { status: statusLabel("project", previous) })}
                      </MenuItem>
                    ) : null}
                  </MenuGroup>
                </>
              ) : null}
              <MenuSeparator />
              <MenuItem icon={<Trash />} tone="danger" onClick={() => setDeleting(true)}>
                {t("delete")}
              </MenuItem>
            </>
          ) : null}
        </MenuContent>
      </Menu>

      <EditProjectDetailsDialog project={project} open={editing} onOpenChange={setEditing} />
      <SetProjectDueDateDialog project={project} open={dating} onOpenChange={setDating} />
      <ConfirmDialog
        open={Boolean(moveTo)}
        onOpenChange={(o) => !o && setMoveTo(null)}
        tone="primary"
        title={moveTo ? t("moveTitle", { name: isolate(project.projectName), status: statusLabel("project", moveTo) }) : ""}
        impact={t("moveImpact")}
        confirmLabel={moveTo ? t("moveTo", { status: statusLabel("project", moveTo) }) : ""}
        onConfirm={() => (moveTo ? setStatus({ id: project.id, body: { status: moveTo } }).unwrap() : undefined)}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("deleteTitle", { name: isolate(project.projectName) })}
        impact={approved ? t("deleteImpactApproved") : t("deleteImpact")}
        acknowledgement={approved ? t("deleteAcknowledge") : undefined}
        confirmLabel={t("deleteConfirm")}
        irreversible
        onConfirm={async () => {
          await remove(project.id).unwrap();
          router.push("/projects");
        }}
      />
    </>
  );
}
