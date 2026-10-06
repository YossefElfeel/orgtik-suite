"use client";

// A shared folder, for someone outside the company. Each row opens its item, and the download is
// its own named button beside it (it was a fake button inside the row's button: two controls in
// one, which keyboards and screen readers can't separate). The path is a named breadcrumb whose last
// step is the current folder; loading, empty and error each have their state.
import { useTranslations } from "next-intl";
import { CaretRight, DownloadSimple, Folder } from "@phosphor-icons/react";
import { Button, EmptyState, ErrorState, IconButton, LoadingState, useFormatter } from "@orgtik/ui";
import { FileTypeIcon } from "@/components/shared/FileTypeIcon";
import { PublicShareFile, PublicShareFolder, PublicShareItemsResponse } from "@/types";

export interface BreadcrumbEntry {
  id: string;
  name: string;
}

interface PublicShareFolderViewProps {
  breadcrumbs: BreadcrumbEntry[];
  items?: PublicShareItemsResponse;
  isLoading: boolean;
  isError: boolean;
  canDownload: boolean;
  onBreadcrumbClick: (index: number) => void;
  onOpenFolder: (folder: PublicShareFolder) => void;
  onOpenFile: (file: PublicShareFile) => void;
  onDownloadFile: (file: PublicShareFile) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onRetry?: () => void;
}

export function PublicShareFolderView({
  breadcrumbs,
  items,
  isLoading,
  isError,
  canDownload,
  onBreadcrumbClick,
  onOpenFolder,
  onOpenFile,
  onDownloadFile,
  onPrevPage,
  onNextPage,
  onRetry,
}: PublicShareFolderViewProps) {
  const t = useTranslations("PublicShare");
  const f = useFormatter();

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label={t("pathLabel")}>
        <ol className="flex flex-wrap items-center gap-1 text-body-sm">
          {breadcrumbs.map((crumb, index) => {
            const last = index === breadcrumbs.length - 1;
            const label = index === 0 ? t("root") : crumb.name;
            return (
              <li key={crumb.id} className="flex items-center gap-1">
                {index > 0 ? <CaretRight aria-hidden="true" className="size-3.5 text-fg-subtle rtl:-scale-x-100" /> : null}
                {last ? (
                  <span aria-current="page" dir="auto" className="px-1 font-medium text-fg">
                    {label}
                  </span>
                ) : (
                  <button type="button" dir="auto" onClick={() => onBreadcrumbClick(index)} className="rounded-field px-1 text-fg-muted underline-offset-2 hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                    {label}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {isLoading ? <LoadingState rows={5} label={t("opening")} /> : null}
      {isError ? <ErrorState size="compact" title={t("folderFailed")} onRetry={onRetry} /> : null}
      {items && items.items.length === 0 ? <EmptyState size="compact" icon={<Folder />} title={t("emptyFolder")} /> : null}

      {items && items.items.length > 0 ? (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-raised">
          {items.items.map((entry) => {
            const isFolder = entry.type === "folder";
            const name = entry.type === "file" ? entry.originalName || entry.name : entry.name;
            return (
              <li key={entry.id} className="flex items-center gap-2 pe-2">
                <button
                  type="button"
                  onClick={() => (isFolder ? onOpenFolder(entry) : onOpenFile(entry))}
                  aria-label={isFolder ? t("openFolder", { name }) : t("openFile", { name })}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-start hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                >
                  {isFolder ? (
                    <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center text-fg-brand">
                      <Folder weight="duotone" className="size-full" />
                    </span>
                  ) : (
                    <FileTypeIcon name={name} mimeType={entry.mimeType} />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span dir="auto" className="truncate text-body-sm font-medium text-fg">
                      {name}
                    </span>
                    {entry.type === "file" ? <span className="text-caption tabular-nums text-fg-muted">{f.bytes(entry.size)}</span> : null}
                  </span>
                </button>
                {entry.type === "file" && canDownload ? (
                  <IconButton variant="ghost" size="sm" label={t("downloadAria", { name })} icon={<DownloadSimple />} onClick={() => onDownloadFile(entry)} />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {items && items.meta.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" size="sm" disabled={!items.meta.hasPrev} onClick={onPrevPage}>
            {t("prevPage")}
          </Button>
          <span className="text-caption tabular-nums text-fg-muted">{t("pageOf", { page: items.meta.page, total: items.meta.totalPages })}</span>
          <Button variant="secondary" size="sm" disabled={!items.meta.hasNext} onClick={onNextPage}>
            {t("nextPage")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
