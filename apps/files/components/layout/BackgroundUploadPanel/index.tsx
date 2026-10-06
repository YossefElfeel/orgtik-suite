"use client";

// Uploads that keep going while the reader moves around the app: a panel at the reading end of
// the page, on library parts. Its heading is a live region, so "2 uploads in progress" / "Uploads
// finished" is announced; every icon-only control has a name; status is said in words, the icon only
// backs it up; and it sits at the inline end, so it moves to the left in Arabic.
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { CaretDown, CaretUp, CheckCircle, UploadSimple, WarningCircle, X } from "@phosphor-icons/react";
import { Button, IconButton, Progress } from "@orgtik/ui";
import { useBackgroundUpload } from "@/providers/background-upload-provider";
import { computeJobOverallPercent, computeDisplayCompletedCount } from "@/lib/upload/compute-job-progress";
import { BackgroundUploadJobDetailsDialog } from "./JobDetailsDialog";
import { CancelUploadConfirmDialog } from "@/components/upload/CancelUploadConfirmDialog";

export function BackgroundUploadPanel() {
  const t = useTranslations("BackgroundUpload");
  const tc = useTranslations("Common");
  const { jobs, panelOpen, setPanelOpen, dismissJob, clearCompletedJobs, openJobDetails, cancelUpload } = useBackgroundUpload();
  const [cancelConfirmJobId, setCancelConfirmJobId] = useState<string | null>(null);

  const activeJobs = jobs.filter((j) => j.status === "uploading");
  const finishedJobs = jobs.filter((j) => j.status !== "uploading");

  if (jobs.length === 0) return null;

  return (
    <>
      <BackgroundUploadJobDetailsDialog onCancelConfirmJobIdChange={setCancelConfirmJobId} />
      <CancelUploadConfirmDialog
        open={cancelConfirmJobId !== null}
        onOpenChange={(open) => {
          if (!open) setCancelConfirmJobId(null);
        }}
        onConfirm={() => {
          if (cancelConfirmJobId) cancelUpload(cancelConfirmJobId);
        }}
      />
      <section
        aria-labelledby="upload-panel-heading"
        className="fixed bottom-4 end-4 z-40 flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-overlay border border-line bg-overlay shadow-overlay"
      >
        <div className="flex items-center justify-between gap-2 border-b border-line bg-sunken px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <UploadSimple aria-hidden="true" className="size-4 shrink-0 text-fg-brand" />
            <h2 id="upload-panel-heading" aria-live="polite" className="truncate text-label font-semibold text-fg">
              {activeJobs.length > 0 ? t("panelUploading", { count: activeJobs.length }) : t("panelDone")}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {finishedJobs.length > 0 && activeJobs.length === 0 ? (
              <Button variant="ghost" size="sm" onClick={clearCompletedJobs}>
                {t("clearAll")}
              </Button>
            ) : null}
            <IconButton
              variant="ghost"
              size="sm"
              label={panelOpen ? t("hideList") : t("showList")}
              aria-expanded={panelOpen}
              aria-controls="upload-panel-list"
              icon={panelOpen ? <CaretDown /> : <CaretUp />}
              onClick={() => setPanelOpen(!panelOpen)}
            />
          </div>
        </div>

        {activeJobs.length > 0 ? (
          <p className="flex items-start gap-2 border-b border-line bg-warning-subtle px-4 py-2 text-caption text-fg">
            <WarningCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            {tc("uploadLostOnLeaveHint")}
          </p>
        ) : null}

        {panelOpen ? (
          <ul id="upload-panel-list" className="flex max-h-[min(320px,50vh)] flex-col gap-2 overflow-y-auto p-2">
            {jobs.map((job) => {
              const overall = computeJobOverallPercent(job.fileSummaries);
              const displayCompleted = computeDisplayCompletedCount(job.fileSummaries, job.progress.totalFiles);
              const uploading = job.status === "uploading";
              return (
                <li key={job.id} className="flex flex-col gap-2 rounded-field border border-line bg-raised p-3">
                  <div className="flex items-start gap-2">
                    {job.status === "completed" ? <CheckCircle aria-hidden="true" weight="fill" className="mt-0.5 size-4 shrink-0 text-success" /> : null}
                    {job.status === "failed" ? <WarningCircle aria-hidden="true" weight="fill" className="mt-0.5 size-4 shrink-0 text-danger" /> : null}
                    <button
                      type="button"
                      onClick={() => openJobDetails(job.id)}
                      className="group min-w-0 flex-1 rounded-field text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      <span dir="auto" className="block truncate text-body-sm font-medium text-fg group-hover:text-fg-brand">
                        {job.label}
                      </span>
                      <span className="block text-caption text-fg-muted">
                        {uploading
                          ? t("uploadProgressSummary", { completed: displayCompleted, total: job.progress.totalFiles, chunk: job.progress.chunkIndex, chunks: job.progress.totalChunks })
                          : job.status === "completed"
                            ? t("statusCompleted")
                            : t("statusFailed")}
                      </span>
                      <span className="text-caption font-medium text-fg-brand underline-offset-2 group-hover:underline">{t("viewDetails")}</span>
                    </button>
                    {!uploading ? (
                      <IconButton variant="ghost" size="sm" label={t("dismissJob", { name: job.label })} icon={<X />} onClick={() => dismissJob(job.id)} />
                    ) : null}
                  </div>
                  {uploading ? (
                    <>
                      <Progress value={overall} label={<span className="sr-only">{job.label}</span>} />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelConfirmJobId(job.id);
                        }}
                      >
                        {t("cancelUpload")}
                      </Button>
                    </>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {!panelOpen && activeJobs.length > 0 ? (
          <div className="px-4 py-2">
            <Progress value={computeJobOverallPercent(activeJobs[0].fileSummaries)} label={<span dir="auto" className="block truncate text-caption">{activeJobs[0].label}</span>} />
          </div>
        ) : null}
      </section>
    </>
  );
}
