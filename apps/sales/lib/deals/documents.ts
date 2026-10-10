// Contract documents are served behind the session, so they are fetched with the bearer token and
// shown from a local blob. The API answers /contracts/:id/pdf with a file record that points at
// the file itself.
import { API_URL } from "@/constants";
import type { ContractFile } from "@/types/projects";
import { readClientSession } from "@orgtik/ui/auth";

export type FetchedDocument = { blob: Blob; contentType: string; fileName?: string };

const resolve = (url: string) => {
  if (/^(https?:|blob:)/.test(url)) return url;
  const base = API_URL?.replace(/\/$/, "") ?? "";
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
};

async function fetchDocument(url: string, token: string | null | undefined, fileName?: string): Promise<FetchedDocument> {
  const workspaceId = readClientSession()?.workspaceContext?.workspace.id;
  const response = await fetch(resolve(url), { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(workspaceId ? { "X-Workspace": workspaceId } : {}) } });
  if (workspaceId !== readClientSession()?.workspaceContext?.workspace.id) throw new Error("workspace changed");
  if (!response.ok) throw new Error(`document ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as { data?: ContractFile };
    if (!payload?.data?.url) throw new Error("document url missing");
    return fetchDocument(payload.data.url, token, payload.data.name ?? fileName);
  }
  const blob = await response.blob();
  return { blob, contentType: contentType || blob.type || "application/octet-stream", fileName };
}

/** The contract's current document: the signed one once uploaded, else the generated one. */
export function fetchContractDocument(contractId: string, token: string | null | undefined) {
  return fetchDocument(`/contracts/${contractId}/pdf`, token);
}
export function fetchOfferDocument(offerId: string, token: string | null | undefined) {
  return fetchDocument(`/crm/v3/offers/${encodeURIComponent(offerId)}/pdf`, token);
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const isImage = (contentType: string) => contentType.startsWith("image/");
