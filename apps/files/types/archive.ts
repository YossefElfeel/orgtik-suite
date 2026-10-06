import { IFile } from "./file";
import {  IFolderOwner, VisibilityType } from "./folder";
import { IPaginatedResponse } from "./api";

export interface IArchiveQuery {
  page?: number;
  limit?: number;
  fileUsage?: "all" | "used" | "non_used";
}

export interface IFolderArchive {
  id: string;
  name: string;
  ownerId: string | number;
  parentId: string | null;
  path: string;
  depth: number;
  isSystemArchive: boolean;
  isSystemRoot: boolean;
  visibility: VisibilityType;
  accessGrants: IAccessGrant[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  owner: IFolderOwner;
  accessUsers: IFolderOwner[];
  isPinned: boolean;
  parentName?: string;
}

export interface IAccessGrant {
  id: string;
  folderId: string;
  userId: string | number;
  grantedBy: string | number;
  createdAt: string;
}

export interface IFileAndFolderResponse {
  success: boolean;
  message: string;
  data: {
    /** The folder itself, when these are an archived folder's contents. */
    folder?: IFolderArchive & { parentId?: string | null; parentName?: string | null };
    folders: IPaginatedResponse<IFolderArchive>;
    files: IPaginatedResponse<IFile>;
  };
}
