/**
 * Resolve the canonical protected download URL for a file.
 * Prefer `url`, then `path`. Never use storage-relative paths as public assets.
 */
export function getProtectedFileUrl(file: {
  url?: string | null;
  path?: string | null;
}): string | null {
  return file.url || file.path || null;
}
