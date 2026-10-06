"use client";

// A project's actions in the list: open it, and for admins and managers delete it. Deleting says
// what happens to an approved contract and what was created with it (SAL-089).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { DotsThree, Eye, Trash } from "@phosphor-icons/react";
import { ConfirmDialog, IconButton, Menu, MenuContent, MenuItem, MenuLinkItem, MenuSeparator, MenuTrigger } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useDeleteProjectMutation } from "@/redux/features/projects/projectsApi";
import { isolate } from "@/lib/bidi";
import type { ProjectDetail } from "@/types/projects";

export default function ProjectRowActions({ project, canDelete, onDeleted }: { project: ProjectDetail; canDelete: boolean; onDeleted?: () => void }) {
  const t = useTranslations("Projects");
  const [deleting, setDeleting] = useState(false);
  const [remove] = useDeleteProjectMutation();
  const approved = project.latestContract?.status === "approved";

  return (
    <>
      <Menu>
        <MenuTrigger render={<IconButton variant="ghost" size="sm" label={t("rowActions", { name: project.projectName })} icon={<DotsThree weight="bold" />} />} />
        <MenuContent align="end">
          <MenuLinkItem icon={<Eye />} render={<Link href={`/projects/${project.id}`} />}>
            {t("view")}
          </MenuLinkItem>
          {canDelete ? (
            <>
              <MenuSeparator />
              <MenuItem icon={<Trash />} tone="danger" onClick={() => setDeleting(true)}>
                {t("delete")}
              </MenuItem>
            </>
          ) : null}
        </MenuContent>
      </Menu>
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
          onDeleted?.();
        }}
      />
    </>
  );
}
