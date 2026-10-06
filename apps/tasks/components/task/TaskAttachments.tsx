"use client";

// A task's files (FS-TASKS-6): one card per file, a real download, a preview for images, and a
// named remove that asks first. The old edit sheet's trash button was a submit button, so removing a
// file also saved the half-edited form (TASKS-011), and documents were shown as links (TASKS-038).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { DownloadSimple, Eye, File, FileImage, FilePdf, Trash } from "@phosphor-icons/react";
import { ConfirmDialog, Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, FileField, IconButton, useFormatter } from "@orgtik/ui";
import { useAddAttachmentsMutation, useDeleteAttachmentMutation } from "@/redux/features/task/taskApi";
import { downloadAttachmentFile } from "@/lib/downloadAttachmentFile";
import { isolate } from "@/lib/bidi";

export type Attachment = { id: number; fileUrl: string; originalName: string; mimetype: string; size: number };

const iconFor = (m: string) => (m.startsWith("image/") ? <FileImage /> : m === "application/pdf" ? <FilePdf /> : <File />);

export function TaskAttachments({ taskId, files, readOnly }: { taskId: number; files: Attachment[]; readOnly: boolean }) {
  const t = useTranslations("TaskSheet");
  const f = useFormatter();
  const [add] = useAddAttachmentsMutation();
  const [remove] = useDeleteAttachmentMutation();
  const [picked, setPicked] = useState<File[]>([]);
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [removing, setRemoving] = useState<Attachment | null>(null);

  const upload = async (list: File[]) => {
    setPicked(list);
    if (!list.length) return;
    const body = new FormData();
    list.forEach((file) => body.append("attachments", file));
    try {
      await add({ taskId: String(taskId), body }).unwrap();
    } finally {
      setPicked([]);
    }
  };

  return (
    <section aria-labelledby="task-files" className="flex flex-col gap-3">
      <h3 id="task-files" className="text-label text-fg-muted">
        {t("files", { count: files.length })}
      </h3>
      {files.length ? (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {files.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-card border border-line bg-raised p-2.5">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-field bg-sunken text-fg-muted [&>svg]:size-5">
                {iconFor(a.mimetype)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span dir="auto" className="truncate text-body-sm font-semibold text-fg">
                  {a.originalName}
                </span>
                <span className="text-caption text-fg-muted">{f.bytes(a.size)}</span>
              </span>
              {a.mimetype.startsWith("image/") ? <IconButton label={t("preview", { name: isolate(a.originalName) })} icon={<Eye />} variant="ghost" size="sm" onClick={() => setPreview(a)} /> : null}
              <IconButton label={t("download", { name: isolate(a.originalName) })} icon={<DownloadSimple />} variant="ghost" size="sm" onClick={() => downloadAttachmentFile(a.fileUrl, a.originalName)} />
              {readOnly ? null : <IconButton label={t("removeFile", { name: isolate(a.originalName) })} icon={<Trash />} variant="ghost" size="sm" onClick={() => setRemoving(a)} />}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-fg-subtle">{t("noFiles")}</p>
      )}
      {readOnly ? null : <FileField label={t("addFiles")} multiple maxFiles={10} maxSize={25 * 1024 * 1024} value={picked} onChange={upload} />}
      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>
              <span dir="auto">{preview?.originalName}</span>
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview ? <img src={preview.fileUrl} alt={preview.originalName} className="mx-auto max-h-[70vh] w-auto rounded-card" /> : null}
          </DialogBody>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t("removeFileTitle", { name: isolate(removing?.originalName) })}
        impact={t("removeFileImpact")}
        irreversible
        confirmLabel={t("removeFileConfirm")}
        cancelLabel={t("keepFile")}
        onConfirm={() => (removing ? remove(removing.id).unwrap() : undefined)}
      />
    </section>
  );
}
