"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowsClockwise, Camera, CaretLeft, CaretRight, CheckCircle, CloudArrowUp, File as FileIcon, FolderOpen, Image as ImageIcon, UploadSimple, VideoCamera, X } from "@phosphor-icons/react";
import { Button, Combobox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, IconButton, Progress, Tabs, TabsList, TabsPanel, toast, useFormatter } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { BaseDialog, type BaseDialogRef } from "../BaseDialog";
import { CancelUploadConfirmDialog } from "@/components/upload/CancelUploadConfirmDialog";
import { useUploadFileMutation } from "@/redux/features/file/fileApi";
import { useGetFoldersQuery } from "@/redux/features/folder/folderApi";
import { extractDataTransferItems } from "@/lib/drag-drop-extract";
import { cn } from "@/lib/utils";
import { useBackgroundUploadOptional } from "@/providers/background-upload-provider";
import { computeJobOverallPercent, computeDisplayCompletedCount } from "@/lib/upload/compute-job-progress";
import { executeUploadPlan } from "@/lib/upload/execute-upload-plan";
import { FILE_LIST_PAGE_SIZE, UPLOAD_LARGE_SELECTION_THRESHOLD } from "@/lib/upload/constants";
import { isUploadAbortedError } from "@/lib/upload/errors";
import { createFolderHelpersForUpload } from "@/lib/upload/create-upload-root-folder";
import type { FileUploadTab, UploadJobProgress } from "@/lib/upload/types";

export type { FileUploadTab };

interface FileWithMeta {
  file: File;
  progress: number;
  previewUrl?: string;
  id: string;
  relativePath?: string;
}

function syncPreviewsForPage(
  files: FileWithMeta[],
  page: number,
): FileWithMeta[] {
  const start = page * FILE_LIST_PAGE_SIZE;
  const end = start + FILE_LIST_PAGE_SIZE;
  let changed = false;

  const next = files.map((f, index) => {
    const onPage = index >= start && index < end;

    if (!onPage) {
      if (!f.previewUrl) return f;
      URL.revokeObjectURL(f.previewUrl);
      changed = true;
      return { ...f, previewUrl: undefined };
    }

    if (f.previewUrl || !f.file.type.startsWith("image/")) {
      return f;
    }

    changed = true;
    return { ...f, previewUrl: URL.createObjectURL(f.file) };
  });

  return changed ? next : files;
}

export function FileUploadDialog({
  onUpload,
  folderId,
  open,
  onOpenChange,
  initialFiles,
  initialActiveTab,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpload?: (data: any) => void;
  folderId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialFiles?: { file: File; relativePath: string }[];
  /** Set from global drop: matches detected drop kind (files vs folder tree). */
  initialActiveTab?: FileUploadTab;
}) {
  const t = useTranslations("FileUpload");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const backgroundUpload = useBackgroundUploadOptional();
  const [uploadFile] = useUploadFileMutation();
  const { data: foldersData } = useGetFoldersQuery({});
  const [activeTab, setActiveTab] = useState<FileUploadTab>("files");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecordingMode, setIsRecordingMode] = useState(false); // الحالة الجديدة للتحكم في وضع الفيديو
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const folderOptions = (foldersData?.data?.items || []).map((folder: any) => ({
    value: String(folder.id),
    label: String(folder.name),
  }));

  const form = useForm({
    defaultValues: {
      folder: folderId || "",
    },
  });

  const [selectedFiles, setSelectedFiles] = useState<FileWithMeta[]>([]);
  const [fileListPage, setFileListPage] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadJobProgress, setUploadJobProgress] =
    useState<UploadJobProgress | null>(null);
  const [backgroundChoiceOpen, setBackgroundChoiceOpen] = useState(false);
  const [uploadCloseConfirmOpen, setUploadCloseConfirmOpen] = useState(false);
  const [cancelUploadConfirmOpen, setCancelUploadConfirmOpen] = useState(false);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const forceCloseDialogRef = useRef(false);
  const baseDialogRef = useRef<BaseDialogRef>(null);

  const revokeAllPreviews = (files: FileWithMeta[]) => {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
  };

  const goToFileListPage = (page: number) => {
    setSelectedFiles((prev) => syncPreviewsForPage(prev, page));
    setFileListPage(page);
  };

  // ─── Load initial files on open, reset on close ───────────────────────────
  const prevOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = !!open && !prevOpenRef.current;
    const justClosed = !open && prevOpenRef.current;

    if (justOpened) {
      if (initialActiveTab) setActiveTab(initialActiveTab);
      if (initialFiles && initialFiles.length > 0) {
        addFiles(initialFiles);
      }
    }
    if (justClosed) {
      setActiveTab("files");
      setFileListPage(0);
      setSelectedFiles((prev) => {
        revokeAllPreviews(prev);
        return [];
      });
    }
    prevOpenRef.current = !!open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFiles, initialActiveTab]);

  useEffect(() => {
    backgroundUpload?.setForegroundUploadActive(isUploading);
    return () => backgroundUpload?.setForegroundUploadActive(false);
  }, [isUploading, backgroundUpload]);

  // ─── Add files to state (shared by input + drop) ─────────────────────────
  const addFiles = (incoming: { file: File; relativePath: string }[]) => {
    const newMetas: FileWithMeta[] = incoming.map(({ file, relativePath }) => ({
      file,
      progress: 0,
      id: Math.random().toString(36).substr(2, 9),
      relativePath,
      previewUrl: undefined,
    }));

    setFileListPage(0);
    setSelectedFiles((prev) => {
      revokeAllPreviews(prev);
      return syncPreviewsForPage([...prev, ...newMetas], 0);
    });
  };

  // ─── Handle <input type="file"> change (files or folder via input) ────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = rawFiles.map((file: any) => ({
      file,
      // webkitRelativePath is populated when webkitdirectory is set
      relativePath: (file.webkitRelativePath as string) || file.name,
    }));

    addFiles(mapped);

    // Reset input so the same folder/files can be re-selected if needed
    e.target.value = "";
  };

  const getSupportedMimeType = () => {
    const types = ["video/mp4", "video/webm;codecs=vp9", "video/webm"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  };

  // ─── Drag-and-drop: detect file vs directory via FileSystem API ───────────
  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const dataTransfer = e.dataTransfer;
    if (!dataTransfer) return;

    try {
      const { items, dropKind } = await extractDataTransferItems(dataTransfer);

      if (items && items.length > 0) {
        console.log("Total items dropped:", items.length);

        setActiveTab(dropKind === "folders" ? "folders" : "files");

        addFiles(items);
      } else {
        const fallbackFiles = Array.from(dataTransfer.files).map((file) => ({
          file,
          relativePath: file.name,
        }));
        if (fallbackFiles.length > 0) {
          addFiles(fallbackFiles);
        }
      }
    } catch (error) {
      console.error("Drop error:", error);
    }
  };

  const removeFile = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      const next = prev.filter((f) => f.id !== id);
      const maxPage = Math.max(
        0,
        Math.ceil(next.length / FILE_LIST_PAGE_SIZE) - 1,
      );
      const page = Math.min(fileListPage, maxPage);
      if (page !== fileListPage) {
        setFileListPage(page);
      }
      return syncPreviewsForPage(next, page);
    });
  };

  // ─── Camera Logic ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      setStream(mediaStream);
      setFacingMode(mode);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera access error:", err);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setIsCameraOpen(false);
    setIsRecordingMode(false);
  };

  const toggleCamera = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const fileName = `capture_${Date.now()}.jpg`;
          const file = new File([blob], fileName, {
            type: "image/jpeg",
          });
          addFiles([{ file, relativePath: fileName }]);
          stopCamera();
        }
      },
      "image/jpeg",
      0.9,
    );
  };

  // ------------------video recording------------------
  const startRecording = () => {
    if (!stream) return;

    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : {};

    try {
      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const finalMimeType = recorder.mimeType || "video/mp4";
        const blob = new Blob(chunks, { type: finalMimeType });
        const extension = finalMimeType.includes("webm") ? "webm" : "mp4";
        const fileName = `video_${Date.now()}.${extension}`;

        const file = new File([blob], fileName, { type: finalMimeType });
        addFiles([{ file, relativePath: fileName }]);
        stopCamera();
      };

      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("MediaRecorder error:", err);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  const stopCameraFixed = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopCamera();
  };
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  // ─── Final submit ─────────────────────────────────────────────────────────
  const buildUploadPayload = () => {
    const values = form.getValues();
    const targetFolderId = folderId || values.folder || undefined;
    const files = selectedFiles.map(({ id, file, relativePath }) => ({
      id,
      file,
      relativePath,
      progress: 0,
    }));
    return { files, targetFolderId };
  };

  const closeUploadDialog = () => {
    forceCloseDialogRef.current = true;
    baseDialogRef.current?.close();
    onOpenChange?.(false);
  };

  const clearSelectionAfterUpload = () => {
    revokeAllPreviews(selectedFiles);
    setSelectedFiles([]);
    setFileListPage(0);
    onUpload?.({ success: true });
    closeUploadDialog();
  };

  const runForegroundUpload = async () => {
    const { files, targetFolderId } = buildUploadPayload();
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = new AbortController();
    const { signal } = uploadAbortRef.current;

    setIsUploading(true);

    try {
      const folderHelpers = createFolderHelpersForUpload();
      await executeUploadPlan({
        files,
        activeTab,
        targetFolderId,
        signal,
        createRootFolder: folderHelpers.createUploadRootFolder,
        ensureFolderPath: folderHelpers.ensureFolderPathUnderParent,
        uploadFile: (payload) =>
          uploadFile({ ...payload, signal }).unwrap(),
        onJobProgress: (progress) => setUploadJobProgress(progress),
        onFileProgress: (updates) => {
          setSelectedFiles((prev) =>
            prev.map((f) => {
              const p = updates.get(f.id);
              if (p === undefined) return f;
              return { ...f, progress: Math.max(f.progress, p) };
            }),
          );
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success(tc("uploadSuccess"));
      clearSelectionAfterUpload();
    } catch (error) {
      if (isUploadAbortedError(error)) {
        return;
      }
      // FILES-019: the key was uploadError, which doesn't exist; the toast showed it raw.
      toast.error(tc("uploadFailed"));
    } finally {
      setIsUploading(false);
      setUploadJobProgress(null);
      uploadAbortRef.current = null;
    }
  };

  const closeDialogNow = () => {
    closeUploadDialog();
  };

  const moveUploadToBackgroundAndClose = () => {
    if (!backgroundUpload) {
      toast.error(t("backgroundUploadUnavailable"));
      return;
    }
    uploadAbortRef.current?.abort();
    const { files, targetFolderId } = buildUploadPayload();
    backgroundUpload.startBackgroundUpload({ files, activeTab, targetFolderId });
    setIsUploading(false);
    setUploadJobProgress(null);
    setUploadCloseConfirmOpen(false);
    revokeAllPreviews(selectedFiles);
    setSelectedFiles([]);
    setFileListPage(0);
    onUpload?.({ success: true });
    closeDialogNow();
  };

  const discardUploadAndClose = () => {
    uploadAbortRef.current?.abort();
    setIsUploading(false);
    setUploadJobProgress(null);
    setUploadCloseConfirmOpen(false);
    closeDialogNow();
    toast.info(t("uploadDiscarded"));
  };

  const confirmForegroundCancelUpload = () => {
    uploadAbortRef.current?.abort();
    setIsUploading(false);
    setUploadJobProgress(null);
    toast.info(t("uploadDiscarded"));
  };

  const startBackgroundUploadFromDialog = () => {
    if (!backgroundUpload) {
      toast.error(t("backgroundUploadUnavailable"));
      return;
    }
    const { files, targetFolderId } = buildUploadPayload();
    backgroundUpload.startBackgroundUpload({ files, activeTab, targetFolderId });
    setBackgroundChoiceOpen(false);
    revokeAllPreviews(selectedFiles);
    setSelectedFiles([]);
    setFileListPage(0);
    onUpload?.({ success: true });
    closeUploadDialog();
  };

  const onFinalSubmit = async () => {
    if (selectedFiles.length === 0 || isUploading) {
      return;
    }

    if (selectedFiles.length > UPLOAD_LARGE_SELECTION_THRESHOLD) {
      setBackgroundChoiceOpen(true);
      return false;
    }

    await runForegroundUpload();
  };

  const foregroundFileSummaries =
    isUploading && selectedFiles.length > 0
      ? selectedFiles.map((f) => ({
        id: f.id,
        name: f.relativePath ?? f.file.name,
        relativePath: f.relativePath,
        size: f.file.size,
        progress: f.progress,
      }))
      : [];

  const foregroundOverallPercent =
    foregroundFileSummaries.length > 0
      ? computeJobOverallPercent(foregroundFileSummaries)
      : 0;

  const foregroundDisplayCompleted =
    uploadJobProgress && foregroundFileSummaries.length > 0
      ? computeDisplayCompletedCount(
        foregroundFileSummaries,
        uploadJobProgress.totalFiles,
      )
      : 0;

  const renderUploadProgress = () =>
    isUploading && uploadJobProgress ? (
      <div className="mb-4 flex flex-col gap-2 rounded-field border border-line bg-sunken p-3">
        <Progress
          value={foregroundOverallPercent}
          label={t("uploadProgressSummary", {
            completed: foregroundDisplayCompleted,
            total: uploadJobProgress.totalFiles,
            chunk: uploadJobProgress.chunkIndex,
            chunks: uploadJobProgress.totalChunks,
          })}
        />
        <p className="text-caption text-fg-subtle">{tc("uploadLostOnLeaveHint")}</p>
        <Button variant="secondary" size="sm" className="self-start" onClick={() => setCancelUploadConfirmOpen(true)}>
          {t("cancelUpload")}
        </Button>
      </div>
    ) : null;

  const uploadCloseConfirmDialog = (
    <Dialog open={uploadCloseConfirmOpen} onOpenChange={setUploadCloseConfirmOpen}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("closeWhileUploadingTitle")}</DialogTitle>
          <DialogDescription>{t("closeWhileUploadingDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col items-stretch sm:flex-col sm:items-stretch">
          <Button onClick={moveUploadToBackgroundAndClose}>{t("closeWhileUploadingBackground")}</Button>
          <Button variant="danger" onClick={discardUploadAndClose}>
            {t("closeWhileUploadingDiscard")}
          </Button>
          <Button variant="ghost" onClick={() => setUploadCloseConfirmOpen(false)}>
            {t("closeWhileUploadingCancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const backgroundChoiceDialog = (
    <Dialog open={backgroundChoiceOpen} onOpenChange={setBackgroundChoiceOpen}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("backgroundChoiceTitle")}</DialogTitle>
          <DialogDescription>{t("backgroundChoiceDescription", { count: selectedFiles.length })}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col items-stretch sm:flex-col sm:items-stretch">
          <Button onClick={startBackgroundUploadFromDialog}>{t("backgroundChoiceConfirm")}</Button>
          <Button
            variant="secondary"
            onClick={async () => {
              setBackgroundChoiceOpen(false);
              await runForegroundUpload();
            }}
          >
            {t("backgroundChoiceStay")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ─── File list UI ─────────────────────────────────────────────────────────
  const fileListTotalPages = Math.max(1, Math.ceil(selectedFiles.length / FILE_LIST_PAGE_SIZE));
  const fileListPageStart = fileListPage * FILE_LIST_PAGE_SIZE;
  const visibleFiles = selectedFiles.slice(fileListPageStart, fileListPageStart + FILE_LIST_PAGE_SIZE);
  const fileListRangeStart = selectedFiles.length === 0 ? 0 : fileListPageStart + 1;
  const fileListRangeEnd = Math.min(selectedFiles.length, fileListPageStart + FILE_LIST_PAGE_SIZE);
  const useSplitLayout = selectedFiles.length > UPLOAD_LARGE_SELECTION_THRESHOLD;

  const renderFileList = (options?: { listClassName?: string; rootClassName?: string; sidebar?: boolean }) =>
    selectedFiles.length > 0 && (
      <div className={cn("mt-4 border-t border-line pt-2", options?.sidebar && "mt-0 flex min-h-0 flex-1 flex-col overflow-hidden border-0 pt-0", options?.rootClassName)}>
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <span className="text-caption text-fg-muted tabular-nums">
            {t("fileListPagination", { start: fileListRangeStart, end: fileListRangeEnd, total: selectedFiles.length })}
          </span>
          {fileListTotalPages > 1 ? (
            <div className="flex items-center gap-1">
              <IconButton size="sm" variant="ghost" label={t("fileListPrev")} icon={<CaretLeft className="rtl:-scale-x-100" />} disabled={fileListPage <= 0} onClick={() => goToFileListPage(fileListPage - 1)} />
              <span className="min-w-12 text-center text-caption text-fg-muted tabular-nums">
                {fileListPage + 1}/{fileListTotalPages}
              </span>
              <IconButton size="sm" variant="ghost" label={t("fileListNext")} icon={<CaretRight className="rtl:-scale-x-100" />} disabled={fileListPage >= fileListTotalPages - 1} onClick={() => goToFileListPage(fileListPage + 1)} />
            </div>
          ) : null}
        </div>
        <ul className={cn("flex flex-col gap-2 overflow-y-auto overscroll-contain pe-2", options?.sidebar ? "min-h-0 flex-1" : (options?.listClassName ?? "max-h-40"))}>
          {visibleFiles.map((fileMeta) => {
            const name = fileMeta.relativePath ?? fileMeta.file.name;
            return (
              <li key={fileMeta.id} className="flex flex-col gap-2 rounded-field border border-line bg-sunken p-3">
                <div className="flex items-center gap-3">
                  <div className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-field bg-brand-subtle text-fg-brand [&>svg]:size-4">
                    {fileMeta.previewUrl ? <Image src={fileMeta.previewUrl} alt="" fill className="object-cover" unoptimized /> : fileMeta.file.type.startsWith("image/") ? <ImageIcon aria-hidden="true" /> : <FileIcon aria-hidden="true" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span dir="auto" className="truncate text-body-sm font-medium text-fg">
                      {name}
                    </span>
                    <span className="text-caption text-fg-muted">
                      {f.bytes(fileMeta.file.size)}
                      {isUploading && fileMeta.progress >= 100 ? (
                        <span className="ms-1 inline-flex items-center gap-1 font-medium text-success">
                          · <CheckCircle aria-hidden="true" className="size-3 shrink-0" />
                          {t("uploaded")}
                        </span>
                      ) : isUploading ? (
                        <> · {t("processing")}</>
                      ) : (
                        <> · {t("ready")}</>
                      )}
                    </span>
                  </div>
                  <IconButton size="sm" variant="ghost" label={t("removeFile", { name })} icon={<X />} disabled={isUploading} onClick={(e) => removeFile(fileMeta.id, e)} />
                </div>
                {isUploading && fileMeta.progress > 0 && fileMeta.progress < 100 ? <Progress value={fileMeta.progress} label={<span className="sr-only">{name}</span>} /> : null}
              </li>
            );
          })}
        </ul>
      </div>
    );

  const inlineFileList = () => (useSplitLayout ? <div className="md:hidden">{renderFileList()}</div> : renderFileList());

  const sidebarFileList =
    useSplitLayout && selectedFiles.length > 0 ? (
      <aside className="hidden min-h-0 min-w-0 md:flex md:h-full md:max-h-full md:flex-col md:overflow-hidden md:border-s md:border-line md:ps-6">
        <p className="mb-3 shrink-0 text-body-sm font-semibold text-fg">{t("selectedFilesTitle")}</p>
        {renderFileList({ sidebar: true })}
      </aside>
    ) : null;

  // A drop target that's a real button: Enter or Space opens the chooser (FILES-023).
  const dropZone = (onPick: () => void, icon: React.ReactNode, title: string, hint?: string) => (
    <button
      type="button"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={onPick}
      className="flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line-strong bg-sunken p-8 text-center transition-colors hover:border-action-primary hover:bg-brand-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <span aria-hidden="true" className="text-fg-brand [&>svg]:size-8">
        {icon}
      </span>
      <span className="text-body font-medium text-fg">{title}</span>
      {hint ? <span className="text-body-sm text-fg-muted">{hint}</span> : null}
    </button>
  );

  // ─── Dialog content ───────────────────────────────────────────────────────
  const dialogContent = (
    <div className={cn(useSplitLayout && "md:flex md:max-h-[calc(92vh-12rem)] md:min-h-0 md:flex-col")}>
      {renderUploadProgress()}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as FileUploadTab);
          setFileListPage(0);
          setSelectedFiles((prev) => {
            revokeAllPreviews(prev);
            return [];
          });
        }}
        className={cn("w-full", useSplitLayout && "md:flex md:min-h-0 md:flex-1 md:flex-col md:overflow-hidden")}
      >
        <TabsList
          variant="contained"
          className="mb-5"
          items={[
            { value: "files", label: t("files") },
            { value: "folders", label: t("folders") },
          ]}
        />
        <div className={cn(useSplitLayout && "md:grid md:h-[calc(92vh-15rem)] md:max-h-[calc(92vh-15rem)] md:min-h-0 md:grid-cols-[1fr_minmax(280px,500px)] md:gap-8 md:overflow-hidden")}>
          <div className="min-w-0 md:h-full md:min-h-0 md:overflow-y-auto">
            <TabsPanel value="files" className="flex flex-col gap-4">
              {/* One upload has one destination (FILES-018): a single choice, typed to search. */}
              {!folderId ? (
                <RHFField
                  control={form.control}
                  name="folder"
                  label={t("chooseFolder")}
                  render={(field) => <Combobox value={field.value || null} onValueChange={(v) => field.onChange(v ?? "")} options={folderOptions} placeholder={t("folderPlaceholder")} emptyText={tc("noResultsFound")} />}
                />
              ) : null}
              <input ref={fileInputRef} type="file" multiple className="hidden" tabIndex={-1} aria-hidden="true" onChange={handleInputChange} />
              {dropZone(() => fileInputRef.current?.click(), <CloudArrowUp weight="duotone" />, t("dragDropFiles"))}
              {inlineFileList()}
              <Button variant="secondary" startIcon={<Camera />} onClick={() => startCamera()}>
                {t("cameraLabel")}
              </Button>

              {isCameraOpen ? (
                <div role="dialog" aria-modal="true" aria-label={t("cameraLabel")} className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-black p-4 pb-10 text-white">
                  {isRecording ? (
                    <div role="status" className="absolute inset-x-0 top-6 z-[70] mx-auto flex w-fit items-center gap-2 rounded-pill bg-danger-solid px-4 py-1.5 text-on-danger-solid shadow-overlay">
                      <span aria-hidden="true" className="size-2.5 animate-ping rounded-pill bg-white" />
                      <span className="font-mono text-body-sm font-bold tabular-nums">{formatTime(recordingDuration)}</span>
                    </div>
                  ) : null}
                  <div className="flex w-full shrink-0 justify-end">
                    <button type="button" aria-label={t("cameraClose")} onClick={stopCameraFixed} className="grid size-12 place-items-center rounded-pill hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white">
                      <X aria-hidden="true" className="size-8" />
                    </button>
                  </div>
                  <div className="relative my-4 flex w-full flex-1 items-center justify-center overflow-hidden">
                    <div className="relative aspect-[3/4] w-full max-w-[min(100%,450px)] overflow-hidden rounded-[2.5rem] border border-white/10 bg-black shadow-overlay sm:aspect-video">
                      <video ref={videoRef} autoPlay muted playsInline className="mirror-mode h-full w-full object-cover" />
                    </div>
                  </div>
                  <div className="flex w-full max-w-md shrink-0 items-center justify-evenly gap-4 px-6">
                    <button type="button" aria-label={t("cameraSwitch")} onClick={toggleCamera} disabled={isRecording} className="grid size-14 place-items-center rounded-pill border border-white/20 bg-white/10 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-white">
                      <ArrowsClockwise aria-hidden="true" className="size-7" />
                    </button>
                    {!isRecordingMode ? (
                      <button type="button" aria-label={t("capturePhoto")} onClick={capturePhoto} className="grid size-20 place-items-center rounded-pill border-4 border-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                        <span className="size-16 rounded-pill bg-white" />
                      </button>
                    ) : !isRecording ? (
                      <button type="button" aria-label={t("startRecording")} onClick={startRecording} className="grid size-20 place-items-center rounded-pill border-4 border-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                        <span className="size-16 rounded-pill bg-danger-solid" />
                      </button>
                    ) : (
                      <button type="button" aria-label={t("stopRecording")} onClick={stopRecording} className="grid size-20 animate-pulse place-items-center rounded-pill bg-danger-solid focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                        <span className="size-7 rounded-sm bg-white" />
                      </button>
                    )}
                    {!isRecording ? (
                      <button
                        type="button"
                        aria-label={t(isRecordingMode ? "photoMode" : "videoMode")}
                        onClick={() => setIsRecordingMode(!isRecordingMode)}
                        className="grid size-14 place-items-center rounded-pill border border-white/20 bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
                      >
                        {isRecordingMode ? <Camera aria-hidden="true" className="size-7" /> : <VideoCamera aria-hidden="true" className="size-7" />}
                      </button>
                    ) : (
                      <span className="size-14" />
                    )}
                  </div>
                </div>
              ) : null}
            </TabsPanel>

            <TabsPanel value="folders" className="flex flex-col gap-4">
              <input
                ref={folderInputRef}
                type="file"
                multiple
                // @ts-expect-error -- the folder picker attribute isn't in React's types
                webkitdirectory=""
                directory=""
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={handleInputChange}
              />
              {dropZone(() => folderInputRef.current?.click(), <FolderOpen weight="duotone" />, t("dragDropFolder"), t("selectFolderFromDevice"))}
              {inlineFileList()}
            </TabsPanel>
          </div>
          {sidebarFileList}
        </div>
      </Tabs>
    </div>
  );

  return (
    <>
      {backgroundChoiceDialog}
      {uploadCloseConfirmDialog}
      <CancelUploadConfirmDialog open={cancelUploadConfirmOpen} onOpenChange={setCancelUploadConfirmOpen} onConfirm={confirmForegroundCancelUpload} />
      <BaseDialog
        ref={baseDialogRef}
        title={t("title")}
        content={dialogContent}
        submitText={t("uploadNow")}
        onSubmit={onFinalSubmit}
        onBeforeClose={() => {
          if (forceCloseDialogRef.current) {
            forceCloseDialogRef.current = false;
            return true;
          }
          if (isUploading) {
            setUploadCloseConfirmOpen(true);
            return false;
          }
          return true;
        }}
        size={useSplitLayout ? "2xl" : "md"}
        contentClassName={useSplitLayout ? "max-h-[min(920px,92vh)]" : undefined}
        bodyClassName={useSplitLayout ? "min-h-0 overflow-hidden" : undefined}
        open={open}
        onOpenChange={onOpenChange}
      >
        <Button variant="secondary" size="lg" startIcon={<UploadSimple />}>
          {t("uploadBtn")}
        </Button>
      </BaseDialog>
    </>
  );
}
