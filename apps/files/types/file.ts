import { ResourceCapabilities } from "./capabilities";
import { IFolder } from "./folder";
import { IFolderOwner, VisibilityType } from "./user";

export interface IFile {
  id: string;
  name: string;
  displayName?: string;
  originalName?: string;
  ownerId?: string;
  size: string | number;
  mimeType: string;
  /** Protected authenticated download URL from the API (not a public /uploads path). */
  url?: string;
  /** Same protected endpoint as `url` (backward compatible). */
  path?: string;
  /**
   * May mirror the protected download URL for backward compatibility.
   * Do not treat as a public asset path.
   */
  relativePath: string;
  depth?: number;
  isUsed: boolean;
  usedNote?: string | null;
  usedAt?: string | null;
  usedBy?: string | null;
  folderId?: string | null;
  folder?: IFolder;
  visibility?: VisibilityType;
  allowedUserIds?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  owner?: IFolderOwner | null;
  /** Optional during staged rollout; deny write actions for non-owners when missing. */
  capabilities?: ResourceCapabilities;
}

export interface IFileUploadPayload {
  files?: File[];
  folderId?: string;
  displayName?: string;
  folderName?: string;
  relativePaths?: string[];
  onUploadProgress?: (progress: { loaded: number; total?: number }) => void;
  signal?: AbortSignal;
  /** When true, skip RTK tag invalidation (used for chunked uploads; invalidate once at the end). */
  skipInvalidation?: boolean;
}

export interface IFilesQuery {
  page?: number;
  limit?: number;
  search?: string;
  filter?: "all" | "my_files" | "shared_with_me";
  folderId?: string | null;
  includeDescendants?: boolean;
}

export interface IMoveFilePayload {
  id: string;
  /** Omit to move to the system root. */
  targetFolderId?: string;
}

export interface IUpdateFileUsedPayload {
  id: string;
  isUsed: boolean;
  /** Required when `isUsed` is true (max 1000 chars). */
  note?: string;
}

/** File rename/update — do not send visibility/access fields here. */
export interface IUpdateFilePayload {
  id: string;
  name?: string;
  note?: string;
}

export interface IUpdateFileAccessPayload {
  id: string;
  access: string;
  allowedUserIds?: string[];
}
