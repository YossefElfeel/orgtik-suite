import { API_URL } from "@/constants/env";
import { fileRequest, FileRequestError } from "./file-references";

export type ApiErrorPayload = {
  success: false;
  message: string | string[];
  error: string | string[];
  statusCode: number;
};

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as { success: unknown }).success === false &&
    "statusCode" in value &&
    typeof (value as { statusCode: unknown }).statusCode === "number"
  );
}

export function errorMessage(payload: ApiErrorPayload | null): string {
  if (!payload) return "The operation could not be completed.";
  return Array.isArray(payload.message)
    ? payload.message.join("\n")
    : payload.message;
}

export async function readApiErrorFromBlob(
  blob: Blob,
): Promise<ApiErrorPayload | null> {
  try {
    const parsed: unknown = JSON.parse(await blob.text());
    return isApiErrorPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Protected bytes stay on this app's origin and current workspace authority. */
export async function fetchProtectedFile(protectedUrl: string, _accessToken: string | null | undefined, signal?: AbortSignal): Promise<Blob> {
  const url = new URL(protectedUrl, API_URL), api = new URL(API_URL);
  const prefix = api.pathname.replace(/\/api\/?$/, "").replace(/\/$/, "");
  if (url.origin !== api.origin || !url.pathname.startsWith(prefix + "/api/")) throw new FileRequestError("invalid_reference", 400);
  return fileRequest<Blob>(url.pathname.slice(prefix.length) + url.search, { binary: true, signal });
}
