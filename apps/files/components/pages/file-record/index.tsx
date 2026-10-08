"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, ListStates } from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import MainTitles from "@/components/shared/MainTitles";
import { FileCard } from "@/components/shared/FileCard";
import { fileRequest, useFileAuthority, type FileRequestError } from "@/lib/file-references";
import type { IFile } from "@/types";
export function FileRecord({ fileId }: { fileId: string }) {
  const t = useTranslations("SampleFiles"), authority = useFileAuthority(), router = useRouter();
  const [revision, setRevision] = useState(0), [result, setResult] = useState<{ authority: string; file?: IFile; error?: FileRequestError }>({ authority: "" });
  useEffect(() => {
    const controller = new AbortController(); setResult({ authority: "" });
    const load = () => fileRequest<IFile>("/api/v1/files/" + encodeURIComponent(fileId), { signal: controller.signal }).then(file => { if (!controller.signal.aborted) setResult({ authority, file }); }).catch(error => { if (!controller.signal.aborted) setResult({ authority, error }); });
    void load(); const timer = window.setInterval(() => { void load(); }, 15000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [fileId, authority, revision]);
  const file = result.authority === authority ? result.file : undefined, error = result.authority === authority ? result.error : undefined;
  const status = !file && !error ? "loading" : error ? error.status === 404 ? "empty" : [401, 403].includes(error.status) ? "forbidden" : "error" : "ready";
  return <main className="flex flex-col gap-6 p-4 lg:p-0">
    <MainTitles title={t("recordTitle")}><Button variant="secondary" onClick={() => router.push("/")}>{t("back")}</Button></MainTitles>
    <ListStates status={status} empty={{ title: t("unavailable"), description: t("unavailableBody") }} forbidden={{ title: t("noAccess"), description: t("noAccessBody") }} onRetry={() => setRevision(v => v + 1)}>
      {file ? <div className="w-full max-w-sm"><FileCard file={file} /></div> : null}
    </ListStates>
  </main>;
}
