import { store } from "@/redux/app/store";
import { folderApi } from "@/redux/features/folder/folderApi";
import type { IFolder, SuccessResponse } from "@/types";
import { normalizeUploadPath } from "./folder-upload-paths";
import { resolveRootFolderIdByName } from "./resolve-root-folder-id";

function extractCreatedFolderId(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  const top = response as Record<string, unknown>;
  const data = top.data;

  if (typeof data === "string" && data.length > 0) return data;

  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.id === "string" && d.id.length > 0) return d.id;
    if (d.folder && typeof d.folder === "object") {
      const folder = d.folder as Record<string, unknown>;
      if (typeof folder.id === "string" && folder.id.length > 0) {
        return folder.id;
      }
    }
  }

  if (typeof top.id === "string" && top.id.length > 0) return top.id;
  return undefined;
}

function folderCacheKey(name: string, parentFolderId?: string): string {
  return `${parentFolderId ?? ""}::${normalizeUploadPath(name)}`;
}

export type CreateUploadRootFolder = (
  name: string,
  parentFolderId?: string,
) => Promise<string>;

export type EnsureFolderPathUnderParent = (
  relativeDir: string,
  parentFolderId: string,
) => Promise<string>;

/**
 * Per-upload-session helpers: create folders without listing/refetching children
 * between every batch (that was spamming Network during progress updates).
 */
export function createFolderHelpersForUpload(): {
  createUploadRootFolder: CreateUploadRootFolder;
  ensureFolderPathUnderParent: EnsureFolderPathUnderParent;
} {
  const cache = new Map<string, string>();

  const createUploadRootFolder: CreateUploadRootFolder = async (
    name,
    parentFolderId,
  ) => {
    const folderName = normalizeUploadPath(name);
    const key = folderCacheKey(folderName, parentFolderId);
    const cached = cache.get(key);
    if (cached) return cached;

    try {
      const res = (await store
        .dispatch(
          folderApi.endpoints.createFolder.initiate({
            name: folderName,
            skipInvalidation: true,
            ...(parentFolderId
              ? { parentId: parentFolderId }
              : { visibility: "only_me" as const }),
          }),
        )
        .unwrap()) as SuccessResponse<IFolder> | IFolder | unknown;

      let id = extractCreatedFolderId(res);
      // Only hit the list API if the create response omitted an id.
      if (!id) {
        id = await resolveRootFolderIdByName(folderName, parentFolderId);
      }
      if (!id) {
        throw new Error(
          `Could not create upload folder "${folderName}" (missing id in response)`,
        );
      }
      cache.set(key, id);
      return id;
    } catch (error) {
      // Name conflict / already exists — resolve once, then cache.
      const existing = await resolveRootFolderIdByName(
        folderName,
        parentFolderId,
      );
      if (existing) {
        cache.set(key, existing);
        return existing;
      }
      throw error;
    }
  };

  const ensureFolderPathUnderParent: EnsureFolderPathUnderParent = async (
    relativeDir,
    parentFolderId,
  ) => {
    const segments = normalizeUploadPath(relativeDir)
      .split("/")
      .filter(Boolean);

    let currentParentId = parentFolderId;
    for (const segment of segments) {
      currentParentId = await createUploadRootFolder(segment, currentParentId);
    }
    return currentParentId;
  };

  return { createUploadRootFolder, ensureFolderPathUnderParent };
}

/** @deprecated Prefer createFolderHelpersForUpload() per job to avoid cross-job cache bleed. */
export async function createUploadRootFolder(
  name: string,
  parentFolderId?: string,
): Promise<string> {
  return createFolderHelpersForUpload().createUploadRootFolder(
    name,
    parentFolderId,
  );
}

export async function ensureFolderPathUnderParent(
  relativeDir: string,
  parentFolderId: string,
): Promise<string> {
  return createFolderHelpersForUpload().ensureFolderPathUnderParent(
    relativeDir,
    parentFolderId,
  );
}
