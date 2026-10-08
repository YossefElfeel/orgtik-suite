"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { File, Plus } from "@phosphor-icons/react";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, ListStates, useFormatter } from "@orgtik/ui";
import { useAppDispatch } from "@/redux/app/hooks";
import { baseApi } from "@/redux/app/baseApi";
import { fileRequest, fileScope, fileAuthority, FileRequestError, newFileAttempt, recalledAttempt, rememberAttempt, useFileAuthority, type FileAttempt } from "@/lib/file-references";
import type { IFile } from "@/types";
import type { FileUploadTab } from "@/lib/upload/types";
export type { FileUploadTab };
type Sample = { sampleId: string; name: string; mimetype: string; size: number };
type Catalog = { items: Sample[]; canCreate: boolean };

/** This hosted prototype creates records from packaged bytes; no device upload is promised. */
export function FileUploadDialog({ onUpload, folderId, open, onOpenChange }: {
  onUpload?: (file: IFile) => void; folderId?: string; open?: boolean; onOpenChange?: (open: boolean) => void;
  initialFiles?: { file: File; relativePath: string }[]; initialActiveTab?: FileUploadTab;
}) {
  const t = useTranslations("SampleFiles"), f = useFormatter(), authority = useFileAuthority(), dispatch = useAppDispatch();
  const [ownOpen, setOwnOpen] = useState(false), [selected, setSelected] = useState(""), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ authority: string; data?: Catalog; error?: FileRequestError }>({ authority: "" });
  const [attempt, setAttempt] = useState<FileAttempt | null>(null), [issue, setIssue] = useState<string | null>(null);
  const shown = open ?? ownOpen, key = "orgtik:sample-file:" + fileScope() + ":" + (folderId || "root");
  const changeOpen = (next: boolean) => { if (busy) return; setOwnOpen(next); onOpenChange?.(next); };
  useEffect(() => { const a = recalledAttempt(key); setAttempt(a); setBusy(false); setIssue(null); setSelected(a ? (a.body as { sampleId?: string })?.sampleId || "" : ""); }, [key]);
  useEffect(() => {
    if (!shown) return;
    const controller = new AbortController(); setResult({ authority: "" });
    void fileRequest<Catalog>("/api/v1/files/samples", { signal: controller.signal }).then(data => { if (!controller.signal.aborted) setResult({ authority, data }); }).catch(error => { if (!controller.signal.aborted) setResult({ authority, error }); });
    return () => controller.abort();
  }, [shown, authority, revision]);
  const data = result.authority === authority ? result.data : undefined, error = result.authority === authority ? result.error : undefined;
  const status = !data && !error ? "loading" : error ? [401, 403].includes(error.status) ? "forbidden" : "error" : data?.items.length ? "ready" : "empty";
  const keep = (a: FileAttempt | null) => { setAttempt(a); rememberAttempt(key, a); };
  const create = async () => {
    if (!data?.canCreate || busy || (!selected && !attempt)) return;
    const a = attempt || newFileAttempt("/api/v1/files/samples", "POST", { sampleId: selected, ...(folderId ? { parentId: folderId } : {}) });
    const originalAuthority = fileAuthority();
    keep(a); setBusy(true); setIssue(null);
    try {
      const file = await fileRequest<IFile>(a.path, { attempt: a });
      if (originalAuthority !== fileAuthority()) return;
      keep(null); setSelected(""); dispatch(baseApi.util.invalidateTags(["File", "Folder"]));
      onUpload?.(file); setOwnOpen(false); onOpenChange?.(false);
    } catch (error) {
      if (originalAuthority !== fileAuthority()) return;
      const e = error instanceof FileRequestError ? error : new FileRequestError("transport_unavailable", 0, true);
      const unknown = e.uncertain || Boolean(attempt?.uncertain);
      if (unknown) keep({ ...a, uncertain: true }); else keep(null);
      setIssue(unknown ? "uncertain" : [401, 403].includes(e.status) ? "noAccessBody" : "saveError");
    } finally { if (originalAuthority === fileAuthority()) setBusy(false); }
  };
  return <>
    {open === undefined ? <Button variant="secondary" size="lg" startIcon={<Plus />} onClick={() => changeOpen(true)}>{t("add")}</Button> : null}
    <Dialog open={shown} onOpenChange={changeOpen}><DialogContent size="lg" className="max-h-[90dvh]">
      <DialogHeader><DialogTitle>{t("title")}</DialogTitle><DialogDescription>{t("body")}</DialogDescription></DialogHeader>
      <DialogBody className="flex min-h-0 flex-col gap-4 overflow-y-auto">
        <ListStates status={status} empty={{ title: t("empty") }} forbidden={{ title: t("noAccess"), description: t("noAccessBody") }} onRetry={() => setRevision(v => v + 1)}>
          <ul className="flex flex-col gap-1" aria-label={t("choose")}>
            {data?.items.map(sample => <li key={sample.sampleId}><button type="button" aria-pressed={selected === sample.sampleId} disabled={busy || Boolean(attempt) || !data.canCreate} onClick={() => setSelected(sample.sampleId)} className={"flex w-full items-center gap-3 rounded-field border px-3 py-3 text-start focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50 " + (selected === sample.sampleId ? "border-action-primary bg-brand-subtle" : "border-transparent hover:bg-hover")}>
              <File aria-hidden className="size-6 shrink-0 text-fg-muted" /><span className="min-w-0 flex-1"><bdi className="block truncate text-body-sm font-medium text-fg">{sample.name}</bdi><span className="text-caption text-fg-muted">{f.bytes(sample.size)}</span></span>
            </button></li>)}
          </ul>
        </ListStates>
        {data && !data.canCreate ? <p className="text-body-sm text-fg-muted">{t("readOnly")}</p> : null}
        {attempt ? <p role="status" className="text-body-sm text-fg-muted">{t(attempt.scope === fileScope() ? "uncertain" : "originalWorkspace")}</p> : null}
        {issue ? <p role="alert" className="text-body-sm text-danger">{t(issue)}</p> : null}
        <p className="text-caption text-fg-subtle">{t("uploadsDeferred")}</p>
      </DialogBody>
      <DialogFooter><Button variant="secondary" disabled={busy} onClick={() => changeOpen(false)}>{t("close")}</Button><Button loading={busy} disabled={busy || !data?.canCreate || !selected || (attempt !== null && attempt.scope !== fileScope())} onClick={() => void create()}>{t(attempt ? "recover" : "create")}</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}
