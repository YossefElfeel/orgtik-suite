"use client";

// A file as a card (grid view, recent files): its preview, name, where it is (the folder's name;
// the old card showed the folder's id), when and by whom it was added, its size. Dates and sizes
// use the library formatter, so the server and the browser write them the same (no hydration error).
import { useTranslations } from "next-intl";
import { CheckCircle } from "@phosphor-icons/react";
import { useFormatter } from "@orgtik/ui";
import { cn } from "@/lib/utils";
import { IFile } from "@/types";
import FileDropdownMenu from "@/components/shared/FileDropdownMenu";
import { FilePreview } from "@/components/shared/FilePreview";
import { FileTypeIcon } from "@/components/shared/FileTypeIcon";
import { RowActionsButton } from "@/components/shared/RowActionsButton";

interface FileCardProps {
  file: IFile;
  onPreview?: () => void;
}

export function FileCard({ file, onPreview }: FileCardProps) {
  const t = useTranslations("Common");
  const tf = useTranslations("Files");
  const f = useFormatter();
  const isImage = file.mimeType?.startsWith("image/");
  const name = file.displayName || file.name;
  const owner = file.owner ? [file.owner.firstName, file.owner.lastName].filter(Boolean).join(" ") || file.owner.username : null;
  const folder = (file as IFile & { folder?: { name?: string } }).folder?.name;

  return (
    <article className={cn("relative flex flex-col overflow-hidden rounded-card border bg-raised transition-shadow hover:shadow-raised", file.isUsed ? "border-action-primary" : "border-line")}>
      {file.isUsed ? (
        <span className="absolute start-2 top-2 z-10 inline-flex items-center gap-1 rounded-pill bg-action-primary px-2 py-0.5 text-caption font-medium text-on-action-primary">
          <CheckCircle weight="fill" aria-hidden="true" className="size-3.5" />
          {tf("inUse")}
        </span>
      ) : null}
      <div className="absolute end-2 top-2 z-10 rounded-pill bg-raised/90 shadow-raised">
        <FileDropdownMenu item={file} type="file">
          <RowActionsButton name={name} />
        </FileDropdownMenu>
      </div>
      {isImage && onPreview ? (
        <button type="button" onClick={onPreview} aria-label={tf("preview", { name })} className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus">
          <FilePreview file={file} isThumbnailOnly />
        </button>
      ) : (
        <div className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-sunken">
          <FilePreview file={file} isThumbnailOnly={false} />
        </div>
      )}
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-center gap-2">
          <FileTypeIcon name={file.name} mimeType={file.mimeType} className="size-[18px]" />
          <h3 dir="auto" title={name} className="min-w-0 flex-1 truncate text-body-sm font-semibold text-fg">
            {name}
          </h3>
        </div>
        <p dir="auto" className="truncate text-caption text-fg-muted">
          {folder || t("root")}
        </p>
        <div className="flex items-center justify-between gap-2 text-caption text-fg-subtle">
          <span>{f.date(file.createdAt, { dateStyle: "medium" })}</span>
          <span className="tabular-nums">{f.bytes(Number(file.size))}</span>
        </div>
        {owner ? (
          <p className="truncate text-caption text-fg-subtle">
            {t("createdBy")}: <bdi>{owner}</bdi>
          </p>
        ) : null}
      </div>
    </article>
  );
}
