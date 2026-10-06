/** Backend-provided permission flags for active files and folders. */
export interface ResourceCapabilities {
  canWrite: boolean;
  canMove: boolean;
  canArchive: boolean;
  canManageAccess: boolean;
  canManageExternalShares: boolean;
  /** Shared-folder subtree root; null when not under collaborative access. */
  sharedRootId: string | null;
}
