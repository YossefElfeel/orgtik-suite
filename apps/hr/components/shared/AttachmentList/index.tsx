import { DownloadSimple as Download, File as FileIcon, FileCode, FileText, Image as ImageIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";


const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) {
        return {
            icon: <FileText className="w-8 h-8 text-danger" />,
            label: "PDF",
            color: "bg-danger-solid",
        };
    }
    if (mimeType.includes("image")) {
        return {
            icon: <ImageIcon className="w-8 h-8 text-info" />,
            label: "IMG",
            color: "bg-info-solid",
        };
    }
    if (mimeType.includes("word") || mimeType.includes("officedocument.wordprocessingml")) {
        return {
            icon: <FileText className="w-8 h-8 text-info" />,
            label: "DOC",
            color: "bg-info-solid",
        };
    }

    return {
        icon: <FileIcon className="w-8 h-8 text-fg-subtle" />,
        label: null,
        color: "bg-line-strong",
    };
};

// The size in the reader's language ("1.5 kB", "1,5 Mo"): the units are the Intl ones.
const SIZE_UNITS = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;
const formatFileSize = (bytes: number, format: ReturnType<typeof useFormatter>): string => {
    const k = 1024;
    const i = bytes > 0 ? Math.min(Math.floor(Math.log(bytes) / Math.log(k)), SIZE_UNITS.length - 1) : 0;
    return format.number(bytes / Math.pow(k, i), {
        style: "unit",
        unit: SIZE_UNITS[i],
        unitDisplay: i === 0 ? "long" : "short",
        maximumFractionDigits: 2,
    });
};

interface Attachment {
    fileName: string;
    fileUrl: string;
    fileSizeBytes: number;
    mimeType: string;
}

interface AttachmentProps {
    attachments?: Attachment[];
}

export function AttachmentList({ attachments }: AttachmentProps) {
    const t = useTranslations("attachmentList");
    const tActions = useTranslations("actions");
    const format = useFormatter();
    if (!attachments || attachments.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
                {attachments.map((file, index) => {
                    const fileConfig = getFileIcon(file.mimeType);

                    return (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-line rounded-2xl bg-raised hover:bg-sunken transition-all gap-4"
                        >
                           
                            <div className="flex items-center gap-3 min-w-0">
                             
                                <div className="relative flex-shrink-0 flex items-center justify-center w-12 h-12 bg-raised border border-line rounded-lg shadow-sm">
                                    {fileConfig.icon}
                                    <span className={`absolute -bottom-1 -start-1 ${fileConfig.color} text-white text-[9px] font-bold px-1 rounded shadow-sm`}>
                                        {fileConfig.label ?? t("fileBadge")}
                                    </span>
                                </div>

                                <div className="flex flex-col min-w-0">
                                    <span className="text-fg font-medium text-sm truncate">
                                        {file.fileName}
                                    </span>
                                    <span className="text-fg-muted text-xs">
                                        {formatFileSize(file.fileSizeBytes, format)}
                                    </span>
                                </div>
                            </div>

                            {/* Download Button */}
                            <Link
                                href={file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={file.fileName}
                                aria-label={tActions("downloadFile", { name: file.fileName })}
                                className="flex-shrink-0 p-2 border border-line rounded-lg hover:bg-sunken text-fg-muted transition-colors shadow-sm"
                            >
                                <Download className="w-5 h-5" aria-hidden="true" />
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}