/**
 * Upload UI & batching tunables — edit here when testing locally.
 *
 * | Constant | Effect |
 * |----------|--------|
 * | UPLOAD_CHUNK_SIZE | Max files per POST `/v1/files/upload` (2nd request starts at count + 1) |
 * | UPLOAD_PROGRESS_THROTTLE_MS | Min ms between in-flight progress UI updates |
 * | UPLOAD_CHUNK_MAX_RETRIES | Extra attempts per failed chunk (total = 1 + this value) |
 * | FILE_LIST_PAGE_SIZE | Files per page in upload dialog & background job details |
 * | UPLOAD_LARGE_SELECTION_THRESHOLD | Above this: wide dialog + “upload in background?” prompt |
 */

/** Files per upload request — keeps FormData and server payloads manageable. */
// export const UPLOAD_CHUNK_SIZE = 50;
const IS_DEV = process.env.NODE_ENV === 'development';
export const UPLOAD_CHUNK_SIZE = IS_DEV ? 5 : 50;

/** Min interval between progress-driven React updates during upload. */
export const UPLOAD_PROGRESS_THROTTLE_MS = 150;

/** Extra attempts after the first failure for a single chunk. */
export const UPLOAD_CHUNK_MAX_RETRIES = 2;

/** Max files shown per list page; previews are created only for the current page. */
export const FILE_LIST_PAGE_SIZE = 30;

/**
 * Selection count above this triggers:
 * - Desktop two-column upload dialog (file list sidebar)
 * - Background vs stay-in-dialog choice on Upload
 */
// export const UPLOAD_LARGE_SELECTION_THRESHOLD = 100;
export const UPLOAD_LARGE_SELECTION_THRESHOLD = IS_DEV ? 10 : 100;

export function countUploadChunks(fileCount: number): number {
  if (fileCount <= 0) return 0;
  return Math.ceil(fileCount / UPLOAD_CHUNK_SIZE);
}
