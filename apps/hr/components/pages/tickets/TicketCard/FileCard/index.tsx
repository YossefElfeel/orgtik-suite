import { DownloadSimple as Download, FileText, Image as ImageIcon } from "@phosphor-icons/react";
import { useFormatter, useTranslations } from "next-intl";
import { IconButton } from "@/components/shared/IconButton";

import Image from "next/image";
import { ITicketAttachment } from "@/types/ticket";

type Props = {
  attachment: ITicketAttachment;
};

const FILE_SIZE_UNITS = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;

const getFileKind = (attachment: ITicketAttachment) => {
  const mime = attachment.mimeType?.toLowerCase() ?? "";
  const name = attachment.fileName?.toLowerCase() ?? "";
  if (mime.startsWith("image/")) return "image";
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (
    mime.includes("msword") ||
    mime.includes("wordprocessingml") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  ) {
    return "word";
  }
  return "file";
};

function FileCard({ attachment }: Props) {
  const tActions = useTranslations("actions");
  const format = useFormatter();
  const formatFileSize = (bytes: number | string | null | undefined) => {
    const parsedBytes = Number(bytes);
    if (!Number.isFinite(parsedBytes) || parsedBytes <= 0) return "-";

    let size = parsedBytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < FILE_SIZE_UNITS.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    return format.number(size, {
      style: "unit",
      unit: FILE_SIZE_UNITS[unitIndex],
      unitDisplay: "short",
      maximumFractionDigits: size >= 10 || unitIndex === 0 ? 0 : 1,
    });
  };
  const kind = getFileKind(attachment);

  const icon = (() => {
    if (kind === "image") {
      return (
        <Image
          src={attachment.url}
          alt={attachment.fileName}
          width={40}
          height={40}
          className="size-10 rounded object-cover border"
        />
      );
    }
    if (kind === "pdf") {
      return (
        <FileText className="size-10 rounded p-2 text-danger bg-danger-subtle border" />
      );
    }
    if (kind === "word") {
      return (
        <FileText className="size-10 rounded p-2 text-info bg-info-subtle border" />
      );
    }
    return (
      <ImageIcon className="size-10 rounded p-2 text-fg-muted bg-sunken border" />
    );
  })();

  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-raised">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {icon}
        <div className="flex flex-col h-full min-w-0">
          <h5 className="text-body-lg font-medium truncate">
            {attachment?.fileName}
          </h5>
          <p className="text-caption text-secondary truncate">
            {formatFileSize(attachment?.fileSize)}
          </p>
        </div>
      </div>

      <IconButton
        label={tActions("downloadFile", { name: attachment?.fileName ?? "" })}
        variant="secondary"
        href={attachment?.url}
        download={attachment?.fileName}
        target="_blank"
        rel="noreferrer"
      >
        <Download className="size-4" />
      </IconButton>
    </div>
  );
}

export default FileCard;
