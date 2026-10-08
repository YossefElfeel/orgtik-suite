# Files presentation increment

Presentation-only route: `/{locale}/presentation`, exposed in development or with `NEXT_PUBLIC_DEMO_PANEL=1`. Existing My Files, stored references, protected version records and saved whiteboards are reused through their existing surfaces and remain unchanged.

The isolated client dataset demonstrates packaged sample creation, version history and downloads, rename clashes with Keep both, duplicate, per-person view/comment/edit previews, simulated sharing notification, quota blocking, bulk selection, collision-safe move, drag move, comments, local search/type/folder filters and sorting. Workspace selection changes synthetic fixtures; persona selection changes author attribution and the demonstrated controls. These are presentation states, not authentication or access enforcement. Browser reload or Reset demo files restores samples without changing existing workspaces or the shared clock.

All five catalogs are translated. The shared Demo Panel supplies loading/empty/error/no-access/read-only/success scenes. Packaged sample metadata units illustrate quota; they do not measure production storage. Notifications are an on-screen simulated receipt, with no email sent. New revisions use packaged content; arbitrary uploads remain deferred. The board sample is downloadable structured data; existing saved drawing and version surfaces remain the working board implementation.

Validation: Files typecheck (including a non-incremental run), five catalog checks and production build pass. The bounded walkthrough in `flow.cjs` verifies the visible operations and captures EN/AR × light/dark × desktop/mobile. The report records exact check/capture counts, zero critical axe findings and horizontal overflow checks. Initial local build failures were stale optional-peer links and TypeScript cache in this existing checkout; only ignored dependency links/cache were corrected. No dependency manifest, shared UI, frozen backend or provider configuration changed.

Independent review corrected inconsistent simulated persona capabilities and stale same-file reset drafts. The corrected flow passes 38 bounded checks with eight captures; the separately confirmed original-record reset contributes three checks, giving 41 scoped checks in the report. These are overlapping screen assertions, not 41 journeys. The executable flow now includes those three same-file checks. The owner preview (current/Nour/Mona) explicitly retains full actions; other personas use the selected file's saved permission or View only, consistently across edits, comments, drag and bulk move.

Remaining: real server persistence for these new metadata operations, physical storage accounting, external sharing delivery and generic binary upload. Existing cross-app references and whiteboard evidence stay in their earlier packages; this walkthrough does not claim all 15 journeys or hosted acceptance.

## Presenter path and implementation seams

Start `pnpm demo files`, sign into the isolated SOS seed as Nour, and use the Files handoff. Choose Presentation flow from Files navigation. Open the brand board, Duplicate, enter its original name, and use Keep both. Add a comment, Save access with notification enabled, add a packaged revision and download it. Switch Quota scenario to At capacity to show the recovery message. Search for the brand board, select matching rows and move them to People. Drag the brief to a folder as the pointer equivalent. Demo controls → Rana demonstrates comment-only controls; workspace selection swaps synthetic samples. The header identifies the scene separately from the signed-in account.

| Commitment | Current presentation behavior | Remaining real behavior |
| --- | --- | --- |
| Files 1: Attach in Tasks/Chats | Reuse existing picker/reference package; not rebuilt here | Existing package acceptance boundaries remain |
| Files 2: Versions and name clash | Packaged revision history/download, rename collision, Keep both | Persist new generic revisions; binary upload |
| Files 3: Notify on share | Visible simulated receipt identifies recipient | Provider delivery and delivery status |
| Files 4: Per-person access | View/comment/edit selections, persona-specific controls, revoke preview | Persist ACL changes and enforce them server-side |
| Files 5: Storage quota | Illustrative units and blocked additions | Account actual bytes and evaluate shared limits |
| Files 6: Bulk select and drag move | Multi-select, folder move, drag, collision-safe copies | Persist moves and operation concurrency |
| Files 7: Comments | Persona-attributed client comments | Persist comments and notifications |
| Files 8: Search, filters and sort | Local name search, folder/type filter and name/size sorting | Permission-filtered suite search |

The client seam is `PresentationFile`: `{id, name, kind, folder, size, versions: [{id, name, date}], shares: [{person, permission}], comments: [{id, person, text}]}`. `permission` is `view | comment | edit`. These are illustrative client shapes and create no new server route or contract. Reset affects this dataset only. The real implementation should carry workspace/file/member identifiers and version concurrency through the existing API contracts.
