"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "@orgtik/ui";
import { useTranslations } from "next-intl";
import { store } from "@/redux/app/store";
import { fileApi } from "@/redux/features/file/fileApi";
import { executeUploadPlan } from "@/lib/upload/execute-upload-plan";
import {
  mergeFileProgressUpdates,
  summariesFromFiles,
} from "@/lib/upload/compute-job-progress";
import { isUploadAbortedError } from "@/lib/upload/errors";
import { createFolderHelpersForUpload } from "@/lib/upload/create-upload-root-folder";
import type {
  BackgroundUploadJob,
  StartBackgroundUploadInput,
} from "@/lib/upload/types";

export { computeJobOverallPercent } from "@/lib/upload/compute-job-progress";

type BackgroundUploadContextValue = {
  jobs: BackgroundUploadJob[];
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  detailsJobId: string | null;
  openJobDetails: (jobId: string) => void;
  closeJobDetails: () => void;
  startBackgroundUpload: (input: StartBackgroundUploadInput) => string;
  cancelUpload: (jobId: string) => void;
  dismissJob: (jobId: string) => void;
  clearCompletedJobs: () => void;
  getJob: (jobId: string) => BackgroundUploadJob | undefined;
  setForegroundUploadActive: (active: boolean) => void;
};

const BackgroundUploadContext =
  createContext<BackgroundUploadContextValue | null>(null);

function jobLabel(fileCount: number, firstName?: string): string {
  if (fileCount === 1 && firstName) return firstName;
  return `${fileCount} files`;
}

export function BackgroundUploadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("BackgroundUpload");
  const tc = useTranslations("Common");
  const [jobs, setJobs] = useState<BackgroundUploadJob[]>([]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [detailsJobId, setDetailsJobId] = useState<string | null>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const foregroundUploadActiveRef = useRef(false);

  const setForegroundUploadActive = useCallback((active: boolean) => {
    foregroundUploadActiveRef.current = active;
  }, []);

  useEffect(() => {
    const message = tc("uploadLostOnLeave");

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      const backgroundActive = jobs.some((j) => j.status === "uploading");
      const foregroundActive = foregroundUploadActiveRef.current;
      if (!backgroundActive && !foregroundActive) return;

      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [jobs, tc]);

  const updateJob = useCallback(
    (jobId: string, patch: Partial<BackgroundUploadJob>) => {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, ...patch } : j)),
      );
    },
    [],
  );

  const startBackgroundUpload = useCallback(
    (input: StartBackgroundUploadInput) => {
      const jobId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);

      const firstName =
        input.files[0]?.relativePath ?? input.files[0]?.file.name;

      const abortController = new AbortController();
      abortControllersRef.current.set(jobId, abortController);

      const newJob: BackgroundUploadJob = {
        id: jobId,
        createdAt: Date.now(),
        label: jobLabel(input.files.length, firstName),
        activeTab: input.activeTab,
        status: "uploading",
        fileSummaries: summariesFromFiles(input.files),
        progress: {
          completedFiles: 0,
          totalFiles: input.files.length,
          chunkIndex: 0,
          totalChunks: 0,
        },
      };

      setJobs((prev) => [...prev, newJob]);
      setPanelOpen(true);

      const run = async () => {
        const { signal } = abortController;
        const folderHelpers = createFolderHelpersForUpload();
        try {
          await executeUploadPlan({
            files: input.files,
            activeTab: input.activeTab,
            targetFolderId: input.targetFolderId,
            signal,
            createRootFolder: folderHelpers.createUploadRootFolder,
            ensureFolderPath: folderHelpers.ensureFolderPathUnderParent,
            uploadFile: (payload) =>
              store
                .dispatch(
                  fileApi.endpoints.uploadFile.initiate({
                    ...payload,
                    signal,
                  }),
                )
                .unwrap(),
            onJobProgress: (progress) => updateJob(jobId, { progress }),
            onFileProgress: (updates) => {
              setJobs((prev) =>
                prev.map((j) => {
                  if (j.id !== jobId) return j;
                  return {
                    ...j,
                    fileSummaries: mergeFileProgressUpdates(
                      j.fileSummaries,
                      updates,
                    ),
                  };
                }),
              );
            },
          });
          if (signal.aborted) return;
          setJobs((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    status: "completed" as const,
                    fileSummaries: j.fileSummaries.map((f) => ({
                      ...f,
                      progress: 100,
                    })),
                  }
                : j,
            ),
          );
          toast.success(tc("uploadSuccess"));
        } catch (error) {
          if (isUploadAbortedError(error) || abortController.signal.aborted) {
            return;
          }
          console.error("Background upload failed:", error);
          updateJob(jobId, {
            status: "failed",
            error:
              error instanceof Error ? error.message : t("uploadFailed"),
          });
          toast.error(t("uploadFailed"));
        } finally {
          abortControllersRef.current.delete(jobId);
        }
      };

      void run();
      return jobId;
    },
    [t, tc, updateJob],
  );

  const dismissJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setDetailsJobId((current) => (current === jobId ? null : current));
  }, []);

  const cancelUpload = useCallback(
    (jobId: string) => {
      abortControllersRef.current.get(jobId)?.abort();
      abortControllersRef.current.delete(jobId);
      dismissJob(jobId);
    },
    [dismissJob],
  );

  const clearCompletedJobs = useCallback(() => {
    setJobs((prev) => prev.filter((j) => j.status === "uploading"));
  }, []);

  const openJobDetails = useCallback((jobId: string) => {
    setDetailsJobId(jobId);
    setPanelOpen(true);
  }, []);

  const closeJobDetails = useCallback(() => {
    setDetailsJobId(null);
  }, []);

  const getJob = useCallback(
    (jobId: string) => jobs.find((j) => j.id === jobId),
    [jobs],
  );

  const value = useMemo(
    () => ({
      jobs,
      panelOpen,
      setPanelOpen,
      detailsJobId,
      openJobDetails,
      closeJobDetails,
      startBackgroundUpload,
      cancelUpload,
      dismissJob,
      clearCompletedJobs,
      getJob,
      setForegroundUploadActive,
    }),
    [
      jobs,
      panelOpen,
      detailsJobId,
      openJobDetails,
      closeJobDetails,
      startBackgroundUpload,
      cancelUpload,
      dismissJob,
      clearCompletedJobs,
      getJob,
      setForegroundUploadActive,
    ],
  );

  return (
    <BackgroundUploadContext.Provider value={value}>
      {children}
    </BackgroundUploadContext.Provider>
  );
}

export function useBackgroundUpload() {
  const ctx = useContext(BackgroundUploadContext);
  if (!ctx) {
    throw new Error(
      "useBackgroundUpload must be used within BackgroundUploadProvider",
    );
  }
  return ctx;
}

export function useBackgroundUploadOptional() {
  return useContext(BackgroundUploadContext);
}
