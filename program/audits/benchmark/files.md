# Files: feature benchmark against Google Drive and Dropbox

Scope: file storage and sharing for a small team. Read on 2026-10-07 from the code (`apps/files`) and the mock (`mock/apps/files.js`, `mock/apps/files/*`), with the audit records in `program/audits/files/`. Paths without a prefix are under `apps/files/`. "Mock" means `mock/apps/files.js`, which is the contract the app is built against. The references (Drive, Dropbox) are described from their public feature sets, in our own words.

**Summary**
- **Expected, missing: 9.** The biggest are version history, comments, notify-on-share, storage quotas, and attaching Files items in Tasks and Chats.
- **Expected, partial: 8.** These are permission levels, bulk actions, the broader search, Office preview beyond Word, "shared with me", starred files, recent files, and per-item history.
- **Differentiators: 7 rated.** Two have already shipped: the external-link controls and "Mark as used". Three are worth adding: HR documents in Files, file requests, and link insights.

Ratings: **Expected** means a small team assumes it is there. **Differentiator** means it would set us apart or fits the suite. **Not for us** means it is out of scope for this product. Sizes: **S** is up to a few days, **M** is about 1 to 2 weeks, **L** is more than 2 weeks or needs other apps.

## Checklist

| # | Feature | Area | Rating | OrgTik today | Evidence | Gap & size |
|---|---|---|---|---|---|---|
| 1 | Nested folders: create, rename, move | Folders | Expected | Have | Mock `POST /api/v1/folders`, `PATCH /folders/:id`, `PATCH /folders/:id/move` (blocks moving into its own subtree); routes `/my-files`, `/my-files/*path` | |
| 2 | Move files between folders | Folders | Expected | Have | Mock `PATCH /api/v1/files/:id/move`; `components/dialogs/MoveFolderDialog` | |
| 3 | Drag and drop to move items between folders | Folders | Expected | Missing | Drag-and-drop only handles uploads (`components/layout/GlobalDropZone`). No draggable cards or rows in `components/shared/FileCard` or `components/pages/dashboard/FilesTable` | Drag a file or folder onto a folder or breadcrumb to move it, using the existing move endpoints. **M** |
| 4 | Select several items and act on them (move, download, archive) | Folders | Expected | Partial | Selection and bulk restore/delete exist only in the archive (`components/pages/archived-files/ArchivedTable` `selectable`). The mock already has bulk `DELETE /api/v1/files {ids}`, but the active files table has no selection | Add selection to the files table and folder grid, with bulk move, archive and download as a ZIP. **M** |
| 5 | Grid and list views | Folders | Expected | Have | `components/pages/dashboard/FilesTable/index.tsx` (`View = "list" \| "grid"`) | |
| 6 | Sort by name, date or size | Folders | Expected | Missing | Every column is `enableSorting: false` (`FilesTable/columns.tsx`). The mock only sorts newest first (`byNewest`) | Add sortable columns plus a sort parameter on `GET /files` and `/folders`. **S** |
| 7 | Upload with progress, retries, cancel and a background panel | Upload | Expected | Have | `providers/background-upload-provider.tsx` (`cancelUpload`), `lib/upload/execute-upload-plan.ts` (chunk retries), `components/layout/BackgroundUploadPanel` | |
| 8 | Upload whole folders with their structure; drop anywhere | Upload | Expected | Have | `lib/upload/folder-upload-paths.ts`, `lib/drag-drop-extract.ts`, the mock `handleUpload` `relativePaths` → `ensureChild`, and `GlobalDropZone` in the dashboard layout. Flow F1 passes (`program/tools/audit-kit/flows/files.mjs`) | |
| 9 | Name clash on upload: keep both or replace | Upload | Expected | Missing | Mock `handleUpload` creates a new file without checking names (folders do check, using `nameTaken`) | Detect a clash and offer "keep both (renamed)" or "replace". Replace needs #13. **S** |
| 10 | File requests: people outside the company upload into a folder through a link | Upload | Differentiator | Missing | Links are read and download only (mock `POST /api/v1/shares`: `permission` is `view_only` or `download`) | Add an upload-only link type for a folder, with expiry and a size cap. Useful for client deliverables and HR applicants. **M** |
| 11 | Preview in the browser: images, video, PDF, Office | Preview | Expected | Partial | `components/shared/FilePreview` covers images (with arrow-key gallery), video and PDF. Streamed video in public shares (`hls_video` in the mock). `components/shared/ProtectedOfficePreview` renders only `.docx` inline (`canRenderInline = extension === "docx"`) | Preview spreadsheets and slides (xlsx, pptx), for example as rendered pages like the public share's `pages` preview. **M** |
| 12 | Edit and co-author documents online | Preview | Not for us | Missing | None | |
| 13 | Version history: upload a new version and restore an older one | Versioning | Expected | Missing | `fileOut` in the mock has no versions. Each upload is a new file id. There is no "upload new version" in `components/shared/FileDropdownMenu` | Store versions per file, add "upload new version" that keeps links and shares, and add a history list with restore. **L** |
| 14 | Trash (Archive) with restore, including whole folder trees | Trash | Expected | Have | Mock `/api/v1/archive/*` (`archiveFolderTree`, `restoreFolderTree`); routes `/archived-files`, `/archived-files/*path`; flow F2 passes | |
| 15 | Delete permanently or empty the trash, with a password check | Trash | Expected | Have | Mock `DELETE /archive/files`, `/archive/folders/all` (`checkPassword`); `components/dialogs/PermanentDeleteDialog`, `DeleteAll` | |
| 16 | Purge the trash automatically after a retention period | Trash | Expected | Missing | The mock has no retention timer. Archived items stay until someone deletes them | Add a workspace retention setting (for example 30 days), a job that purges after it, and "deleted in N days" in the archive. **M** |
| 17 | Search by name and filter lists | Search | Expected | Have | `FilesTable` search box, folder filter and used-status filter; mock `GET /api/v1/files?search&isUsed&folderId`, `GET /folders?search` | |
| 18 | One search across all files and folders, with filters for type, owner and date | Search | Expected | Partial | Search is per list: files table and folder list. The mock has no type, owner or date filter on `GET /files` | Add one search in the header with results grouped by folders and files, plus type, owner and modified-date filters. **M** |
| 19 | Search inside documents, including text in scans (OCR) | Search | Differentiator | Missing | Mock search matches only `name` and `originalName` (`util.search`) | Index document text server-side. **L** |
| 20 | Internal access: only me, everyone, or specific people, inherited by subfolders | Sharing | Expected | Have | Mock `normVisibility`, `applyAccess` (subtree), `PATCH /folders/:id`, `PUT /files/:id/access`; `components/shared/VisibilitySelectionField` | |
| 21 | Access level per person (view, comment or edit) | Sharing | Expected | Partial | No level can be chosen. Folder collaborators always get write and move (mock `caps`: collab → `canWrite: true`), and a file-level grant is always read-only (`reader`) | Add viewer or editor per grant on folders and files, shown in the share dialog. **M** |
| 22 | External links: view only or allow download | Sharing | Expected | Have | Mock `POST /api/v1/shares` `permission`; `components/dialogs/ShareFileDialog`; route `/share/:shareId`; flow F3 passes | |
| 23 | Password on a link, with limits on wrong attempts | Sharing | Expected | Have | Mock `passwordHash`, `POST /public/shares/:id/session` (8 failures per 10 min → 429); `components/public-share/PublicSharePasswordForm.tsx` | |
| 24 | Expiry date on a link | Sharing | Expected | Have | Mock: 7-day default, at most 1 year; expiry picker in `ShareFileDialog` (issue FILES-021 fixed) | |
| 25 | Download cap, regenerate link, revoke, several labelled links per item | Sharing | Differentiator | Have | Mock `maxDownloads`, `POST /shares/:id/rotate`, `DELETE /shares/:id`, `label`; `ShareFileDialog` | |
| 26 | Link insights: opens, downloads, last opened | Sharing | Differentiator | Partial | The mock stores `downloadCount` and `lastAccessedAt` (`shareOut`). The dialog shows downloads only when a cap is set (`ShareFileDialog` `downloadsUsed`). Opens are not counted | Show last opened and downloads on every link, and add an open count. **S** |
| 27 | Notify people when something is shared with them | Sharing | Expected | Missing | Granting access in the mock changes `allowedUserIds` only. There is no notification or email | Send an in-app notification (suite bell) and an optional email with a message. **M** |
| 28 | "Shared with me" view | Sharing | Expected | Partial | The mock supports `filter=shared_with_me` (`GET /api/v1/files`), and `redux/features/file/fileApi.ts` types it, but no screen uses it | Add a "Shared with me" list or tab. **S** |
| 29 | Star or pin items for quick access | Starred | Expected | Partial | Folders only: `POST/DELETE /folders/:id/pin`, pinned on the dashboard (`components/pages/dashboard/Chart/pinnedFolders.tsx`). Files can't be starred | Let files be pinned and add a "Starred" list. **S** |
| 30 | Recent files: what I opened or changed | Recent | Expected | Partial | The dashboard's `recentAddedFiles` (mock `GET /files/dashboard-overview`) shows the 8 newest files anyone added, not the ones I used | Track opens and edits per user and add "Recent" for me. **S** |
| 31 | Storage used, broken down by type | Storage | Expected | Have | Mock `dashboard-overview` `grouped[].totalStorage`; donut on the dashboard (`components/pages/dashboard/Chart/chart-pie.tsx`) | |
| 32 | Storage quota for the workspace or plan, with warnings | Storage | Expected | Missing | No quota or limit in the mock or the app | Add a plan quota from the platform, used-of-total on the dashboard, warnings at 80% and 100%, and uploads blocked over quota. **M** |
| 33 | Activity log for the workspace, filtered by person and date | Activity | Expected | Have | Route `/activity-logs`; mock `GET /api/v1/activity-logs?actorId&from&to` (visibility-filtered) | |
| 34 | Details and history panel for one item | Activity | Expected | Partial | `components/dialogs/DetailsDialog` shows type, size, created and owner. There is no per-item activity, last modified, or who has access | Add a side panel with properties, who has access, and that item's activity (filter the existing log by entity). **S** |
| 35 | Comments on files | Collaboration | Expected | Missing | No comment model in the mock or the app | Add threaded comments with mentions on a file, linked to the suite's notifications. **M** |
| 36 | "Mark as used" with a note on where the file was used | Collaboration | Differentiator | Have | Mock `PATCH /api/v1/files/:id/used` (note required); `components/dialogs/MarkAsUsedDialog`; used/unused filters in the list and the archive | |
| 37 | Download a folder as a ZIP | Download | Expected | Have | Mock `GET /folders/:id/download` (`zipFolder`, permission-filtered); public `GET /public/shares/:id/download` | |
| 38 | Desktop sync client and offline files | Offline | Not for us | Missing | None | |
| 39 | Works on a phone in the browser | Mobile | Expected | Have | `program/audits/files/vs1/vs1.md`: 390px in 5 languages × 2 themes, no overflow, axe 0/0 | |
| 40 | Native mobile app with camera or scan upload | Mobile | Not for us | Missing | None | |
| 41 | Attach a Files item in Tasks and Chats as a link, not a copy | Suite | Expected | Missing | Tasks keeps its own attachments (`mock/apps/tasks.js` `saveFiles`, `attachmentOut`). Chats has no API (`mock/apps/chats.js`). No app has a Files picker | Add a shared "pick from Files" dialog plus a reference type (file id, with permission checks), and "Save to Files" from a task attachment. **L** |
| 42 | HR documents in Files: a folder per employee with HR-only access | Suite | Differentiator | Missing | HR serves its own generated documents (`mock/apps/hr/routes/files.js`). No link to Files | Add system folders per employee, created by HR, with access tied to HR roles. **L** |
| 43 | 5 languages including Arabic RTL; screen reader and keyboard friendly | Accessibility | Expected | Have | `i18n/routing.ts` (en, ar, de, fr, it), `messages/ar.json`; all 23 audit issues fixed (`program/audits/files/issues.csv`); vs1 axe 0/0 | |
| 44 | Keyboard shortcuts (upload, new folder, search, rename) | Accessibility | Differentiator | Missing | Only the preview's arrow keys (`components/shared/FilePreview`) | Add a small shortcut set and a "?" help sheet. **S** |

## Top 8 to add (by value)

1. **Attach from Files in Tasks and Chats (#41, L).** This is the suite's main argument against standalone Drive or Dropbox, and right now each app keeps its own copies.
2. **Version history and "upload new version" (#13, L, with #9, S).** This is the biggest missing basic. It also fixes silent duplicates on upload and keeps shared links working when a file changes.
3. **Notify on share (#27, M).** Without it, sharing goes unnoticed. It uses the suite's notifications.
4. **Access level per person (#21, M).** Today every folder collaborator can edit and move. Teams need view-only for internal shares too.
5. **Storage quota with warnings (#32, M).** Needed to sell plans, and the dashboard already shows usage.
6. **Bulk selection and drag-and-drop move (#4, #3, M).** Day-to-day speed. The bulk endpoint already exists.
7. **Comments on files (#35, M).** Review and approval of assets without leaving Files.
8. **One search with filters, plus sorting (#18, M, with #6, S).** Finding things gets harder as a team's files grow.

Next in line: trash retention (#16), HR documents in Files (#42), file requests (#10), and Office preview beyond Word (#11).


## A26 presentation overlay — 2026-10-08

PR25 Files scene accepted: permissions/versions/comments/quota/moves/search UI; existing authorized references retained. Existing benchmark scores and backend claims above remain historical. See the maintained release register and prototype guide; this overlay does not accept all72 or all15 journeys.
