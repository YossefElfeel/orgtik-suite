export type SharePermission = "view_only" | "download";
export type ShareStatus = "active" | "expired" | "revoked";
export type ShareResourceType = "file" | "folder";

export interface ShareSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface SharePolicy {
  id: string;
  ownerId: string;
  resourceType: ShareResourceType;
  resourceId: string;
  label: string | null;
  permission: SharePermission;
  hasPassword: boolean;
  expiresAt: string;
  revokedAt: string | null;
  maxDownloads: number | null;
  downloadCount: number;
  version: number;
  lastAccessedAt: string | null;
  createdAt: string;
  status: ShareStatus;
  /** Present only on create/rotate responses. */
  shareUrl?: string;
}

export interface CreateSharePayload {
  resourceType: ShareResourceType;
  resourceId: string;
  label?: string;
  permission?: SharePermission;
  expiresAt?: string;
  password?: string;
  maxDownloads?: number;
}

export interface ListSharesQuery {
  resourceType: ShareResourceType;
  resourceId: string;
}

export interface ShareCapabilities {
  canPreview: boolean;
  canDownload: boolean;
}

export interface PublicShareFile {
  type: "file";
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  previewStatus?: string;
}

export interface PublicShareFolder {
  type: "folder";
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicShareResource = PublicShareFile | PublicShareFolder;

export interface PublicShareMetadata {
  purpose?: "upload_request";
  label?: string | null;
  request?: { samples: { id: string; name: string; size: number; mimeType: string }[]; maxSubmissions: number; submissionCount: number; canSubmit: boolean };
  shareId: string;
  permission: SharePermission;
  expiresAt: string;
  resource: PublicShareResource;
  capabilities: ShareCapabilities;
}

export interface PublicShareItemsResponse {
  parent: PublicShareFolder;
  rootId: string;
  items: Array<PublicShareFolder | PublicShareFile>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PublicShareItemsQuery {
  shareId: string;
  parentFolderId?: string;
  page?: number;
  limit?: number;
}

export type PreviewKind = "image" | "pages" | "hls_video" | "hls_audio";

export interface PreviewAsset {
  key: string;
  mimeType: string;
  size: number;
}

export type PreviewManifest =
  | { status: "pending" | "processing" }
  | { status: "unsupported" | "failed" }
  | {
      status: "ready";
      kind: PreviewKind;
      pageCount?: number;
      entryKey?: string;
      assets?: PreviewAsset[];
    };

export interface CreateShareSessionPayload {
  shareId: string;
  secret: string;
  password?: string;
}
