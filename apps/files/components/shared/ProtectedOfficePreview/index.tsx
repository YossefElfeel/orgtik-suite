"use client";

// An Office file inside the preview dialog. Word (.docx) renders inline; the other types say so in
// the reader's language and offer the download (the old copy was English only, and a failed render
// showed the raw error message).
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSelector } from "react-redux";
import { DownloadSimple } from "@phosphor-icons/react";
import { Button, Skeleton } from "@orgtik/ui";
import { RootState } from "@/redux/app/store";
import { fetchProtectedFile } from "@/lib/fetch-protected-file";
import { getProtectedFileUrl } from "@/lib/get-protected-file-url";
import { useFileActions } from "@/hooks/useFileActions";
import { FileTypeIcon } from "@/components/shared/FileTypeIcon";
import type { IFile } from "@/types";

interface ProtectedOfficePreviewProps {
  file: Pick<IFile, "url" | "path" | "name" | "displayName" | "id">;
  extension: string;
  title: string;
}

export function ProtectedOfficePreview({ file, extension, title }: ProtectedOfficePreviewProps) {
  const t = useTranslations("Files");
  const tc = useTranslations("Common");
  const protectedUrl = getProtectedFileUrl(file);
  const token = useSelector((state: RootState) => state.auth.token);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { handleDownload } = useFileActions();

  const canRenderInline = extension === "docx";

  useEffect(() => {
    if (!canRenderInline || !protectedUrl || !containerRef.current) {
      setLoading(false);
      return;
    }

    const container = containerRef.current;
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    container.innerHTML = "";

    void (async () => {
      try {
        const [blob, { renderAsync }] = await Promise.all([fetchProtectedFile(protectedUrl, token, controller.signal), import("docx-preview")]);
        if (controller.signal.aborted) return;

        await renderAsync(blob, container, undefined, {
          className: "docx-preview-body",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          useBase64URL: true,
        });
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      controller.abort();
      container.innerHTML = "";
    };
  }, [canRenderInline, protectedUrl, token]);

  const fallback = (message: string) => (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <FileTypeIcon name={file.name} className="size-16" />
      <p className="max-w-sm text-body-sm text-fg-muted">{message}</p>
      <Button variant="primary" startIcon={<DownloadSimple />} onClick={() => handleDownload(file, "file")}>
        {tc("download")}
      </Button>
    </div>
  );

  if (!canRenderInline) return fallback(t("officeNoInline", { type: extension.toUpperCase() }));

  return (
    <div className="relative h-full w-full overflow-auto bg-sunken">
      {loading ? <Skeleton className="absolute inset-0 z-10 rounded-none" /> : null}
      {failed ? (
        fallback(t("officePreviewFailed"))
      ) : (
        <div className="p-4">
          {/* The document's own page: paper stays white in both themes, like the file itself. */}
          <div ref={containerRef} className="mx-auto max-w-4xl bg-white shadow-raised" title={title} />
        </div>
      )}
    </div>
  );
}
