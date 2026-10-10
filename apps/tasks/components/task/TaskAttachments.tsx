"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DownloadSimple, Eye, File, FileImage, FilePdf, Paperclip, Trash } from "@phosphor-icons/react";
import { Button, ConnectedFeature, ConfirmDialog, Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, IconButton, ListStates, useFormatter, useSuite } from "@orgtik/ui";
import { useAppDispatch } from "@/redux/app/hooks";
import { taskApi } from "@/redux/features/task/taskApi";
import { downloadAttachmentFile } from "@/lib/downloadAttachmentFile";
import { FilesPicker } from "./FilesPicker";
import { fileRequest, fileScope, fileAuthority, FileRequestError, newFileAttempt, downloadReference, recalledAttempt, rememberAttempt, useFileAuthority, type FileReference, type FilePickerItem, type FileAttempt } from "@/lib/file-references";

export type Attachment = { id: number; fileUrl: string | null; originalName: string; mimetype: string; size: number; reference?: FileReference; state?: "available" | "unavailable"; contentPath?: string };
const iconFor = (mime: string) => mime.startsWith("image/") ? <FileImage aria-hidden className="size-5 shrink-0 text-fg-muted" /> : mime === "application/pdf" ? <FilePdf aria-hidden className="size-5 shrink-0 text-fg-muted" /> : <File aria-hidden className="size-5 shrink-0 text-fg-muted" />;
export function TaskAttachments({ taskId, files: initialFiles, readOnly }: { taskId: number; files: Attachment[]; readOnly: boolean }) {
  const t = useTranslations("FileReferences"), f = useFormatter(), authority = useFileAuthority(), dispatch = useAppDispatch();
  const suite = useSuite();
  const requestFiles = () => suite.mutate("/access-requests", "POST", { tool: "files", reason: "Attach a Files reference to a task" });
  const trialFiles = async () => { const plans = await suite.request<{ id: string; trialDays: number }[]>("/tools/files/plans"); const plan = plans.find(row => row.trialDays > 0); if (!plan) throw new Error(t("noAccessBody")); await suite.mutate("/tools/files/trial", "POST", { planId: plan.id }); dispatch(taskApi.util.invalidateTags(["Task"])); };
  const storageKey = "orgtik:task-files:" + fileScope() + ":" + taskId;
  const [result, setResult] = useState<{ authority: string; files?: Attachment[]; error?: FileRequestError }>({ authority: "" });
  const [revision, setRevision] = useState(0), [picker, setPicker] = useState(false), [removing, setRemoving] = useState<Attachment | null>(null);
  const [attempt, setAttempt] = useState<FileAttempt | null>(null), [busy, setBusy] = useState(false), [issue, setIssue] = useState<string | null>(null);
  const [preview, setPreview] = useState<Attachment | null>(null), [image, setImage] = useState<{ authority: string; url?: string; error?: boolean }>({ authority: "" });
  useEffect(() => { setAttempt(recalledAttempt(storageKey)); setBusy(false); setIssue(null); setPreview(null); }, [storageKey]);
  useEffect(() => {
    if (!preview?.contentPath) { setImage({ authority: "" }); return; }
    const controller = new AbortController(); let url: string | null = null;
    setImage({ authority: "" });
    void fileRequest<Blob>(preview.contentPath, { binary: true, signal: controller.signal }).then(blob => {
      if (controller.signal.aborted || authority !== fileAuthority()) return;
      url = URL.createObjectURL(blob); setImage({ authority, url });
    }).catch(() => {
      if (!controller.signal.aborted && authority === fileAuthority()) { setImage({ authority, error: true }); setRevision(v => v + 1); }
    });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [preview, authority]);
  useEffect(() => {
    const controller = new AbortController();
    setResult({ authority: "" });
    const load = () => fileRequest<{ attachments: Attachment[] }>("/api/tasks/" + taskId, { signal: controller.signal }).then(data => { if (!controller.signal.aborted) setResult({ authority, files: data.attachments ?? [] }); }).catch(error => { if (!controller.signal.aborted) setResult({ authority, error }); });
    void load();
    const timer = window.setInterval(() => { void load(); }, 15000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [taskId, authority, revision, initialFiles]);
  const files = result.authority === authority ? result.files : undefined, error = result.authority === authority ? result.error : undefined;
  const previewCurrent = Boolean(preview && files?.some(file => file.id === preview.id && file.state !== "unavailable"));
  useEffect(() => { if (preview && files && !previewCurrent) setPreview(null); }, [preview, files, previewCurrent]);
  const status = !files && !error ? "loading" : error ? [401, 403].includes(error.status) ? "forbidden" : "error" : "ready";
  const keepAttempt = (a: FileAttempt | null) => { setAttempt(a); rememberAttempt(storageKey, a); };
  const execute = async (a: FileAttempt) => {
    const originalAuthority = fileAuthority();
    keepAttempt(a); setBusy(true); setIssue(null);
    try {
      await fileRequest<unknown>(a.path, { attempt: a });
      if (originalAuthority !== fileAuthority()) return;
      keepAttempt(null); setPicker(false); setRemoving(null); setRevision(v => v + 1);
      dispatch(taskApi.util.invalidateTags(["Task"]));
    } catch (error) {
      if (originalAuthority !== fileAuthority()) return;
      const e = error instanceof FileRequestError ? error : new FileRequestError("transport_unavailable", 0, true);
      const unknown = e.uncertain || Boolean(a.uncertain);
      if (unknown) keepAttempt({ ...a, uncertain: true }); else keepAttempt(null);
      setIssue(unknown ? "uncertain" : [401, 403].includes(e.status) ? "noAccessBody" : "saveError");
    } finally { if (originalAuthority === fileAuthority()) setBusy(false); }
  };
  const pick = (file: FilePickerItem) => { void execute(newFileAttempt("/api/tasks/" + taskId + "/attachments", "POST", { references: [{ workspaceId: file.workspaceId, fileId: file.fileId, versionId: file.versionId }] })); };
  return <section aria-labelledby={"task-files-" + taskId} className="flex flex-col gap-3">
    <h3 id={"task-files-" + taskId} className="text-label text-fg-muted">{t("files", { count: files?.length ?? 0 })}</h3>
    <ListStates status={status} empty={{ title: t("noFiles") }} forbidden={{ title: t("noAccess"), description: t("noAccessBody") }} onRetry={() => setRevision(v => v + 1)} size="compact">
      {files?.length ? <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {files.map(a => <li key={a.id} className="flex items-center gap-3 rounded-card border border-line bg-raised p-2.5">
          {iconFor(a.mimetype)}
          <span className="min-w-0 flex-1"><bdi className="block truncate text-body-sm font-semibold text-fg">{a.state === "unavailable" ? t("unavailable") : a.originalName}</bdi><span className="text-caption text-fg-muted">{a.state === "unavailable" ? t("unavailableBody") : f.bytes(a.size)}</span></span>
          {a.state !== "unavailable" && a.mimetype.startsWith("image/") && (a.contentPath || a.fileUrl) ? <IconButton label={t("preview", { name: a.originalName })} icon={<Eye />} variant="ghost" size="sm" onClick={() => setPreview(a)} /> : null}
          {a.state !== "unavailable" && (a.contentPath || a.fileUrl) ? <IconButton label={t("download", { name: a.originalName })} icon={<DownloadSimple />} variant="ghost" size="sm" onClick={() => { const signature = fileAuthority(); void (a.contentPath ? downloadReference(a.contentPath, a.originalName) : downloadAttachmentFile(a.fileUrl!, a.originalName)).catch(() => { if (signature === fileAuthority()) { setIssue("openError"); setRevision(v => v + 1); } }); }} /> : null}
          {readOnly || attempt ? null : <IconButton label={t("remove", { name: a.state === "unavailable" ? t("unavailable") : a.originalName })} icon={<Trash />} variant="ghost" size="sm" onClick={() => setRemoving(a)} />}
        </li>)}
      </ul> : <p className="text-body-sm text-fg-subtle">{t("noFiles")}</p>}
    </ListStates>
    {issue ? <p role="alert" className="text-body-sm text-danger">{t(issue)}</p> : null}
    <ConnectedFeature requires="files" source="tasks" compact onTrial={trialFiles} onRequestAccess={requestFiles} onRequestTool={requestFiles} billingHref={`${suite.sosUrl}/billing`} settingsHref="/admin/connections">{attempt ? <div className="flex flex-col gap-2"><p className="text-body-sm text-fg-muted">{t(attempt.scope === fileScope() ? "uncertain" : "originalWorkspace")}</p><Button variant="secondary" size="sm" disabled={busy || readOnly || attempt.scope !== fileScope()} loading={busy} onClick={() => void execute(attempt)}>{t("recover")}</Button></div> : readOnly ? <p className="text-caption text-fg-muted">{t("readOnly")}</p> : <Button variant="secondary" size="sm" startIcon={<Paperclip />} disabled={busy || status !== "ready"} onClick={() => setPicker(true)}>{t("attach")}</Button>}</ConnectedFeature>
    <FilesPicker taskId={taskId} open={picker} onOpenChange={setPicker} onPick={pick} disabled={busy || Boolean(attempt) || readOnly} />
    <Dialog open={previewCurrent} onOpenChange={open => !open && setPreview(null)}><DialogContent size="xl"><DialogHeader><DialogTitle>{preview?.contentPath && !image.url ? t("checking") : preview?.originalName}</DialogTitle></DialogHeader><DialogBody>
      {preview?.contentPath ? image.authority !== authority || !image.url && !image.error ? <p role="status">{t("loading")}</p> : image.error ? <p role="alert">{t("unavailableBody")}</p> : <img src={image.url} alt={preview.originalName} className="mx-auto max-h-[70dvh] rounded-field object-contain" /> : preview?.fileUrl ? <img src={preview.fileUrl} alt={preview.originalName} className="mx-auto max-h-[70dvh] rounded-field object-contain" /> : null}
    </DialogBody></DialogContent></Dialog>
    <ConfirmDialog open={Boolean(removing)} onOpenChange={open => !open && !busy && setRemoving(null)} title={t("removeTitle")} impact={t("removeBody")} confirmLabel={t("removeConfirm")} cancelLabel={t("close")} onConfirm={async () => { if (removing) await execute(newFileAttempt("/api/tasks/attachments/" + removing.id, "DELETE")); }} />
  </section>;
}
