"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import type { TicketNoteAttachment } from "@/types/tickets";

type Props = {
  attachment: TicketNoteAttachment;
  accent?: "team" | "customer";
};

function getExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? (parts.at(-1)?.toLowerCase() ?? "") : "";
}

function getFileKind(attachment: TicketNoteAttachment) {
  const extension = getExtension(attachment.name);

  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(extension)) {
    return "image" as const;
  }

  if (extension === "pdf") {
    return "pdf" as const;
  }

  if (["mp4", "webm", "mov", "avi", "mkv"].includes(extension)) {
    return "video" as const;
  }

  if (["mp3", "wav", "ogg", "m4a"].includes(extension)) {
    return "audio" as const;
  }

  if (["xls", "xlsx", "csv"].includes(extension)) {
    return "sheet" as const;
  }

  if (["doc", "docx", "txt", "rtf"].includes(extension)) {
    return "document" as const;
  }

  if (["zip", "rar", "7z"].includes(extension)) {
    return "archive" as const;
  }

  return "file" as const;
}

const kindIcons: Record<ReturnType<typeof getFileKind>, string> = {
  image: "solar:gallery-linear",
  pdf: "solar:file-text-linear",
  video: "solar:videocamera-linear",
  audio: "solar:music-note-linear",
  sheet: "solar:file-smile-linear",
  document: "solar:document-text-linear",
  archive: "solar:box-linear",
  file: "solar:file-linear",
};

export default function TicketNoteAttachmentItem({
  attachment,
  accent = "customer",
}: Props) {
  const kind = getFileKind(attachment);
  const isTeam = accent === "team";
  const href = attachment.url;

  if (kind === "image" && href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-xl border border-border bg-white"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={href}
          alt={attachment.name}
          className="max-h-56 w-full object-cover"
        />
        <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-1.5">
          <span className="truncate text-xs text-secondary">
            {attachment.name}
          </span>
        </div>
      </a>
    );
  }

  if (kind === "video" && href) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <video
          src={href}
          controls
          className="max-h-56 w-full bg-black object-contain"
        >
          <track kind="captions" />
        </video>
        <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-1.5">
          <span className="truncate text-xs text-secondary">
            {attachment.name}
          </span>
        </div>
      </div>
    );
  }

  if (kind === "audio" && href) {
    return (
      <div className="rounded-xl border border-border bg-white px-3 py-2.5">
        <div className="mb-2 flex items-center gap-2">
          <Icon
            icon={kindIcons.audio}
            className={cn(
              "size-4 shrink-0",
              isTeam ? "text-primary" : "text-secondary",
            )}
          />
          <span
            className={cn(
              "truncate text-xs font-medium",
              isTeam ? "text-primary" : "text-foreground",
            )}
          >
            {attachment.name}
          </span>
        </div>
        <audio src={href} controls className="w-full">
          <track kind="captions" />
        </audio>
      </div>
    );
  }

  const content = (
    <>
      <Icon
        icon={kindIcons[kind]}
        className={cn(
          "size-4 shrink-0",
          isTeam ? "text-primary" : "text-secondary",
        )}
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-xs font-medium",
          isTeam ? "text-primary" : "text-foreground",
        )}
      >
        {attachment.name}
      </span>
    </>
  );

  const className = cn(
    "inline-flex w-full max-w-full items-center gap-2 rounded-lg border bg-white px-2.5 py-2 transition-colors",
    isTeam
      ? "border-primary/20 text-primary hover:bg-primary/5"
      : "border-border text-secondary hover:text-foreground",
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        download={kind === "pdf" ? undefined : attachment.name}
        className={className}
      >
        {content}
      </a>
    );
  }

  return <span className={className}>{content}</span>;
}
