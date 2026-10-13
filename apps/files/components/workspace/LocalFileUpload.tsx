"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogContent, DialogTitle, Field, FileField } from "@orgtik/ui";
import { readClientSession, refreshClientSession } from "@orgtik/ui/auth";
import { API_URL, SOS_API_URL } from "@/constants/env";
import { fileAuthority, fileScope } from "@/lib/file-references";
const MAX = 10 * 1024 * 1024;
export function LocalFileUpload({ parentId, disabled, onSaved }: { parentId: string | null; disabled: boolean; onSaved: () => Promise<unknown> }) {
  const t = useTranslations("Roadmap"), [open, setOpen] = useState(false), [error, setError] = useState(false);
  const form = useForm<{ files: File[] }>({ resolver: zodResolver(z.object({ files: z.array(z.custom<File>(value => typeof File !== "undefined" && value instanceof File && value.size > 0 && value.size <= MAX)).length(1) })), defaultValues: { files: [] } });
  const [operationId, setOperationId] = useState<string>();
  const submit = form.handleSubmit(async ({ files }) => {
    const file = files[0]!, scope = fileScope(), authority = fileAuthority(), operation = operationId || crypto.randomUUID();
    setOperationId(operation); setError(false);
    try {
      const send = () => fetch(API_URL.replace(/\/api$/, "") + "/api/v1/files/local-upload", { method: "POST", headers: { Authorization: "Bearer " + readClientSession()?.tokens.accessToken, "Content-Type": "application/vnd.orgtik.local-upload", "X-File-Name": encodeURIComponent(file.name), "X-File-Type": file.type || "text/plain", "X-Folder-Id": parentId || "", "Idempotency-Key": operation }, body: file });
      let response = await send();
      if (response.status === 401) { await refreshClientSession(SOS_API_URL); if (scope !== fileScope() || authority !== fileAuthority()) throw Error("context_changed"); response = await send(); }
      if (!response.ok) { if ([400, 403, 413, 422, 501].includes(response.status)) setOperationId(undefined); throw Error("upload_refused"); }
      if (scope !== fileScope() || authority !== fileAuthority()) throw Error("context_changed");
      await response.json(); await onSaved(); form.reset(); setOperationId(undefined); setOpen(false);
    } catch { setError(true); }
  });
  return <><Button variant="secondary" disabled={disabled} onClick={() => setOpen(true)}>{t("upload")}</Button><Dialog open={open} onOpenChange={value => { if (!form.formState.isSubmitting) setOpen(value); }}><DialogContent><DialogTitle>{t("upload")}</DialogTitle><form className="flex flex-col gap-4" onSubmit={submit}><p className="text-body-sm text-fg-muted">{t("localOnly")} · 10 MB</p><Field label={t("chooseFile")} error={form.formState.errors.files ? t("fileError") : undefined}><FileField label={t("chooseFile")} multiple={false} maxFiles={1} value={form.watch("files")} onChange={files => { if (operationId) return; form.setValue("files", files, { shouldValidate: true }); setError(false); }} maxSize={MAX} disabled={form.formState.isSubmitting || Boolean(operationId)} accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain,text/csv,text/markdown,application/json,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation" /></Field><Button type="submit" disabled={disabled || !form.watch("files").length} loading={form.formState.isSubmitting}>{t("upload")}</Button>{error ? <p role="alert" className="text-danger">{t("fileError")}</p> : null}</form></DialogContent></Dialog></>;
}
