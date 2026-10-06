import { API_URL } from "@/constants/env";

export function isAbsoluteHttpUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

/** Builds the same URL candidates the client uses to reach the stored file. */
export function resolveAttachmentUpstreamUrls(fileUrl: string): string[] {
  const apiOrigin =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  const apiBase = API_URL.replace(/\/$/, "");
  const urls: string[] = [];

  if (isAbsoluteHttpUrl(fileUrl)) {
    urls.push(fileUrl);
    return urls;
  }

  if (fileUrl.startsWith("/")) {
    if (apiOrigin) urls.push(`${apiOrigin}${fileUrl}`);
    if (apiBase && !fileUrl.startsWith("/api")) {
      urls.push(`${apiBase}${fileUrl}`);
    }
  } else if (fileUrl) {
    urls.push(fileUrl);
  }

  return urls;
}

export function getAllowedDownloadOrigins(): Set<string> {
  const allowed = new Set<string>();
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (api) {
    try {
      allowed.add(new URL(api).origin);
    } catch {
      /* ignore */
    }
  }
  const extra = process.env.NEXT_PUBLIC_ATTACHMENT_DOWNLOAD_ORIGINS;
  if (extra) {
    for (const part of extra.split(",")) {
      const raw = part.trim();
      if (!raw) continue;
      try {
        const href = raw.includes("://") ? raw : `https://${raw}`;
        allowed.add(new URL(href).origin);
      } catch {
        /* ignore */
      }
    }
  }
  return allowed;
}

export function isAllowedAttachmentUrl(url: string): boolean {
  try {
    const origin = new URL(url).origin;
    return getAllowedDownloadOrigins().has(origin);
  } catch {
    return false;
  }
}
