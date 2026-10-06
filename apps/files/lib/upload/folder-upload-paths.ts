/** Normalize path separators for upload API (always forward slashes). */
export function normalizeUploadPath(path: string): string {
  return path.replace(/\\/g, "/");
}

/** Last segment of a path — used as multipart filename so the server relies on relativePaths. */
export function fileBasename(pathOrName: string): string {
  const path = normalizeUploadPath(pathOrName);
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

/**
 * When uploading a folder tree, browser paths look like `Root/sub/file.png`.
 * The API receives `folderName: Root` once; paths must be relative to that root.
 */
export function toPathsRelativeToRootFolder(
  paths: string[],
  rootFolderName: string | undefined,
): string[] {
  if (!rootFolderName) {
    return paths.map(normalizeUploadPath);
  }

  const root = normalizeUploadPath(rootFolderName);
  const prefix = `${root}/`;

  return paths.map((raw) => {
    const path = normalizeUploadPath(raw);
    if (path.startsWith(prefix)) {
      return path.slice(prefix.length);
    }
    if (path === root) {
      const segments = path.split("/");
      return segments[segments.length - 1] ?? path;
    }
    return path;
  });
}

/** Resolve folder id returned after the first batch of a folder upload. */
export function extractFolderIdFromUploadResponse(
  response: unknown,
  expectedRootName?: string,
): string | undefined {
  if (!response || typeof response !== "object") return undefined;

  const top = response as Record<string, unknown>;
  const data = top.data;

  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;

  if (typeof d.folderId === "string" && d.folderId.length > 0) {
    return d.folderId;
  }

  if (d.folder && typeof d.folder === "object") {
    const folder = d.folder as Record<string, unknown>;
    if (typeof folder.id === "string" && folder.id.length > 0) {
      if (
        !expectedRootName ||
        folder.name === expectedRootName ||
        normalizeUploadPath(String(folder.name)) ===
          normalizeUploadPath(expectedRootName)
      ) {
        return folder.id;
      }
    }
  }

  if (
    typeof d.id === "string" &&
    d.id.length > 0 &&
    (typeof d.name === "string" || d.type === "folder")
  ) {
    return d.id;
  }

  const fileLists = [d.files, d.items, d.uploadedFiles];
  for (const list of fileLists) {
    if (!Array.isArray(list) || list.length === 0) continue;
    for (const entry of list) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Record<string, unknown>;
      if (row.folder && typeof row.folder === "object") {
        const folder = row.folder as Record<string, unknown>;
        if (typeof folder.id === "string" && folder.id.length > 0) {
          if (
            !expectedRootName ||
            folder.name === expectedRootName ||
            normalizeUploadPath(String(folder.name)) ===
              normalizeUploadPath(expectedRootName)
          ) {
            return folder.id;
          }
        }
      }
    }
  }

  // Do not use uploaded file.folderId — that is the immediate parent (e.g. child-1),
  // not the tree root (ParentTest), which breaks chunked folder uploads.

  return undefined;
}
