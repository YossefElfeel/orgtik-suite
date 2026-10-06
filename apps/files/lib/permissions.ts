import type { ResourceCapabilities } from "@/types";

export type SessionAccess = {
  userId: string | number;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

type OwnedResource = {
  id?: string | number;
  ownerId?: string | number | null;
  owner?: { id?: string | number | null } | null;
  isSystemRoot?: boolean;
  capabilities?: ResourceCapabilities;
};

export function sameUserId(
  left: string | number | null | undefined,
  right: string | number | null | undefined,
): boolean {
  if (left === null || left === undefined) return false;
  if (right === null || right === undefined) return false;
  return String(left) === String(right);
}

function hasAdminAccess(session: SessionAccess): boolean {
  return session.isAdmin || session.isSuperAdmin;
}

function isOwnerOrAdmin(
  resource: OwnedResource,
  session: SessionAccess,
): boolean {
  if (hasAdminAccess(session)) return true;
  const ownerId = resource.ownerId ?? resource.owner?.id;
  return sameUserId(ownerId, session.userId);
}

type CapabilityFlag = Exclude<keyof ResourceCapabilities, "sharedRootId">;

/**
 * Prefer backend `capabilities`. When missing (staged rollout), allow only
 * owners/admins — deny-by-default for collaborators.
 */
function hasCapability(
  resource: OwnedResource,
  session: SessionAccess,
  flag: CapabilityFlag,
): boolean {
  if (resource.capabilities) {
    return Boolean(resource.capabilities[flag]);
  }
  return isOwnerOrAdmin(resource, session);
}

/** @deprecated Prefer capability-specific helpers. */
export function canManageFile(
  file: OwnedResource,
  session: SessionAccess,
): boolean {
  return hasCapability(file, session, "canWrite");
}

/** @deprecated Prefer capability-specific helpers. */
export function canManageFolder(
  folder: OwnedResource,
  session: SessionAccess,
): boolean {
  if (folder.isSystemRoot) return false;
  return hasCapability(folder, session, "canWrite");
}

export function canWriteResource(
  resource: OwnedResource,
  session: SessionAccess,
): boolean {
  if (resource.isSystemRoot) return false;
  return hasCapability(resource, session, "canWrite");
}

export function canMoveResource(
  resource: OwnedResource,
  session: SessionAccess,
): boolean {
  if (resource.isSystemRoot) return false;
  return hasCapability(resource, session, "canMove");
}

export function canArchiveResource(
  resource: OwnedResource,
  session: SessionAccess,
): boolean {
  if (resource.isSystemRoot) return false;
  return hasCapability(resource, session, "canArchive");
}

export function canManageAccess(
  resource: OwnedResource,
  session: SessionAccess,
): boolean {
  if (resource.isSystemRoot) return false;
  return hasCapability(resource, session, "canManageAccess");
}

export function canManageExternalShares(
  resource: OwnedResource,
  session: SessionAccess,
): boolean {
  if (resource.isSystemRoot) return false;
  return hasCapability(resource, session, "canManageExternalShares");
}

export function canUploadIntoFolder(
  folder: OwnedResource | null | undefined,
  session: SessionAccess,
): boolean {
  // No folder selected = system root upload destination.
  if (!folder) return true;
  if (folder.isSystemRoot) return true;
  return hasCapability(folder, session, "canWrite");
}

/** True when the source is under collaborative shared-folder access. */
export function isCollaboratorMoveSource(source: OwnedResource): boolean {
  return Boolean(source.capabilities?.sharedRootId);
}

/**
 * Collaborator move destinations must stay inside the same shared subtree.
 * Owners (no `sharedRootId`) should not use this filter.
 */
export function canUseMoveDestination(
  source: OwnedResource,
  destination: OwnedResource,
): boolean {
  const sourceRootId = source.capabilities?.sharedRootId;
  if (!sourceRootId) return false;

  if (String(destination.id) === String(sourceRootId)) return true;

  return (
    String(destination.capabilities?.sharedRootId) === String(sourceRootId)
  );
}
