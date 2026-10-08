"use client";
import { useEffect, useState } from "react";
import { useFormatter } from "@orgtik/ui";
import { ArrowSquareOut, DownloadSimple, FileText } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Primitives";
import { Modal } from "@/components/ui/Overlays";
import { useT, useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/store";
import { openFileReference } from "@/lib/open-file-reference";
import { downloadReference, fileRequest, fileAuthority, useFileAuthority } from "@/lib/file-references";
import type { FileRef } from "@/entities";

export function FilePreview({ file, messageId, open, onClose, context }: { file: FileRef | null; messageId: string; open: boolean; onClose: () => void; context?: string }) {
  const t = useT(), authority = useFileAuthority();
  const format = useFormatter();
  const { locale } = useI18n();
  const [opening, setOpening] = useState(false), [openError, setOpenError] = useState(false);
  const current = useWorkspace(s => {
    const message = s.messages.find(m => m.id === messageId) || Object.values(s.threadReplies).flat().find(m => m.id === messageId);
    return message?.attachments.find(f => f.id === file?.id);
  });
  const [preview, setPreview] = useState<{ authority: string; url?: string; error?: boolean }>({ authority: "" });
  const [revision, setRevision] = useState(0), [downloadError, setDownloadError] = useState(false);
  const path = current?.state === "available" ? current.contentPath : undefined;
  useEffect(() => {
    if (!open || !path) { setPreview({ authority: "" }); return; }
    const controller = new AbortController(); let url: string | null = null;
    setPreview({ authority: "" }); setDownloadError(false);
    void fileRequest<Blob>(path, { binary: true, signal: controller.signal }).then(blob => {
      if (controller.signal.aborted) return;
      url = URL.createObjectURL(blob); setPreview({ authority, url });
    }).catch(() => { if (!controller.signal.aborted) setPreview({ authority, error: true }); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [open, path, authority, revision]);
  if (!file) return null;
  const loaded = preview.authority === authority ? preview.url : undefined;
  const denied = !current || current.state === "unavailable" || !path || (preview.authority === authority && preview.error);
  return <Modal open={open} onClose={onClose} title={loaded ? current!.name : t("fileReferences.checking", "Checking file access")} width={640} footer={<>
    <Button size="sm" onClick={onClose}>{t("common.close", "Close")}</Button>
    {loaded && current?.reference ? <Button variant="primary" size="sm" disabled={opening} onClick={() => { const signature = fileAuthority(); setOpening(true); setOpenError(false); void openFileReference(current.reference!, locale).catch(() => { if (signature === fileAuthority()) setOpenError(true); }).finally(() => { if (signature === fileAuthority()) setOpening(false); }); }}><ArrowSquareOut size={14} aria-hidden />{t("file.openInManager", "Open in Files")}</Button> : null}
  </>}>
    {denied ? <div className="flex flex-col gap-3"><p role="alert" className="text-body-sm text-fg-muted">{t("fileReferences.unavailableBody", "The file was removed or your current permissions no longer allow access.")}</p><Button size="sm" onClick={() => setRevision(v => v + 1)}>{t("fileReferences.retry", "Retry")}</Button></div> : !loaded ? <p role="status" className="text-body-sm text-fg-muted">{t("fileReferences.loading", "Loading file…")}</p> : <div className="flex flex-col gap-4">
      {current!.mimetype?.startsWith("image/") ? <img src={loaded} alt={current!.name} className="max-h-[55dvh] w-full rounded-field object-contain" /> : current!.mimetype === "application/pdf" ? <iframe title={current!.name} src={loaded} className="h-[50dvh] w-full rounded-field border border-line" /> : <div className="grid h-32 place-items-center rounded-field bg-sunken"><FileText size={42} aria-hidden /></div>}
      <div className="flex flex-wrap items-center gap-2 text-body-sm"><bdi className="min-w-0 flex-1 break-all">{current!.name}</bdi><span className="text-fg-muted">{typeof current!.bytes === "number" ? format.bytes(current!.bytes) : current!.size}</span></div>
      {context ? <p className="text-caption text-fg-muted">{t("file.sharedIn", "Shared in")}: {context}</p> : null}
      {downloadError ? <p role="alert" className="text-body-sm text-danger">{t("fileReferences.downloadError", "The file could not be downloaded. Check your access and retry.")}</p> : null}
      {openError ? <p role="alert" className="text-body-sm text-danger">{t("fileReferences.openError", "Files could not be opened. Check your access and retry.")}</p> : null}
      <Button size="sm" onClick={() => { void downloadReference(path!, current!.name).catch(() => setDownloadError(true)); }}><DownloadSimple size={14} aria-hidden />{t("file.download", "Download")}</Button>
    </div>}
  </Modal>;
}
