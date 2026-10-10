"use client";
import {ChatConnection} from "./ChatFeatures";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { File, MagnifyingGlass } from "@phosphor-icons/react";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, ListStates, useFormatter } from "@orgtik/ui";
import { fileRequest, FileRequestError, useFileAuthority, type FilePickerItem, type FilePickerPage } from "@/lib/file-references";

export function FilesPicker({ channelId,resourceType="channel", open, onOpenChange, onPick, disabled }: { channelId: string;resourceType?:"channel"|"meeting"; open: boolean; onOpenChange: (open: boolean) => void; onPick: (file: FilePickerItem) => void; disabled?: boolean }) {
  const t = useT(), f = useFormatter(), authority = useFileAuthority();
  const [search, setSearch] = useState(""), [page, setPage] = useState(1), [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ authority: string; data?: FilePickerPage; error?: FileRequestError }>({ authority: "" });
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setResult({ authority: "" });
    const query = new URLSearchParams({ resourceType, resourceId: channelId, search, page: String(page), limit: "20" });
    void fileRequest<FilePickerPage>("/api/shared/files?" + query, { signal: controller.signal }).then(data => { if (!controller.signal.aborted) setResult({ authority, data }); }).catch(error => { if (!controller.signal.aborted) setResult({ authority, error }); });
    return () => controller.abort();
  }, [open, channelId,resourceType, search, page, authority, revision]);
  const data = result.authority === authority ? result.data : undefined, error = result.authority === authority ? result.error : undefined;
  const items=data?.items.filter(file=>resourceType!=="meeting"||file.mimetype==="video/mp4");
  const status = !data && !error ? "loading" : error ? [401, 403].includes(error.status) ? "forbidden" : "error" : items?.length ? "ready" : "empty";
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="lg" className="max-h-[90dvh]">
      <DialogHeader><DialogTitle>{t("fileReferences.pickerTitle", "Attach from Files")}</DialogTitle><DialogDescription>{t("fileReferences.pickerBody", "Choose a file you can access in this workspace. Its saved version will be referenced here.")}</DialogDescription></DialogHeader>
      <DialogBody className="flex min-h-0 flex-col gap-4 overflow-y-auto"><ChatConnection requires="files">
        <Input type="search" aria-label={t("fileReferences.search", "Search files")} placeholder={t("fileReferences.search", "Search files")} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} startIcon={<MagnifyingGlass />} />
        <ListStates status={status} empty={{ title: search ? t("fileReferences.noMatch", "No matching files") : t("fileReferences.empty", "No accessible files"), description: search ? t("fileReferences.noMatchBody", "Try another file name.") : t("fileReferences.emptyBody", "Add a packaged sample in Files, or ask its owner to share an existing file.") }} forbidden={{ title: t("fileReferences.noAccess", "Files are unavailable"), description: t("fileReferences.noAccessBody", "Your current workspace permissions do not allow this action.") }} onRetry={() => setRevision(v => v + 1)}>
          <ul className="flex flex-col gap-1">
            {items?.map(file => <li key={file.fileId + ":" + file.versionId}>
              <button type="button" disabled={disabled} onClick={() => onPick(file)} className="flex w-full items-center gap-3 rounded-field px-3 py-3 text-start hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50">
                <File aria-hidden className="size-6 shrink-0 text-fg-muted" /><span className="min-w-0 flex-1"><bdi className="block truncate text-body-sm font-medium text-fg">{file.name}</bdi><span className="text-caption text-fg-muted">{f.bytes(file.size)} · {t("fileReferences.version", "Version {version}", { version: file.version })}</span></span>
              </button>
            </li>)}
          </ul>
        </ListStates>
        {data && data.meta.totalPages > 1 ? <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t("fileReferences.previous", "Previous")}</Button><span className="text-caption text-fg-muted">{t("fileReferences.page", "Page {page} of {pages}", { page, pages: data.meta.totalPages })}</span><Button variant="secondary" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(p => p + 1)}>{t("fileReferences.next", "Next")}</Button></div> : null}
        <p className="text-caption text-fg-subtle">{t("fileReferences.uploadsDeferred", "Device uploads are deferred in this hosted prototype.")}</p>
      </ChatConnection></DialogBody>
      <DialogFooter><Button variant="secondary" onClick={() => onOpenChange(false)}>{t("fileReferences.close", "Close")}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
