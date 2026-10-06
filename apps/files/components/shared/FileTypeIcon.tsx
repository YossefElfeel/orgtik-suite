"use client";

// A file's type as an icon (Phosphor, D-008), toned from tokens so it holds in both themes. The
// type is also written next to it wherever it matters (the extension), so the colour is a cue, not
// the only signal. Replaces the iconify "vscode-icons" set.
import type { ReactNode } from "react";
import { File, FileArchive, FileCsv, FileDoc, FileImage, FilePdf, FilePpt, FileText, FileVideo, FileXls, FileAudio, FileCode } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Kind = { icon: ReactNode; tone: string };
const DOC = "text-info";
const SHEET = "text-success";
const DANGER = "text-danger";
const BRAND = "text-fg-brand";
const WARM = "text-warning";
const MUTED = "text-fg-muted";

const BY_EXT: Record<string, Kind> = {
  pdf: { icon: <FilePdf weight="duotone" />, tone: DANGER },
  doc: { icon: <FileDoc weight="duotone" />, tone: DOC },
  docx: { icon: <FileDoc weight="duotone" />, tone: DOC },
  xls: { icon: <FileXls weight="duotone" />, tone: SHEET },
  xlsx: { icon: <FileXls weight="duotone" />, tone: SHEET },
  csv: { icon: <FileCsv weight="duotone" />, tone: SHEET },
  ppt: { icon: <FilePpt weight="duotone" />, tone: WARM },
  pptx: { icon: <FilePpt weight="duotone" />, tone: WARM },
  txt: { icon: <FileText weight="duotone" />, tone: MUTED },
  md: { icon: <FileText weight="duotone" />, tone: MUTED },
  zip: { icon: <FileArchive weight="duotone" />, tone: WARM },
  rar: { icon: <FileArchive weight="duotone" />, tone: WARM },
  "7z": { icon: <FileArchive weight="duotone" />, tone: WARM },
  png: { icon: <FileImage weight="duotone" />, tone: BRAND },
  jpg: { icon: <FileImage weight="duotone" />, tone: BRAND },
  jpeg: { icon: <FileImage weight="duotone" />, tone: BRAND },
  gif: { icon: <FileImage weight="duotone" />, tone: BRAND },
  webp: { icon: <FileImage weight="duotone" />, tone: BRAND },
  svg: { icon: <FileImage weight="duotone" />, tone: BRAND },
  sketch: { icon: <FileImage weight="duotone" />, tone: BRAND },
  mp4: { icon: <FileVideo weight="duotone" />, tone: WARM },
  mov: { icon: <FileVideo weight="duotone" />, tone: WARM },
  webm: { icon: <FileVideo weight="duotone" />, tone: WARM },
  mp3: { icon: <FileAudio weight="duotone" />, tone: BRAND },
  wav: { icon: <FileAudio weight="duotone" />, tone: BRAND },
  json: { icon: <FileCode weight="duotone" />, tone: MUTED },
  js: { icon: <FileCode weight="duotone" />, tone: MUTED },
  ts: { icon: <FileCode weight="duotone" />, tone: MUTED },
  html: { icon: <FileCode weight="duotone" />, tone: MUTED },
};

/** The extension of a file name, lower case, without query or hash ("Report.PDF?x" → "pdf"). */
export const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase().split(/\?|#/)[0] || "";

export function FileTypeIcon({ name, mimeType, className }: { name: string; mimeType?: string | null; className?: string }) {
  const ext = extensionOf(name);
  const kind =
    BY_EXT[ext] ??
    (mimeType?.startsWith("image/") ? BY_EXT.png : mimeType?.startsWith("video/") ? BY_EXT.mp4 : mimeType?.startsWith("audio/") ? BY_EXT.mp3 : { icon: <File weight="duotone" />, tone: MUTED });
  return (
    <span aria-hidden="true" className={cn("inline-grid shrink-0 place-items-center [&>svg]:size-full", kind.tone, className ?? "size-6")}>
      {kind.icon}
    </span>
  );
}
