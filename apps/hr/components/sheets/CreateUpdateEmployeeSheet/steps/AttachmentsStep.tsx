"use client";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { IconButton } from "@/components/shared/IconButton";
import { ArrowCounterClockwise, FolderOpen, UploadSimple } from "@phosphor-icons/react";
import { ArrowCounterClockwise as ArrowCounterClockwiseIcon, CheckCircle as CheckCircle2, File as FileIcon, UploadSimple as Upload, X as XIcon } from "@phosphor-icons/react";

import React, { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useFormatter, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";

import { Button } from "@orgtik/ui";
import { cn } from "@/lib/utils";
import { useEmployeeWizard } from "../EmployeeWizardContext";
import { useSearchParams } from "next/navigation";
import {
  useGetEmployeeAttachmentsQuery,
  useUploadEmployeeAttachmentsMutation,
  useDeleteEmployeeAttachmentMutation,
  useUpdateOnboardingStepMutation,
} from "@/redux/features/employee/employeeApi";
import { onFormErrorDisplay } from "@/lib/form-error-toast";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";

import type { EmployeeFormValues, IEmployeeAttachment } from "@/types/employee";
import { attachmentsSchema, type AttachmentsFormValues } from "../schemas";

// A file size in the reader's language ("1.5 MB", "1,5 Mo").
const formatBytes = (format: ReturnType<typeof useFormatter>, size?: number) => {
  if (!size) return "";
  const units = ["byte", "kilobyte", "megabyte", "gigabyte"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(size) / Math.log(1024)),
  );
  const value = size / 1024 ** i;
  return format.number(value, {
    style: "unit",
    unit: units[i],
    unitDisplay: "short",
    maximumFractionDigits: value >= 10 || i === 0 ? 0 : 1,
  });
};

function extensionBadge(fileName: string) {
  const ext = fileName.split(".").pop()?.toUpperCase() ?? "FILE";
  const isPdf = ext === "PDF";
  const bg = isPdf
    ? "bg-destructive/10 text-destructive"
    : "bg-primary/10 text-primary";
  return (
    <div
      className={`grid h-12 w-12 place-items-center rounded-xl text-xs font-semibold ${bg}`}
    >
      {ext}
    </div>
  );
}

function AttachmentRow({
  fileName,
  fileSize,
  isLocal,
  onRemove,
}: {
  fileName: string;
  fileSize?: number;
  isLocal?: boolean;
  onRemove: () => Promise<unknown> | void;
}) {
  const t = useTranslations("createUpdateEmployee");
  const format = useFormatter();
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {extensionBadge(fileName)}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {fileName}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatBytes(format, fileSize)}</span>
              {isLocal && <span className="text-primary font-medium">{t("attachments.pendingUpload")}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isLocal && <CheckCircle2 className="size-5 text-primary shrink-0" />}

          {isLocal ? (
            <IconButton
              label={t("attachments.removeFile", { name: fileName })}
              variant="ghost"
              className="size-9 rounded-full bg-muted text-foreground hover:bg-muted/80 shrink-0"
              onClick={onRemove}
            >
              <XIcon className="size-4" />
            </IconButton>
          ) : (
            <DeleteDialog
              title={t("attachments.deleteTitle", { name: fileName })}
              description={t("attachments.deleteImpact")}
              confirmText={t("attachments.deleteConfirm")}
              onConfirm={onRemove}
              trigger={
                <IconButton
                  label={t("attachments.removeFile", { name: fileName })}
                  variant="ghost"
                  className="size-9 rounded-full bg-muted text-foreground hover:bg-muted/80 shrink-0"
                >
                  <XIcon className="size-4" />
                </IconButton>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

type FormType = AttachmentsFormValues;

export function AttachmentsStep() {
  const { onNext, onBack, isEdit, isLastStep, setCompletedSteps } = useEmployeeWizard();
  const t = useTranslations("createUpdateEmployee");
  const reqWithToaster = useReqWithToaster();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employee_id");

  const form = useForm<FormType>({
    resolver: zodResolver(attachmentsSchema),
    defaultValues: {
      attachmentItems: [],
    },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "attachmentItems",
  });

  const { data: attachmentsRes, isLoading: isLoadingAttachments } = useGetEmployeeAttachmentsQuery(
    { id: employeeId!, limit: 100 },
    { skip: !employeeId }
  );

  const [uploadAttachments, { isLoading: isUploading }] = useUploadEmployeeAttachmentsMutation();
  const [deleteAttachment] = useDeleteEmployeeAttachmentMutation();
  const [updateOnboarding] = useUpdateOnboardingStepMutation();

  const serverAttachments = useMemo(() => attachmentsRes?.data?.items || [], [attachmentsRes]);

  // Sync server attachments with form state
  useEffect(() => {
    if (serverAttachments.length > 0) {
      form.setValue("attachmentItems", serverAttachments.map(a => ({ file: a })) as any);
    }
  }, [serverAttachments, form]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list?.length || !employeeId) return;

    const incoming = Array.from(list);
    incoming.forEach((file) => {
      append({ file });
    });

    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = async (index: number) => {
    const item = fields[index];
    if (!item.file) return;

    // If it's a server object, delete it from backend
    if ("id" in item.file && typeof item.file.id === "number") {
      if (!employeeId) return;
      // The confirm waits for this; the base query says how it went.
      await deleteAttachment({ id: employeeId, attachmentId: item.file.id }).unwrap();
      remove(index);
    } else {
      // It's a local File object
      remove(index);
    }
  };

  const onSubmit = async (values: FormType) => {
    if (!employeeId) return;

    // 1. Collect all new files into a single FormData
    const formData = new FormData();
    let hasNewFiles = false;

    values.attachmentItems.forEach((item: any) => {
      // attachmentItems is an array of { file: File | IEmployeeAttachment }
      if (item.file instanceof File) {
        formData.append("files", item.file);
        hasNewFiles = true;
      }
    });

    // 2. Perform upload and finalize step
    await reqWithToaster(t("attachments.uploadingLabel"), async () => {
      // Upload files if any
      if (hasNewFiles) {
        await uploadAttachments({ id: employeeId, body: formData }).unwrap();
      }

      // // Mark step as completed
      // const onboardingPayload = {
      //   step: "attachments" as const,
      //   data: {},
      // };
      // const res = await updateOnboarding({
      //   id: employeeId,
      //   body: onboardingPayload,
      // }).unwrap();

      // if (res.data?.completedSteps) {
      //   setCompletedSteps(res.data.completedSteps);
      // }

      // 3. Proceed to next step
      onNext(values);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onFormErrorDisplay)} className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-medium leading-6 text-foreground">
            {t("steps.attachments.heading")}
          </h2>
          <p className="text-xs leading-4 text-muted-foreground">
            {t("steps.attachments.description")}
          </p>
        </header>

        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            className={cn(
              "rounded-3xl border-2 border-dashed border-border px-6 py-10 transition-colors focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
              isDragging && "border-primary ring-2 ring-primary/30 shadow-lg",
              (isUploading || isLoadingAttachments) && "opacity-50 pointer-events-none"
            )}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            aria-label={t("attachments.dropTitle")}
          >
            <div className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
              <div className="grid size-20 place-items-center rounded-full bg-card shadow-lg">
                {isUploading ? (
                  <UploadSimple weight="duotone" aria-hidden="true" className="size-10 text-primary animate-pulse" />
                ) : (
                  <FolderOpen weight="fill" aria-hidden="true" className="size-10 text-primary" />
                )}
              </div>
              <p className="text-base font-semibold text-foreground">
                {isUploading ? t("attachments.uploadingLabel") : t("attachments.dropTitle")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("attachments.maxSizeHint")}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="mt-2 py-5 px-12"
                disabled={isUploading}
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                <Upload className="me-2 size-4" />
                {t("attachments.uploadCta")}
              </Button>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          <div className="space-y-3">
            {fields.length > 0 ? (
              fields.map((field, index) => {
                const value = field.file;
                if (!value) return null;
                const fileName = value instanceof File ? value.name : (value as IEmployeeAttachment).fileName;
                const fileSize = value instanceof File ? value.size : (value as IEmployeeAttachment).fileSize;
                const isLocal = value instanceof File;

                return (
                  <AttachmentRow
                    key={field.id}
                    fileName={fileName}
                    fileSize={fileSize}
                    isLocal={isLocal}
                    onRemove={() => removeFile(index)}
                  />
                );
              })
            ) : (
              !isLoadingAttachments && (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                  <FileIcon className="size-4 text-primary" />
                  {t("attachments.emptyHint")}
                </div>
              )
            )}
            {isLoadingAttachments && (
              <div className="flex items-center justify-center py-4">
                <ArrowCounterClockwiseIcon  className="size-6 animate-spin text-primary" weight="duotone" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6 mt-8">
          <Button
            className="min-w-32"
            type="button"
            size="lg"
            variant="secondary"
            onClick={onBack}
          >
            {t("nav.back")}
          </Button>
          <Button type="submit" className="min-w-32" size="lg" disabled={isUploading}>
            {isLastStep
              ? isEdit
                ? t("nav.save")
                : t("nav.submit")
              : t("nav.next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
