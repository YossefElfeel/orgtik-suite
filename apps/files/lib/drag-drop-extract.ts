/**
 * Classifies drag-and-drop payloads using the FileSystem API (webkitGetAsEntry).
 * - `dropKind: "files"` — only regular files at the top level.
 * - `dropKind: "folders"` — at least one directory (folder tree preserved via relative paths).
 */

export type DropKind = "files" | "folders";

export type DroppedFileItem = { file: File; relativePath: string };

export type ExtractDropResult = {
  items: DroppedFileItem[];
  dropKind: DropKind;
};

async function readDirectoryEntries(
  dirEntry: FileSystemDirectoryEntry,
  pathPrefix = "",
): Promise<DroppedFileItem[]> {
  return new Promise((resolve) => {
    const results: DroppedFileItem[] = [];
    const reader = dirEntry.createReader();

    const readBatch = () => {
      reader.readEntries(async (entries) => {
        if (!entries.length) {
          resolve(results);
          return;
        }

        for (const entry of entries) {
          const entryPath = pathPrefix
            ? `${pathPrefix}/${entry.name}`
            : entry.name;

          if (entry.isFile) {
            await new Promise<void>((res) => {
              (entry as FileSystemFileEntry).file((f) => {
                results.push({ file: f, relativePath: entryPath });
                res();
              });
            });
          } else if (entry.isDirectory) {
            const sub = await readDirectoryEntries(
              entry as FileSystemDirectoryEntry,
              entryPath,
            );
            results.push(...sub);
          }
        }

        readBatch();
      });
    };

    readBatch();
  });
}

/**
 * Reads all files from a DataTransfer, detects whether the drop was file-only or included folder(s),
 * and returns flattened file list with relative paths for folder trees.
 */
export async function extractDataTransferItems(
  dataTransfer: DataTransfer,
): Promise<ExtractDropResult> {
  // 1. استخراج الـ Entries فوراً قبل أن يفقد المتصفح الوصول للبيانات
  const entries = Array.from(dataTransfer.items)
    .map((item) => item.webkitGetAsEntry?.())
    .filter((entry): entry is FileSystemEntry => entry !== null);

  let anyDirectory = false;

  // 2. معالجة كل الـ entries بالتوازي باستخدام Promise.all
  const results = await Promise.all(
    entries.map(async (entry) => {
      const items: DroppedFileItem[] = [];

      if (entry.isDirectory) {
        anyDirectory = true;
        const sub = await readDirectoryEntries(
          entry as FileSystemDirectoryEntry,
          entry.name,
        );
        items.push(...sub);
      } else if (entry.isFile) {
        const file = await new Promise<File>((resolve) => {
          (entry as FileSystemFileEntry).file(resolve);
        });
        items.push({
          file,
          relativePath: entry.fullPath?.startsWith("/")
            ? entry.fullPath.slice(1)
            : entry.name,
        });
      }
      return items;
    }),
  );

  // 3. دمج كل المصفوفات الفرعية في مصفوفة واحدة
  const allResults = results.flat();

  return {
    items: allResults,
    dropKind: anyDirectory ? "folders" : "files",
  };
}

/**
 * Peek during dragover (Chromium): classify without reading file contents.
 * Returns null if entries are not available yet.
 */
export function peekDropKindFromDataTransfer(
  dataTransfer: DataTransfer | null,
): DropKind | null {
  if (!dataTransfer?.items?.length) return null;

  let anyDirectory = false;
  let anyFile = false;

  for (const item of Array.from(dataTransfer.items)) {
    const entry = item.webkitGetAsEntry?.();
    if (!entry) continue;
    if (entry.isDirectory) anyDirectory = true;
    if (entry.isFile) anyFile = true;
  }

  if (!anyDirectory && !anyFile) return null;
  return anyDirectory ? "folders" : "files";
}
