import { ResourceCapabilities } from "./capabilities";
import { IFolderOwner, VisibilityType } from "./user";

export { type VisibilityType };

/** Alias matching the backend folder visibility contract. */
export type FolderVisibility = VisibilityType;

export interface ICreateFolderPayload {
  name: string;
  visibility?: VisibilityType;
  allowedUserIds?: string[];
  parentId?: string;
  /** When true, skip RTK tag invalidation (folder tree setup during chunked upload). */
  skipInvalidation?: boolean;
}

export interface IFolder {
  id: string;
  name: string;
  ownerId?: string;
  visibility: FolderVisibility;
  parentId?: string | null;
  path?: string;
  depth?: number;
  isSystemArchive?: boolean;
  isSystemRoot?: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  owner?: IFolderOwner | null;
  /** Populated for the folder owner; empty for normal readers. */
  accessUsers?: {
    id: string;
    avatar: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    isActive: boolean;
  }[];
  url?: string;
  /** Optional during staged rollout; deny write actions for non-owners when missing. */
  capabilities?: ResourceCapabilities;
}

export interface IFolderPinned {
  id: string;
  name: string;
  ownerId: string;
  parentId: string | null;
  path: string;
  depth: number;
  isSystemArchive: boolean;
  isSystemRoot: boolean;
  visibility: VisibilityType;
  accessGrants: any[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  owner: IFolderOwner;
  accessUsers: any[];
  isPinned: boolean;
  capabilities?: ResourceCapabilities;
}

export interface IFoldersQuery {
  page?: number;
  limit?: number;
  search?: string;
  visibility?: VisibilityType;
  parentId?: string | null;
  includeDescendants?: boolean;
  fileUsage?: "all" | "used" | "non_used";
}

export interface IUpdateFolderPayload {
  id: string;
  name?: string;
  visibility?: VisibilityType;
  allowedUserIds?: string[];
}

export interface IMoveFolderPayload {
  id: string;
  /** Omit to move to the system root. */
  targetParentId?: string;
  name?: string;
}

export interface IUpdateFolderAccessPayload {
  id: string;
  visibility: VisibilityType;
  allowedUserIds?: string[];
}

export { type IFolderOwner };
