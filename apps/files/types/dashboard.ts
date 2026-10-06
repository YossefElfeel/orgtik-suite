import { IFile } from "./file";
import { IFolderOwner } from "./user";

export interface IDashboardGrouped {
  key: "documents" | "images" | "videos" | "other";
  totalFiles: number;
  totalStorage: number;
  lastFileUpdatedAt: string | null;
}

export interface IDashboardActivity {
  id: string;
  scope: string;
  actorId: string;
  action: "uploaded" | "created" | "deleted" | "moved" | "renamed";
  entityType: "file" | "folder";
  entityId: string | null;
  metadata: {
    name?: string;
    ids?: string[];
    count?: number;
    size?: number;
    path?: string;
    depth?: number;
    parentId?: string | null;
    visibility?: string;
    inheritedAccess?: boolean;
    folderId?: string;
    mimeType?: string;
  };
  ip: string;
  userAgent: string;
  createdAt: string;
  actor?: IFolderOwner;
}

export interface IDashboardOverviewData {
  grouped: IDashboardGrouped[];
  recentAddedFiles: IFile[];
  myLastActivity: IDashboardActivity[];
}
