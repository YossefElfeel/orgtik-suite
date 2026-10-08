import type { FileReference, FileAttempt } from "./file-references";
import { fileRequest, fileScope, FileRequestError, newFileAttempt } from "./file-references";
import { readClientSession } from "@orgtik/ui/auth";
import { encodeWhiteboardScene } from "./whiteboard-scene";
import type { WhiteboardScene } from "./whiteboard-scene";
export type WhiteboardSummary = { workspaceId: string; id: string; name: string; channelId: string | null; meetingId: string | null; revision: number; reference: FileReference; updatedAt: string; capabilities: { canWrite: boolean; readOnly: boolean } };
export type WhiteboardDetail = WhiteboardSummary & { scene: WhiteboardScene; historical?: boolean; savedReference?: FileReference; replayed?: boolean };
export type BoardTarget = { channelId?: string; meetingId?: string };
export type BoardAttempt = FileAttempt & { body: { name?: string; parentId?: string; channelId?: string; meetingId?: string; baseVersionId?: string; scene: WhiteboardScene } };
function validSummary(value: WhiteboardSummary): boolean {
  const workspaceId = readClientSession()?.workspaceContext?.workspace.id;
  return Boolean(value && value.workspaceId === workspaceId && typeof value.id === "string" && typeof value.name === "string" && Number.isSafeInteger(value.revision) && value.reference?.workspaceId === workspaceId && typeof value.reference.fileId === "string" && typeof value.reference.versionId === "string" && typeof value.capabilities?.canWrite === "boolean" && typeof value.capabilities.readOnly === "boolean");
}
function detail(value: WhiteboardDetail, uncertain = false): WhiteboardDetail {
  try {
    if (!validSummary(value) || value.scene?.schema !== "orgtik.whiteboard" || value.scene.version !== 1) throw new Error("invalid");
    encodeWhiteboardScene(value.scene.elements, value.scene.appState);
    if (value.savedReference && (value.savedReference.workspaceId !== value.workspaceId || value.savedReference.fileId !== value.reference.fileId || typeof value.savedReference.versionId !== "string")) throw new Error("invalid");
    return value;
  } catch { throw new FileRequestError("invalid_response", 0, uncertain); }
}
export async function listWhiteboards(target: BoardTarget, signal?: AbortSignal) {
  const value = await fileRequest<{ items: WhiteboardSummary[] }>("/api/hq/whiteboards?" + new URLSearchParams(target), { signal });
  if (!Array.isArray(value?.items) || value.items.some(item => !validSummary(item))) throw new FileRequestError("invalid_response");
  return value;
}
export const loadWhiteboard = async (id: string, versionId?: string, signal?: AbortSignal) => detail(await fileRequest<WhiteboardDetail>("/api/hq/whiteboards/" + encodeURIComponent(id) + (versionId ? "?versionId=" + encodeURIComponent(versionId) : ""), { signal }));
export function boardAttempt(scene: WhiteboardScene, current: WhiteboardDetail | null, name: string, target: BoardTarget): BoardAttempt {
  const path = "/api/hq/whiteboards" + (current ? "/" + encodeURIComponent(current.id) : "");
  return newFileAttempt(path, current ? "PATCH" : "POST", current ? { baseVersionId: current.reference.versionId, scene } : { name, ...target, scene }) as BoardAttempt;
}
export const saveWhiteboard = async (attempt: BoardAttempt) => detail(await fileRequest<WhiteboardDetail>(attempt.path, { attempt }), true);
export const boardStorageKey = (target: BoardTarget, boardId?: string) => "orgtik:whiteboard:" + fileScope() + ":" + JSON.stringify(target) + ":" + (boardId || "new");

