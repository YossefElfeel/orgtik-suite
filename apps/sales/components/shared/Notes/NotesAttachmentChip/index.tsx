import { Icon } from "@iconify/react";

type Props = {
  file: File;
  previewUrl?: string;
  onRemove: () => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) return "solar:gallery-linear";
  if (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  ) {
    return "solar:file-text-linear";
  }
  if (file.type.startsWith("video/")) return "solar:videocamera-linear";
  if (file.type.startsWith("audio/")) return "solar:music-note-linear";
  return "solar:file-linear";
}

export default function NotesAttachmentChip({
  file,
  previewUrl,
  onRemove,
}: Props) {
  return (
    <div className="flex max-w-full items-center gap-2 rounded-full border border-border bg-muted/60 px-2.5 py-1.5">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={file.name}
          className="size-7 rounded-md object-cover"
        />
      ) : (
        <Icon
          icon={getFileIcon(file)}
          className="size-3.5 shrink-0 text-secondary"
        />
      )}
      <span className="max-w-36 truncate text-xs text-foreground">
        {file.name}
      </span>
      <span className="text-[10px] text-secondary">
        {formatFileSize(file.size)}
      </span>
      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
        className="rounded-full p-0.5 text-secondary transition-colors hover:bg-secondary/10 hover:text-foreground"
      >
        <Icon icon="solar:close-circle-linear" className="size-3.5" />
      </button>
    </div>
  );
}
