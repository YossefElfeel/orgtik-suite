export type AttachmentCategory =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "code"
  | "archive"
  | "generic";

/**
 * Categorizes a file by its MIME type or extension.
 */
export function getAttachmentCategory(
  mimetype: string,
  filename: string
): AttachmentCategory {
  const mimeLower = mimetype ? mimetype.toLowerCase() : "";
  const ext = filename ? filename.split(".").pop()?.toLowerCase() || "" : "";

  if (mimeLower.startsWith("image/")) return "image";
  if (mimeLower.startsWith("video/")) return "video";
  if (mimeLower.startsWith("audio/")) return "audio";

  if (
    mimeLower.startsWith("text/") ||
    [
      "json",
      "js",
      "ts",
      "tsx",
      "jsx",
      "html",
      "css",
      "py",
      "sh",
      "yml",
      "yaml",
      "md",
      "go",
      "rs",
      "java",
      "cpp",
      "c",
      "cs",
    ].includes(ext)
  ) {
    return "code";
  }

  if (
    [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/csv",
    ].includes(mimeLower) ||
    ["pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "csv"].includes(ext)
  ) {
    return "document";
  }

  if (
    [
      "application/zip",
      "application/x-zip-compressed",
      "application/x-tar",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      "application/gzip",
    ].includes(mimeLower) ||
    ["zip", "rar", "tar", "gz", "7z", "tgz"].includes(ext)
  ) {
    return "archive";
  }

  return "generic";
}

/**
 * Formats bytes to a user-friendly size string (e.g. 2.5 MB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
