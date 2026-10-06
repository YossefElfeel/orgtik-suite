import type { UploadFileSummary } from "./types";

export function computeJobOverallPercent(
  fileSummaries: UploadFileSummary[],
): number {
  const totalBytes = fileSummaries.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes <= 0) return 0;

  const loadedBytes = fileSummaries.reduce(
    (sum, f) => sum + (f.size * Math.min(100, f.progress)) / 100,
    0,
  );

  return Math.round((loadedBytes / totalBytes) * 100);
}

/** Human-readable completed count that includes in-flight bytes in the current batch. */
export function computeDisplayCompletedCount(
  fileSummaries: UploadFileSummary[],
  totalFiles: number,
): number {
  if (totalFiles <= 0) return 0;
  const fullyDone = fileSummaries.filter((f) => f.progress >= 100).length;
  const overall = computeJobOverallPercent(fileSummaries);
  const estimated = Math.round((overall / 100) * totalFiles);
  return Math.min(totalFiles, Math.max(fullyDone, estimated));
}

function summariesFromFiles(
  files: { id: string; file: File; relativePath?: string; progress: number }[],
): UploadFileSummary[] {
  return files.map((f) => ({
    id: f.id,
    name: f.relativePath ?? f.file.name,
    relativePath: f.relativePath,
    size: f.file.size,
    progress: f.progress,
  }));
}

export function mergeFileProgressUpdates(
  summaries: UploadFileSummary[],
  updates: Map<string, number>,
): UploadFileSummary[] {
  if (updates.size === 0) return summaries;
  return summaries.map((f) => {
    const next = updates.get(f.id);
    if (next === undefined) return f;
    return { ...f, progress: Math.max(f.progress, next) };
  });
}

export { summariesFromFiles };
