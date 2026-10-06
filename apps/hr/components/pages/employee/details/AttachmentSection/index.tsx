"use client";
import { CircleNotch as Loader2, DownloadSimple as Download, Eye, Paperclip, PencilSimple as Pencil, Plus, Trash as Trash2 } from "@phosphor-icons/react";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SectionCard } from "../SectionCard";
import type { AttachmentItem } from "../types";
import pdfIcon from "@/public/images/pdf.svg";

import { InfoCardSkeleton } from "@/components/ui/info-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import {
  useUploadEmployeeAttachmentsMutation,
  useDeleteEmployeeAttachmentMutation,
} from "@/redux/features/employee/employeeApi";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";

type AttachmentSectionProps = {
  employeeId: string;
  attachments: AttachmentItem[];
  isLoading?: boolean;
};

export function AttachmentSection({
  employeeId,
  attachments,
  isLoading,
}: AttachmentSectionProps) {
  const t = useTranslations("employees.details");
  const tActions = useTranslations("actions");
  const tUpload = useTranslations("createUpdateEmployee.attachments");
  const reqWithToaster = useReqWithToaster();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadAttachments, { isLoading: isUploading }] = useUploadEmployeeAttachmentsMutation();
  const [deleteAttachment, { isLoading: isDeleting }] =
    useDeleteEmployeeAttachmentMutation();

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append("files", files[0]);
    await reqWithToaster(tUpload("uploadingLabel"), async () => {
      await uploadAttachments({ id: employeeId, body: formData }).unwrap();
      if (fileInputRef.current) fileInputRef.current.value = "";
    })

  };

  const handleDelete = async (attachmentId: string) => {
    await reqWithToaster(t("attachment.deleting"), async () => {
      await deleteAttachment({
        id: employeeId,
        attachmentId: Number(attachmentId),
      }).unwrap();
    })
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // Fallback if fetch fails (e.g. CORS)
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.download = fileName;
      link.click();
    }
  };

  if (isLoading) {
    return (
      <InfoCardSkeleton itemCount={0}>
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </InfoCardSkeleton>
    );
  }

  return (
    <SectionCard
      title={t("sections.attachment")}
      icon={Paperclip}
      action={
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border-border px-3 text-secondary shadow-sm hover:bg-muted"
            onClick={handleEditClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Plus className="size-4" aria-hidden />
            )}
            <span className="text-xs font-medium">{t("attachment.upload")}</span>
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        {attachments.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
          >
            <div className="flex items-center w-[calc(100%-9rem)] gap-3">
              <Image
                src={pdfIcon}
                alt=""
                width={36}
                height={40}
                className="object-contain"
              />
              <div className="leading-snug w-full">
                <p className="text-sm font-medium text-foreground text-ellipsis overflow-hidden">
                  {file.name}
                </p>
                <p className="text-xs text-secondary">{file.size}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-border bg-card text-secondary hover:bg-muted"
                aria-label={t("attachment.viewFile", { name: file.name })}
                onClick={() => window.open(file.url, "_blank")}
              >
                <Eye className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-border bg-card text-secondary hover:bg-muted"
                aria-label={tActions("downloadFile", { name: file.name })}
                onClick={() => handleDownload(file.url, file.name)}
              >
                <Download className="size-4" aria-hidden />
              </Button>
              <DeleteDialog
                title={t("attachment.delete.title")}
                description={t("attachment.delete.description")}
                confirmText={t("attachment.delete.confirm")}
                cancelText={t("attachment.delete.cancel")}
                onConfirm={() => handleDelete(file.id)}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-border bg-card text-destructive hover:bg-destructive/10"
                    aria-label={t("attachment.deleteFile", { name: file.name })}
                    disabled={isDeleting}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                }
              />
            </div>
          </div>
        ))}
      </div>
    </SectionCard >
  );
}
