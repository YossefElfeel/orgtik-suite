"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@orgtik/ui";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { readClientSession } from "@orgtik/ui/auth";
import { fetchProtectedFile } from "@/lib/fetch-protected-file";
import { fileAuthority, useFileAuthority } from "@/lib/file-references";
import { openWhiteboard } from "@/lib/open-whiteboard";
import type { IFile } from "@/types";
export function StructuredBoardPreview({ file }: { file: IFile }) {
  const t = useTranslations("WhiteboardPreview"), locale = useLocale(), authority = useFileAuthority();
  const [result, setResult] = useState<{ authority: string; url?: string; error?: boolean }>({ authority: "" }), [revision, setRevision] = useState(0), [opening, setOpening] = useState(false), [openError, setOpenError] = useState(false);
  const board = file.whiteboard;
  useEffect(() => {
    const controller = new AbortController(); let url: string | null = null;
    setResult({ authority: "" }); setOpening(false); setOpenError(false);
    if (!board?.preview?.url) return;
    void fetchProtectedFile(board.preview.url, null, controller.signal).then(blob => {
      if (controller.signal.aborted || authority !== fileAuthority()) return;
      url = URL.createObjectURL(blob); setResult({ authority, url });
    }).catch(() => { if (!controller.signal.aborted && authority === fileAuthority()) setResult({ authority, error: true }); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [board?.preview?.url, authority, revision]);
  const url = result.authority === authority ? result.url : undefined, error = result.authority === authority && result.error;
  if (!board) return null;
  return <section className="flex h-full w-full flex-col items-center justify-center gap-4 overflow-y-auto p-5">
    <h2 className="text-title font-semibold text-fg">{t("title")}</h2>
    {url ? <img src={url} alt={t("sampleAlt")} className="max-h-[40vh] w-full max-w-xl rounded-card object-contain" /> : <p role={error ? "alert" : "status"} className="text-body-sm text-fg-muted">{t(error ? "unavailable" : "loading")}</p>}
    <p className="max-w-prose text-center text-body-sm text-fg-muted">{t("sampleCaption")}</p>
    {error ? <Button variant="secondary" onClick={() => setRevision(value => value + 1)}>{t("retry")}</Button> : null}
    {openError ? <p role="alert" className="text-body-sm text-danger">{t("openFailed")}</p> : null}
    <Button disabled={!url || opening} loading={opening} startIcon={<ArrowSquareOut />} onClick={() => {
      const signature = fileAuthority(), context = file.workspaceId || readClientSession()?.workspaceContext?.workspace.id;
      if (!context) { setOpenError(true); return; }
      setOpening(true); setOpenError(false);
      void openWhiteboard(board.boardId, board.versionId, context, locale).catch(() => { if (signature === fileAuthority()) setOpenError(true); }).finally(() => { if (signature === fileAuthority()) setOpening(false); });
    }}>{t("open")}</Button>
  </section>;
}

