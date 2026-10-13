import { getCookie } from "cookies-next";
import { TOKEN_COOKIE } from "@/constants";
import {
  isAbsoluteHttpUrl,
  resolveAttachmentUpstreamUrls,
} from "@/lib/attachmentDownloadUrls";
import { toast } from "@orgtik/ui";
import { appPath } from "@orgtik/ui/auth";

// The failure message in the reader's language; ApiFeedback sets it once the language is known.
let failedText = "Download failed";
export function setDownloadFailedText(text: string) {
  failedText = text;
}

function getBearerToken(): string | null {
  const raw = getCookie(TOKEN_COOKIE);
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object" && "accessToken" in parsed) {
      return typeof parsed.accessToken === "string"
        ? parsed.accessToken
        : null;
    }
    return null;
  } catch {
    return null;
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const forced = new Blob([blob], { type: "application/octet-stream" });
  const blobUrl = URL.createObjectURL(forced);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}

function buildFetchAttempts(
  fileUrl: string,
  token: string | null,
): { url: string; init?: RequestInit }[] {
  const apiOrigin =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  const targets = resolveAttachmentUpstreamUrls(fileUrl);
  const attempts: { url: string; init?: RequestInit }[] = [];

  for (const url of targets) {
    if (token && apiOrigin && url.startsWith(apiOrigin)) {
      attempts.push({
        url,
        init: { headers: { Authorization: `Bearer ${token}` } },
      });
    }
    attempts.push({ url });
  }

  return attempts;
}

async function tryDownloadBlob(
  attempts: { url: string; init?: RequestInit }[],
  filename: string,
): Promise<boolean> {
  for (const { url, init } of attempts) {
    try {
      const response = await fetch(url, { ...init, mode: "cors" });
      if (!response.ok) continue;
      const blob = await response.blob();
      triggerBlobDownload(blob, filename);
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

/**
 * Saves the file to the browser download location (download shelf / history),
 * without navigating away or opening an in-tab viewer. Uses a same-origin
 * proxy when needed so the response can carry Content-Disposition: attachment.
 */
export async function downloadAttachmentFile(
  fileUrl: string,
  preferredName: string,
): Promise<void> {
  const filename =
    preferredName?.trim() ||
    fileUrl.split("/").pop()?.split("?")[0] ||
    "download";

  const token = getBearerToken();

  if (await tryDownloadBlob(buildFetchAttempts(fileUrl, token), filename)) {
    return;
  }

  const proxyUrl = appPath(`/api/attachment-download?u=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(filename)}`);

  try {
    const response = await fetch(proxyUrl, {
      credentials: "include",
      mode: "same-origin",
    });
    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(
        typeof err?.error === "string" ? err.error : "Download failed",
      );
    }
    const blob = await response.blob();
    triggerBlobDownload(blob, filename);
  } catch {
    toast.error(failedText);
  }
}
