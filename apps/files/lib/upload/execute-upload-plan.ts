import type { IFileUploadPayload } from "@/types";
import {
  UPLOAD_CHUNK_MAX_RETRIES,
  UPLOAD_CHUNK_SIZE,
  UPLOAD_PROGRESS_THROTTLE_MS,
  countUploadChunks,
} from "./constants";
import { UploadAbortedError } from "./errors";
import {
  fileBasename,
  normalizeUploadPath,
  toPathsRelativeToRootFolder,
} from "./folder-upload-paths";
import type { FileUploadTab, UploadFileItem, UploadJobProgress } from "./types";
import type {
  CreateUploadRootFolder,
  EnsureFolderPathUnderParent,
} from "./create-upload-root-folder";
import { store } from "@/redux/app/store";
import { fileApi } from "@/redux/features/file/fileApi";

type UploadPlanItem = { files: UploadFileItem[]; folderName?: string };

/**
 * Directory key under the tree root for a file, e.g.
 * ParentTest/child-1/a.png → "child-1"
 * ParentTest/a/b/c.png → "a/b"
 * ParentTest/alone.png → ""
 */
export function relativeDirUnderRoot(
  relativePath: string,
  rootFolderName: string | undefined,
): string {
  const stripped = toPathsRelativeToRootFolder(
    [relativePath],
    rootFolderName,
  )[0];
  const parts = normalizeUploadPath(stripped).split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

/** Group files so each batch only contains one directory (API-safe). */
export function groupFilesByRelativeDir(
  files: UploadFileItem[],
  rootFolderName: string | undefined,
): Map<string, UploadFileItem[]> {
  const groups = new Map<string, UploadFileItem[]>();

  for (const file of files) {
    const raw = file.relativePath ?? file.file.name;
    const dir = relativeDirUnderRoot(raw, rootFolderName);
    const list = groups.get(dir) ?? [];
    list.push(file);
    groups.set(dir, list);
  }

  for (const [, list] of groups) {
    list.sort((a, b) =>
      normalizeUploadPath(a.relativePath ?? a.file.name).localeCompare(
        normalizeUploadPath(b.relativePath ?? b.file.name),
      ),
    );
  }

  return groups;
}

function buildUploadPlan(
  files: UploadFileItem[],
  activeTab: FileUploadTab,
): UploadPlanItem[] {
  const plan: UploadPlanItem[] = [];

  if (activeTab === "folders") {
    const groups: Record<string, UploadFileItem[]> = {};
    const standalone: UploadFileItem[] = [];

    files.forEach((f) => {
      const parts = normalizeUploadPath(f.relativePath ?? f.file.name)
        .split("/")
        .filter(Boolean);
      if (parts.length > 1) {
        const root = parts[0];
        if (!groups[root]) groups[root] = [];
        groups[root].push(f);
      } else {
        standalone.push(f);
      }
    });

    for (const [fName, groupFiles] of Object.entries(groups)) {
      plan.push({ files: groupFiles, folderName: fName });
    }
    if (standalone.length > 0) {
      plan.push({ files: standalone });
    }
  } else {
    plan.push({ files });
  }

  return plan;
}

type BatchUploadTarget = {
  folderId?: string;
  folderName?: string;
};

export type ExecuteUploadPlanOptions = {
  files: UploadFileItem[];
  activeTab: FileUploadTab;
  targetFolderId?: string;
  uploadFile: (payload: IFileUploadPayload) => Promise<unknown>;
  onJobProgress: (progress: UploadJobProgress) => void;
  onFileProgress: (updates: Map<string, number>) => void;
  onRetry?: (chunkNumber: number, attempt: number) => void;
  signal?: AbortSignal;
  createRootFolder?: CreateUploadRootFolder;
  ensureFolderPath?: EnsureFolderPathUnderParent;
};

export async function executeUploadPlan(
  options: ExecuteUploadPlanOptions,
): Promise<void> {
  const {
    files,
    activeTab,
    targetFolderId,
    uploadFile,
    onJobProgress,
    onFileProgress,
    onRetry,
    signal,
    createRootFolder,
    ensureFolderPath,
  } = options;

  const throwIfAborted = () => {
    if (signal?.aborted) {
      throw new UploadAbortedError();
    }
  };

  const uploadPlan = buildUploadPlan(files, activeTab);

  // Count chunks after directory splitting (folder trees) or flat size (files tab).
  let totalChunks = 0;
  for (const item of uploadPlan) {
    if (item.folderName) {
      const byDir = groupFilesByRelativeDir(item.files, item.folderName);
      for (const dirFiles of byDir.values()) {
        totalChunks += countUploadChunks(dirFiles.length);
      }
    } else {
      totalChunks += countUploadChunks(item.files.length);
    }
  }

  const jobProgress: UploadJobProgress = {
    completedFiles: 0,
    totalFiles: files.length,
    chunkIndex: 0,
    totalChunks,
  };
  onJobProgress({ ...jobProgress });

  const uploadBatch = async (
    batchFiles: UploadFileItem[],
    target: BatchUploadTarget,
    /** Paths relative to target.folderId (usually basenames only). */
    relativePaths: string[],
  ) => {
    const filesToUpload = batchFiles.map((f) => f.file);

    const cumulativeSizes: number[] = [];
    filesToUpload.reduce((sum, currentFile) => {
      const next = sum + (currentFile.size || 0);
      cumulativeSizes.push(next);
      return next;
    }, 0);

    let latestLoaded = 0;
    let progressThrottleTimer: ReturnType<typeof setTimeout> | null = null;

    const applyBatchProgress = (loaded: number) => {
      const updates = new Map<string, number>();
      batchFiles.forEach((bf, idx) => {
        const fileSize = batchFiles[idx].file.size;
        const end = cumulativeSizes[idx];
        const start = end - fileSize;
        const uploadedForFile = Math.max(
          0,
          Math.min(fileSize, loaded - start),
        );
        const calculatedProgress =
          fileSize === 0
            ? 100
            : Math.floor((uploadedForFile / fileSize) * 100);
        updates.set(bf.id, calculatedProgress);
      });
      onFileProgress(updates);
    };

    const scheduleProgressUpdate = (loaded: number) => {
      latestLoaded = loaded;
      if (progressThrottleTimer) return;
      applyBatchProgress(loaded);
      progressThrottleTimer = setTimeout(() => {
        progressThrottleTimer = null;
        applyBatchProgress(latestLoaded);
      }, UPLOAD_PROGRESS_THROTTLE_MS);
    };

    const payload: IFileUploadPayload = {
      files: filesToUpload,
      relativePaths,
      skipInvalidation: true,
      onUploadProgress: ({ loaded }) => scheduleProgressUpdate(loaded),
    };

    if (target.folderName) payload.folderName = target.folderName;
    if (target.folderId) payload.folderId = target.folderId;
    if (signal) payload.signal = signal;

    throwIfAborted();
    try {
      return await uploadFile(payload);
    } finally {
      if (progressThrottleTimer) {
        clearTimeout(progressThrottleTimer);
        progressThrottleTimer = null;
      }
      applyBatchProgress(latestLoaded);
    }
  };

  const uploadBatchWithRetry = async (
    batchFiles: UploadFileItem[],
    target: BatchUploadTarget,
    relativePaths: string[],
    chunkNumber: number,
  ) => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= UPLOAD_CHUNK_MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          onRetry?.(chunkNumber, attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
        throwIfAborted();
        return await uploadBatch(batchFiles, target, relativePaths);
      } catch (error) {
        if (error instanceof UploadAbortedError) throw error;
        lastError = error;
      }
    }
    throw lastError;
  };

  const chunkOffset = { value: 0 };
  let shouldInvalidateCaches = false;

  const runChunks = async (
    groupFiles: UploadFileItem[],
    target: BatchUploadTarget,
    pathMode: "basename" | "as-is",
    rootFolderName?: string,
  ) => {
    for (let i = 0; i < groupFiles.length; i += UPLOAD_CHUNK_SIZE) {
      throwIfAborted();
      const chunk = groupFiles.slice(i, i + UPLOAD_CHUNK_SIZE);
      chunkOffset.value += 1;
      jobProgress.chunkIndex = chunkOffset.value;
      onJobProgress({ ...jobProgress });

      const relativePaths =
        pathMode === "basename"
          ? chunk.map((f) =>
              fileBasename(
                toPathsRelativeToRootFolder(
                  [f.relativePath ?? f.file.name],
                  rootFolderName,
                )[0],
              ),
            )
          : chunk.map((f) => f.relativePath ?? f.file.name);

      await uploadBatchWithRetry(
        chunk,
        target,
        relativePaths,
        chunkOffset.value,
      );
      shouldInvalidateCaches = true;

      const completed = new Map<string, number>();
      chunk.forEach((f) => completed.set(f.id, 100));
      onFileProgress(completed);

      jobProgress.completedFiles += chunk.length;
      onJobProgress({ ...jobProgress });
    }
  };

  try {
    for (const item of uploadPlan) {
      throwIfAborted();
      const rootFolderName = item.folderName;

      // ── Files tab / no tree: flat chunked upload ───────────────────────────
      if (!rootFolderName) {
        const target: BatchUploadTarget = {};
        if (targetFolderId) target.folderId = targetFolderId;
        await runChunks(item.files, target, "as-is");
        continue;
      }

      // ── Folders tab: create root, then one directory at a time ──────────────
      if (!createRootFolder || !ensureFolderPath) {
        throw new Error(
          "Folder upload requires createRootFolder and ensureFolderPath",
        );
      }

      const rootFolderId = await createRootFolder(
        rootFolderName,
        targetFolderId,
      );
      shouldInvalidateCaches = true;
      const byDir = groupFilesByRelativeDir(item.files, rootFolderName);

      // Stable order: root files first, then child dirs alphabetically
      const dirKeys = [...byDir.keys()].sort((a, b) => {
        if (a === "") return -1;
        if (b === "") return 1;
        return a.localeCompare(b);
      });

      for (const dir of dirKeys) {
        throwIfAborted();
        const dirFiles = byDir.get(dir) ?? [];
        if (dirFiles.length === 0) continue;

        const destFolderId =
          dir === ""
            ? rootFolderId
            : await ensureFolderPath(dir, rootFolderId);

        await runChunks(
          dirFiles,
          { folderId: destFolderId },
          "basename",
          rootFolderName,
        );
      }
    }
  } finally {
    // One cache refresh after the whole plan — not after every chunk/folder create.
    if (shouldInvalidateCaches) {
      store.dispatch(fileApi.util.invalidateTags(["File", "Folder"]));
    }
  }
}
