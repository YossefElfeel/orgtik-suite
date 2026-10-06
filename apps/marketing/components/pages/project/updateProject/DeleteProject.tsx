"use client";

// Deleting a project removes everything in it. It was one click, with no confirmation, offered to
// every role (MKT-005). Now only super admins see it (deleteProjects), and the confirmation names the
// project and what goes with it, asks for the name to be typed, and stays open until the server
// answers. Afterwards every cached list of the old project is dropped.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash } from "@phosphor-icons/react";
import { Button, Card, ConfirmDialog } from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import { isolate } from "@/lib/bidi";
import { useAppDispatch } from "@/redux/app/hooks";
import { baseApi } from "@/redux/app/baseApi";
import { useDeleteProjectMutation } from "@/redux/features/projects/projectApi";
import type { IProject } from "@/types/projects";

export function DeleteProject({ project }: { project: IProject }) {
  const t = useTranslations("ProjectSettings");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [deleteProject] = useDeleteProjectMutation();
  const [open, setOpen] = useState(false);
  const name = isolate(project.name);

  return (
    <Card padding="lg" className="flex flex-col gap-4 border-danger">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-title-sm text-fg">{t("deleteTitle")}</h2>
        <p className="text-body-sm text-fg-muted">{t("deleteHint")}</p>
      </div>
      <div>
        <Button variant="danger" startIcon={<Trash />} onClick={() => setOpen(true)}>
          {t("deleteButton")}
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("deleteConfirmTitle", { name })}
        impact={t("deleteImpact")}
        irreversible
        typeToConfirm={project.name}
        tone="danger"
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("keepProject")}
        onConfirm={async () => {
          await deleteProject(project.id).unwrap();
          dispatch(baseApi.util.resetApiState());
          router.replace("/dashboard");
        }}
      />
    </Card>
  );
}
