"use client";

// The share page's header: who it's from (the OrgTik mark), what's shared, and the download. When
// the owner turned downloads off, a banner says so, in words and with an icon.
import { useTranslations } from "next-intl";
import { DownloadSimple, Eye } from "@phosphor-icons/react";
import { Button, Logo } from "@orgtik/ui";
import { PublicShareFile, PublicShareMetadata } from "@/types";

interface PublicShareHeaderProps {
  metadata: PublicShareMetadata;
  previewFile: PublicShareFile | null;
  downloading: boolean;
  onDownload: () => void;
}

export function PublicShareHeader({ metadata, previewFile, downloading, onDownload }: PublicShareHeaderProps) {
  const t = useTranslations("PublicShare");
  const canDownload = metadata.capabilities.canDownload;
  const title = previewFile ? previewFile.originalName || previewFile.name : metadata.resource.name;

  return (
    <header className="border-b border-line bg-raised">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div className="flex min-w-0 flex-col gap-1">
          <Logo variant="wordmark" tone="brand" className="h-5 text-fg" />
          <h1 dir="auto" title={title} className="truncate font-display text-title-sm text-fg">
            {title}
          </h1>
        </div>
        {canDownload ? (
          <Button variant="primary" loading={downloading} startIcon={<DownloadSimple />} onClick={onDownload} aria-label={t("downloadAria", { name: title })}>
            {t("download")}
          </Button>
        ) : null}
      </div>
      {!canDownload ? (
        <p className="flex items-center justify-center gap-2 border-t border-line bg-sunken px-4 py-2 text-center text-body-sm text-fg-muted">
          <Eye aria-hidden="true" className="size-4 shrink-0" />
          {t("viewOnlyBanner")}
        </p>
      ) : null}
    </header>
  );
}
