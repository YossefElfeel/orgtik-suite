"use client";

// One background upload, file by file, on the library Dialog. The page buttons both have names (the
// "next" one had none), sizes use the formatter (the old "2.00 MB" ignored the language), and a
// file's name is isolated so a Hebrew or Arabic name doesn't scramble the line.
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CaretLeft, CaretRight, CheckCircle } from "@phosphor-icons/react";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle, IconButton, Progress, useFormatter } from "@orgtik/ui";
import { useBackgroundUpload } from "@/providers/background-upload-provider";
import { computeJobOverallPercent, computeDisplayCompletedCount } from "@/lib/upload/compute-job-progress";
import { FILE_LIST_PAGE_SIZE } from "@/lib/upload/constants";
import { FileTypeIcon } from "@/components/shared/FileTypeIcon";

export function BackgroundUploadJobDetailsDialog({ onCancelConfirmJobIdChange }: { onCancelConfirmJobIdChange: (jobId: string | null) => void }) {
  const t = useTranslations("BackgroundUpload");
  const tc = useTranslations("Common");
  const tf = useTranslations("FileUpload");
  const f = useFormatter();
  const { detailsJobId, closeJobDetails, getJob } = useBackgroundUpload();
  const [page, setPage] = useState(0);

  const job = detailsJobId ? getJob(detailsJobId) : undefined;

  useEffect(() => {
    setPage(0);
  }, [detailsJobId]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      closeJobDetails();
      setPage(0);
    }
  };

  if (!job) return null;

  const totalPages = Math.max(1, Math.ceil(job.fileSummaries.length / FILE_LIST_PAGE_SIZE));
  const pageStart = page * FILE_LIST_PAGE_SIZE;
  const visible = job.fileSummaries.slice(pageStart, pageStart + FILE_LIST_PAGE_SIZE);
  const rangeStart = job.fileSummaries.length > 0 ? pageStart + 1 : 0;
  const rangeEnd = Math.min(job.fileSummaries.length, pageStart + FILE_LIST_PAGE_SIZE);
  const overall = computeJobOverallPercent(job.fileSummaries);
  const displayCompleted = computeDisplayCompletedCount(job.fileSummaries, job.progress.totalFiles);
  const uploading = job.status === "uploading";

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent size="lg" className="max-h-[min(720px,92vh)]">
        <DialogHeader>
          <DialogTitle>
            <bdi className="block truncate">{job.label}</bdi>
          </DialogTitle>
          <DialogDescription>
            {uploading
              ? t("uploadProgressSummary", { completed: displayCompleted, total: job.progress.totalFiles, chunk: job.progress.chunkIndex, chunks: job.progress.totalChunks })
              : job.status === "completed"
                ? t("statusCompleted")
                : t("statusFailed")}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          {uploading ? (
            <div className="flex flex-col gap-2">
              <Progress value={overall} label={t("overallProgress")} />
              <p className="text-caption text-fg-muted">{tc("uploadLostOnLeaveHint")}</p>
              <Button variant="secondary" size="sm" className="w-full text-danger" onClick={() => onCancelConfirmJobIdChange(job.id)}>
                {t("cancelUpload")}
              </Button>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <span className="text-caption tabular-nums text-fg-muted">{tf("fileListPagination", { start: rangeStart, end: rangeEnd, total: job.fileSummaries.length })}</span>
            {totalPages > 1 ? (
              <div className="flex items-center gap-1">
                <IconButton size="sm" variant="ghost" label={tf("fileListPrev")} icon={<CaretLeft className="rtl:-scale-x-100" />} disabled={page <= 0} onClick={() => setPage((p) => p - 1)} />
                <span dir="ltr" className="min-w-12 text-center text-caption tabular-nums text-fg-muted">
                  {page + 1}/{totalPages}
                </span>
                <IconButton size="sm" variant="ghost" label={tf("fileListNext")} icon={<CaretRight className="rtl:-scale-x-100" />} disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} />
              </div>
            ) : null}
          </div>

          <ul className="flex flex-col gap-2">
            {visible.map((file) => (
              <li key={file.id} className="flex flex-col gap-2 rounded-field border border-line bg-sunken p-3">
                <div className="flex items-center gap-3">
                  <FileTypeIcon name={file.name} className="size-6" />
                  <div className="min-w-0 flex-1">
                    <p dir="auto" className="truncate text-body-sm font-medium text-fg">
                      {file.name}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-caption text-fg-muted">
                      <span className="tabular-nums">{f.bytes(file.size)}</span>
                      {uploading && file.progress < 100 ? <span>· {tf("processing")}</span> : null}
                      {uploading && file.progress >= 100 ? (
                        <span className="inline-flex items-center gap-1 font-medium text-success">
                          · <CheckCircle aria-hidden="true" weight="fill" className="size-3.5" />
                          {tf("uploaded")}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
                {uploading && file.progress > 0 && file.progress < 100 ? <Progress value={file.progress} label={<span className="sr-only">{file.name}</span>} /> : null}
              </li>
            ))}
          </ul>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
