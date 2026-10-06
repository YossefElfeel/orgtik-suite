import { fetchProtectedFile } from "@/lib/fetch-protected-file";

export function sanitizeClientFileName(fileName: string): string {
  const sanitized = fileName
    .replace(/[<>:"/\\|?*\u0000-\u001F\u007F]/g, "_")
    .trim();

  return sanitized || "download";
}

export function saveBlob(blob: Blob, requestedFileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = sanitizeClientFileName(requestedFileName);
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export async function downloadProtectedUrl(
  protectedUrl: string,
  fileName: string,
  accessToken: string | null | undefined,
  signal?: AbortSignal,
): Promise<void> {
  const blob = await fetchProtectedFile(protectedUrl, accessToken, signal);
  saveBlob(blob, fileName);
}
