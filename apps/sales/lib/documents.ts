import { API_URL } from "@/constants";
import type { ContractPdfFile } from "@/types/projects";

type DocumentFetchResult = {
  blob: Blob;
  contentType: string;
  fileName?: string;
};

type FileDocumentApiResponse = {
  success?: boolean;
  data?: ContractPdfFile;
};

/**
 * The session token goes only to the API itself. A document whose address points anywhere else
 * is fetched without it, so a stored URL can't collect the bearer token (SAL-059).
 */
export function isApiUrl(url: string) {
  try {
    const api = new URL(API_URL ?? "", typeof window !== "undefined" ? window.location.href : "http://localhost");
    const target = new URL(url, typeof window !== "undefined" ? window.location.href : api.href);
    return target.origin === api.origin;
  } catch {
    return false;
  }
}

const authHeaders = (url: string, token?: string | null): HeadersInit => (token && isApiUrl(url) ? { Authorization: `Bearer ${token}` } : {});

export function resolveDocumentUrl(url: string) {
  if (!url || url === "#") {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }

  const baseUrl = API_URL?.replace(/\/$/, "") ?? "";
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  return `${baseUrl}${normalizedPath}`;
}

export function isImageDocument(url: string) {
  return /\.(jpeg|jpg|gif|png|webp)(\?|$)/i.test(url);
}

export function isPdfDocument(url: string, mimeType?: string) {
  return mimeType === "application/pdf" || /\.pdf(\?|$)/i.test(url);
}

function parseFileDocumentPayload(payload: FileDocumentApiResponse): ContractPdfFile {
  const file = payload?.data;

  if (!file?.url) {
    throw new Error("Document URL not found");
  }

  return file;
}

async function fetchDocumentFromUrl(
  url: string,
  token?: string | null,
  fileName?: string,
): Promise<DocumentFetchResult> {
  const resolvedUrl = resolveDocumentUrl(url);
  const response = await fetch(resolvedUrl, {
    headers: authHeaders(resolvedUrl, token),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch document");
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as FileDocumentApiResponse;
    const file = parseFileDocumentPayload(payload);

    return fetchDocumentFromUrl(file.url, token, file.name ?? fileName);
  }

  const blob = await response.blob();

  return {
    blob,
    contentType: contentType || blob.type || "application/octet-stream",
    fileName,
  };
}

export async function fetchAuthenticatedDocument(
  url: string,
  token?: string | null,
) {
  return fetchDocumentFromUrl(url, token);
}

export async function fetchContractPdf(contractId: string, token?: string | null) {
  const baseUrl = API_URL?.replace(/\/$/, "") ?? "";
  const pdfUrl = `${baseUrl}/contracts/${contractId}/pdf`;
  const response = await fetch(pdfUrl, {
    headers: authHeaders(pdfUrl, token),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch contract PDF");
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as FileDocumentApiResponse;
    const file = parseFileDocumentPayload(payload);

    return fetchDocumentFromUrl(file.url, token, file.name);
  }

  const blob = await response.blob();

  return {
    blob,
    contentType: contentType || "application/pdf",
  };
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function createBlobPreviewUrl(blob: Blob, contentType?: string) {
  const fileBlob =
    contentType && blob.type !== contentType
      ? new Blob([blob], { type: contentType })
      : blob;

  return URL.createObjectURL(fileBlob);
}
