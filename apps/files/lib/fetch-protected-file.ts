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

/**
 * Fetch a protected file/folder binary with the session bearer token.
 * `protectedUrl` may be absolute (as returned by the API) or relative.
 */
export async function fetchProtectedFile(
  protectedUrl: string,
  accessToken: string | null | undefined,
  signal?: AbortSignal,
): Promise<Blob> {
  const headers = new Headers({ Accept: "*/*" });
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(protectedUrl, {
    method: "GET",
    headers,
    signal,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const blob = await response.blob();

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;

    if (contentType.includes("application/json") || blob.type.includes("json")) {
      payload = await readApiErrorFromBlob(blob);
    }

    throw new Error(errorMessage(payload) || `Request failed (${response.status})`);
  }

  // Some gateways still return 200 with a JSON error body as a blob.
  if (blob.type.includes("json")) {
    const payload = await readApiErrorFromBlob(blob);
    if (payload) {
      throw new Error(errorMessage(payload));
    }
  }

  return blob;
}
