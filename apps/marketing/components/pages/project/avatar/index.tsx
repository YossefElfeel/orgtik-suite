"use client";

// The project's logo. Choosing a file uploads it at once. The picture shown is always the saved
// one: the old page showed the chosen file before the upload and kept it after a failure, so a
// failed upload looked saved (MKT-037). A failure now says so next to the field.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash } from "@phosphor-icons/react";
import { Avatar, Button, Card, FileField } from "@orgtik/ui";
import { useDeleteAvatarMutation, useUploadAvatarMutation } from "@/redux/features/projects/projectApi";
import type { IProject } from "@/types/projects";

const MAX_LOGO = 5 * 1024 * 1024;

export default function ProjectLogo({ project, canEdit }: { project: IProject; canEdit: boolean }) {
  const t = useTranslations("ProjectSettings");
  const [uploadAvatar, upload] = useUploadAvatarMutation();
  const [deleteAvatar, removal] = useDeleteAvatarMutation();
  const [files, setFiles] = useState<File[]>([]);
  const [failure, setFailure] = useState<"upload" | "remove" | null>(null);

  const choose = async (next: File[]) => {
    setFiles(next);
    setFailure(null);
    const file = next[0];
    if (!file) return;
    try {
      await uploadAvatar({ id: project.id, file }).unwrap();
    } catch {
      setFailure("upload");
    } finally {
      setFiles([]);
    }
  };

  const remove = async () => {
    setFailure(null);
    try {
      await deleteAvatar(project.id).unwrap();
    } catch {
      setFailure("remove");
    }
  };

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-title-sm text-fg">{t("logoTitle")}</h2>
        <p className="text-body-sm text-fg-muted">{t("logoHint")}</p>
      </div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center gap-3">
          <Avatar name={project.name} src={project.avatar} size="lg" className="size-20" />
          {canEdit && project.avatar ? (
            <Button variant="ghost" size="sm" startIcon={<Trash />} loading={removal.isLoading} disabled={upload.isLoading} onClick={remove}>
              {t("removeLogo")}
            </Button>
          ) : null}
        </div>
        {canEdit ? (
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <FileField
              label={project.avatar ? t("replaceLogo") : t("addLogo")}
              description={t("logoFileHint")}
              accept="image/png,image/jpeg,image/webp"
              maxSize={MAX_LOGO}
              multiple={false}
              value={files}
              onChange={choose}
              disabled={upload.isLoading || removal.isLoading}
            />
            {upload.isLoading ? (
              <p role="status" className="text-body-sm text-fg-muted">
                {t("uploading")}
              </p>
            ) : null}
            {failure ? (
              <p role="alert" className="rounded-field bg-danger-subtle px-3 py-2 text-body-sm text-danger">
                {failure === "upload" ? t("logoUploadFailed") : t("logoRemoveFailed")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
