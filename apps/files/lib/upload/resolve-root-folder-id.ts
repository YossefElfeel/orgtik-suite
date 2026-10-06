import { store } from "@/redux/app/store";
import { folderApi } from "@/redux/features/folder/folderApi";
import { normalizeUploadPath } from "./folder-upload-paths";

/**
 * Finds a folder by name under an optional parent.
 * Prefer not calling this on the hot upload path — use create + response id instead.
 */
export async function resolveRootFolderIdByName(
  name: string,
  parentFolderId?: string,
): Promise<string | undefined> {
  const normalizedName = normalizeUploadPath(name);

  try {
    if (parentFolderId) {
      const res = await store
        .dispatch(
          folderApi.endpoints.getFolderChildren.initiate(
            {
              id: parentFolderId,
              limit: 200,
            },
            { forceRefetch: true },
          ),
        )
        .unwrap();
      const items = res.data?.items ?? [];
      return items.find(
        (f) => normalizeUploadPath(f.name) === normalizedName,
      )?.id;
    }

    const res = await store
      .dispatch(
        folderApi.endpoints.getFolders.initiate(
          {
            parentId: null,
            limit: 200,
          },
          { forceRefetch: true },
        ),
      )
      .unwrap();
    const items = res.data?.items ?? [];
    return items.find(
      (f) => normalizeUploadPath(f.name) === normalizedName,
    )?.id;
  } catch {
    return undefined;
  }
}

export type ResolveRootFolderId = (
  name: string,
  parentFolderId?: string,
) => Promise<string | undefined>;
