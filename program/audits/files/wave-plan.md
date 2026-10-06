# Files wave (Phase 3, pilot): plan and fix specs

This follows the wave template in `plan.md` (Phase 3). Gate A is the audit (`inventory.md` and `issues.csv`: 23 issues, 4 flows). VS-1 (branch `wave1/vs-1`) has already covered:
- the token bridge
- the SuiteShell (which removed FILES-001's hydration mismatch and FILES-009's nested sidebar links)
- the Files list on DataTable
- the folder pages
- Arabic (FILES-017)

This plan covers the rest, screen by screen, on the same branch.

**Starting point:**
- 53 files still import `@/components/ui/*`
- 63 files use lucide or iconify
- 7 files use `@orgtik/ui`

**Wave exit:** all four counts at zero (the old primitives removed, lucide and iconify gone), all 23 issues closed, the 4 flows green in en and ar, and vs1 clean on every route.

## Fix specs

Each spec gives: the problem → the decision → the library pieces → the acceptance check.

| Spec | Issues | Screen | Decision | Library | Accepted when |
|---|---|---|---|---|---|
| FS-FILES-1 | 005, 007, 008, 010 | Every screen | One set of controls: IconButton with a required label, Field around every control, SegmentedControl for Grid/List | IconButton, Field, SegmentedControl, Select | axe: 0 button-name, aria-allowed-attr, select-name or label on every route |
| FS-FILES-2 | 006, 016 | Every screen, share page | Text colours from tokens only (fg, fg-muted, fg-subtle); file-type colour moves to an icon tile, never small coloured text | tokens, Badge | axe color-contrast 0; share page's scroll region focusable |
| FS-FILES-3 | 018, 019, 020, 023 | Upload files dialog | An upload has **one** destination: the folder picker is a single Select (Combobox for many folders). The drop zone is the library's FileField (a real button, keyboard and screen reader). Errors say what failed, in the reader's language. | FileField, Combobox, Progress, toast | F1b becomes "pick one folder": upload succeeds; keyboard-only upload works; no raw keys |
| FS-FILES-4 | 021, 022 | Share dialog | The expiry is a date and time in the person's time zone (React Aria), stored as an instant: "7 days" means 7×24 h. Every field has its label. Revoke is a ConfirmDialog with its impact ("Anyone with this link loses access") and "Keep link" / "Revoke link". | DateTimePicker, Field, ConfirmDialog | F3 in Africa/Cairo: the expiry shown equals the one stored; the three "Close"s are gone |
| FS-FILES-5 | 002, 003 | Archived files and folder | An archived folder opens from the archive's own endpoint. Its breadcrumb comes from that answer. The back arrow goes to the parent (or Archived files), never browser history. | Breadcrumb, PageHeader | Open an archived folder from a new tab; back stays in the app; no 404 in the console |
| FS-FILES-6 | 011, 012 | Activity logs | On DataTable (server paging, URL state); the date range is the library's DateRangePicker with its own labels; the duplicate endpoint goes | DataTable, DateRangePicker | 0 console errors; keys present in 5 languages |
| FS-FILES-7 | 004, 015 | Auth pages | The not-allowed page offers a real next step (sign in again from the launcher). The hand-off page has a title and a language. | NoPermissionState, ErrorState | Opened directly, every button stays in the suite; axe document-title and html-has-lang 0 |
| FS-FILES-8 | 013, 014 | Greeting, catalogs | Morning / afternoon / evening. German follows the glossary (Inhaber*in → "Eigentümer", "Neu" → "Erstellen"). | glossary v0 | `glossary_check.py files` 0 rows |
| FS-FILES-9 | – | Every delete | Delete, permanent delete and "delete all" become ConfirmDialogs that say their impact: how many files, whether it can be undone, and whether it's shared. | ConfirmDialog | Every destructive confirm names what's lost |
| FS-FILES-10 | – | Dashboard home | Charts on `@orgtik/ui/charts` (storage by type as a DonutChart with a table view); folder cards and recent files on Card | charts, Card, Stat | vs1 clean on `/` in en/ar × light/dark |

## Order

1. **Dialogs, small ones first:** Create folder, Rename, Pin, Details, Mark as used, Restore, Move, then the three deletes (FS-FILES-9).
2. **Upload** (FS-FILES-3).
3. **Share** (FS-FILES-4).
4. **Archived files** (FS-FILES-5).
5. **Activity logs** (FS-FILES-6).
6. **Dashboard home** (FS-FILES-10).
7. **Public share page, auth pages** (FS-FILES-2 and FS-FILES-7).
8. **Every screen** (FS-FILES-1): the remaining controls, the greeting and the catalogs (FS-FILES-8).
9. **Cleanup:**
   - lucide and iconify go to Phosphor (the `icons-to-phosphor` map).
   - `components/ui/*` is removed.
   - The counts reach zero, then the flows run in en and ar and vs1 runs.

## Progress — done, 2026-10-01

Every step is in, on branch `wave1/vs-1` of `file-manager-dashboard-main` (not pushed):

| Step | Commit | What landed |
|---|---|---|
| 1. Dialogs | 2aa3932 | The overlay family on the library (Dialog, Menu, ConfirmDialog); every delete states its impact; Delete for good asks for the password |
| 2. Upload | 4c52b8c | One destination (Combobox); the drop zone is a real button; errors in the reader's language |
| 3. Share | 6464811 | DateTimePicker (expiry in the person's zone); labelled fields; "Keep link" / "Revoke link" |
| 4. Archived files | 9fedaad | DataTable with selection; the archived folder opens from its own endpoint; back stays in the app |
| 5. Activity logs | c8680a6 | Person filter, period picker, pagination, actions in the reader's language |
| 6. Dashboard home | 7ba21b3 | DonutChart with a table view, folder cards, recent files; 46 unused files removed |
| 7–9. Public share, auth pages, every screen, cleanup | ae89011, 2a6e6ad, 1b5d043 | See below |

Steps 7 to 9 in one pass:

- **Public share (FILES-016).** The page now carries the OrgTik mark and uses the library states. The password field is a PasswordInput inside a Field. Each file's download is its own button; before, it was a fake button inside the row's button. A failed download now says so. "Too many tries" offers a retry. The document pages scroll in a named region the keyboard can reach. Share links no longer carry a language, so the guest's browser picks it.
- **Auth and system pages (FS-FILES-7).**
  - No access: the hard-coded sign-in token is removed, and the page offers the way to the suite home.
  - Crash page and 404: both in every language, with a heading. The library's states gained `titleAs` (rc.5) for this.
  - The tab titles are now in the reader's language.
- **Folder page.**
  - Back goes to the parent in the path, and the page has a breadcrumb.
  - It has its own states for not found, no access and error. Before, it showed an empty English "All Files".
  - It shows the placeholder until it has mounted. The layout loads the same folder, so the folder could arrive in the cache before the page hydrated, which caused a hydration error.
- **Toasts.** The API's English messages are no longer shown. A translated registry (`lib/api-feedback.ts`) says what happened for each endpoint and maps errors by HTTP status. Screens that report their own results stay quiet, so nothing is said twice.
- **FS-FILES-8.**
  - The greeting covers morning, afternoon and evening.
  - Glossary terms: owner = Inhaber; create = Erstellen / Créer / Crea / إنشاء.
  - French "upload" is now *téléverser*; it used to read the same as "download".
  - `glossary_check.py`: 0 rows for Files.
- **Cleanup.**
  - Removed: `components/ui/*`, the shadcn token bridge, tw-animate, and 13 unused dependencies (lucide, iconify, framer-motion, sonner, radix-ui, next-themes, …).
  - In the source: 0 hex colours, 0 default-palette classes, 0 physical-direction classes. The only white and black are media surfaces: the camera viewfinder, video thumbnails and document paper.
  - The five catalogs have the same keys.

**Verification:**

- `node flows/files.mjs`: 26 of 26 in en.
- `node flows/files.mjs --locale ar`: 26 of 26. The flow now takes every control name and expected message from the app's catalog. Toasts are checked against the exact message.
- `vs1.mjs` (5 languages × 2 themes × 2 widths): 20 of 20 clean on `/`, `/my-files`, a nested folder, `/archived-files`, `/activity-logs` and `/auth/not-allowed`.
- On the 404, the missing folder and an invalid share link: 0 axe issues, 0 overflow and no leftover English. The only console entries are the expected 404 responses.
- `issues.csv`: all 23 issues fixed.
