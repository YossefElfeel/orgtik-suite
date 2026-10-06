# Tasks wave plan (wave 3: Tasks)

Gate A, 2026-10-01. Runs in its own session, in parallel with SOS (D-043). Inputs:
- three code reads: the board and a single task; the other views and home; the shell, permissions, teams and languages
- the baseline sweep and dead-end run (2026-09-30)
- the VS-1 baseline (`vs1/vs1-tasks-before-*`): 0 of 20 clean renders on every route checked. Every signed-in route has a hydration error. Arabic, French and Italian don't exist. The board alone has 33 critical and 26 serious axe hits.

The issue log is [issues.csv](issues.csv): 69 issues — 15 S1, 44 S2, 10 S3.

**Starting point:**

| Count | Today |
|---|---|
| Files importing `@/components/ui/*` | 270 import lines, 28 primitives |
| Files using lucide or iconify | 95 + 2 |
| Physical direction classes | 167 (17 logical) |
| Raw hex / palette classes | 54 / 822 |
| Hard-coded English strings | ~318 in 72 files |
| Locales | en, de (522 keys each) |

**Wave exit:**
- All five counts are at zero, and the catalogs are at parity in en, ar, de, fr and it.
- All 69 issues are closed.
- The golden flows are green in en and ar.
- vs1 is clean on every route.

## What this wave is, and isn't

- **Is:** every Tasks screen moves to `@orgtik/ui`, in five languages and both themes. It also covers:
  - the suite shell, as Files and SOS have it
  - SOS's one-time-code hand-off (D-017, accepted)
  - permissions from the `task_manager` scope, with in-app no-permission and read-only states
  - two library components the app can't do without: **Board** and **CalendarGrid** (below)
- **Isn't:**
  - New features the spec doesn't ask for.
  - Chat inside Tasks: the routes don't exist, and Chats (HQ) owns chat.
  - People and Profile: those routes don't exist either; SOS owns them.
  - The keys under `PeoplesPage`, `Profile`, `Chat`, `InvitePeopleDialog` and `EditUserRoleDialog` are dead and go in cleanup.
- **Decisions this plan takes as defaults** (changeable at Gate D):
  - **The project-status workflow editor** (TASKS-044) does nothing today. It is removed rather than built: a project's status is one Select with the status matrix's labels. Custom workflows would be a spec item, and none asks for one.
  - **Notifications "Delete all"** (TASKS-059) only marks things read. It becomes "Mark all as read", and nothing is deleted.
  - **Due dates are date-only** (TASKS-052), as the status matrix and the spec's tasks treat them. A task is due on a calendar day in the organisation's time zone, not at an instant. The mock already stores the day; the app stops converting it.
- **Backend contracts** this wave proposes (the mock implements them; the real API decides):
  - `POST /tasks/:id/move` takes `{sectionId, beforeId?, afterId?}`. These are absolute neighbours, so a move made in a filtered view can't renumber cards the person can't see (TASKS-035).
  - a board event on the socket (`board:changed {projectId, taskId}`), so another person's move appears (TASKS-017)
  - `GET /tasks/:id` answers 404 for a missing task and 403 for one the person can't see, so the deep link can show the right state (TASKS-033)

## Library requests

These go to the session that releases `@orgtik/ui`. This session builds them on a branch of `orgtik-ui`, and the release goes through that session.

### Board

A Kanban board. HR and Sales pipelines will need it too.

**Data**
- Columns and items are controlled; each item has `columnId` and `order`.
- `onMove({ itemId, toColumn, beforeId, afterId })` returns a Promise. The board moves the card at once, puts it back by itself if the Promise rejects, and the app's toast says why.
- `canDrag` and `canDrop` cover permissions; read-only shows a lock and no grab cursor.

**Moving**
- Pointer and touch (long press).
- Keyboard: Space lifts the card, arrows move it, Space drops it and Esc cancels.
- Esc, or a drop outside the board, puts the card back where it was.
- Every card also has a "Move to…" Menu, because dragging can't be the only way (WCAG 2.5.7).

**Announcements**
- In the reader's language, with names, never ids. For example: "Picked up Fix login. To do, 2 of 5" → "In review, 1 of 3" → "Dropped".

**RTL**
- Columns follow the inline direction.
- Under `dir=rtl`, the arrow keys go to the logical next and previous column.
- Auto-scroll is mirrored.

**Card**
- Slots: header, title, meta, footer.
- **One** primary action ("Open Fix login"), which is a real button and separate from the drag handle. Nothing interactive is nested inside it.

**Column**
- Title, count (ICU plural), colour, an actions Menu, and a named "Add task to QA" button.
- An empty state with an action, and an optional limit.

**States**
- Skeleton columns, ErrorState with retry, an empty board with an action, "no results" with "Clear search", and NoPermissionState.

**Performance**
- A drag-over doesn't re-render the board.
- Items from outside (realtime) are accepted during a drag without dropping it.

### CalendarGrid

A month and week grid.

- **Keyboard:** `role=grid` with roving focus. Arrows move a day, Home/End go to the week's ends, and PageUp/PageDown change the month.
- **Locale:** the first day of the week follows the locale; Arabic starts on Saturday. Day and month names come from Intl.
- **RTL:** mirrored.
- **Events:**
  - date-only events in an explicit time zone
  - events that span days
  - "+N more" in a Popover
- **Views and states:** month, week and agenda views; loading, empty and error states.

Until these land, the Tasks screens that need them are migrated last (step 6 and step 8). The rest of the wave doesn't wait.

## Fix specs

Each spec gives the problem, the decision, the library pieces it uses, and the check that accepts it.

| Spec | Issues | Screen | Decision | Library | Accepted when |
|---|---|---|---|---|---|
| FS-TASKS-1 | 005, 016, 021, 026, 030, 055, 056 | Every screen | The Files pattern. `lib/api-feedback` gives a translated toast per endpoint and maps errors by HTTP status; there are no doubles and no raw server text. baseApi never throws on network errors. The user comes from the server's cookies (the layout passes them to the store), so server and client render the same: no hydration error. A 401 keeps the deep link: it goes to SOS with `redirect`. A 404 page and an error boundary, translated, with a heading. Lists use ListStates: loading, error with retry, empty with an action, no match. | ListStates, ErrorState, NoPermissionState, toast | Stop the API and press Save: a translated "can't reach the server" toast, and no crash; vs1 shows 0 uncaught errors on every route |
| FS-TASKS-2 | 027, 029, 032 (shell), 061, 064 | Shell | SuiteShell, like Files' adapter (`components/suite/`). The rail shows the person's apps with names. The sidebar has Home, My tasks (Overview, Lists, Calendar), Projects, Teams and Notifications; items the person's role can't open aren't shown. The top bar has a translated breadcrumb (names, not ids) and a UserMenu with profile, language, theme and sign out. SoSBar, DashboardHeader, both sidebars and the collapse flash go. Links use next-intl's Link. | SuiteShell, AppRail, Sidebar, TopBar, UserMenu, Breadcrumb | vs1 20/20 on `/`; keyboard reaches the UserMenu |
| FS-TASKS-3 | 001, 002, 003, 065 | Hand-off, session | `/auth` takes SOS's one-time code (`?code=`), exchanged once (one shared promise), then replaces its URL. `?token=` still works until SOS lists Tasks in `CODE_APPS`. `redirect` follows same-origin paths only. No fixed 1 s wait. A failed code shows ErrorState with "Back to the suite". Nothing is written to the console. The dev login page with committed passwords goes. The cookie stays JS-readable until the real API sets an HttpOnly session (a contract for the dev team, in the PM packet). | ErrorState, Spinner | Opening Tasks from SOS leaves no token in history; `redirect=https://…` is ignored |
| FS-TASKS-4 | 004, 018, 019, 020 | Permissions | Roles come from the `task_manager` scope only (`scopes[].roles`), never the flattened list. One `can(action)` helper for the UI, matching the mock's `isPM` and `isViewerOnly`. The middleware's route table becomes: signed in with the scope → in. Pages decide what's shown. A page the role can't use shows NoPermissionState inside the app, never a bounce to SOS. Team sub-pages open for every member. Viewers see read-only screens: no Create, Edit, Delete, drag or "+". | NoPermissionState, Tooltip (why a control is off) | T6 and T7 pass: Karim opens a team; Omar sees the board read-only and no 403s |
| FS-TASKS-5 | 006, 007, 008, 012, 031, 032 (board), 034, 035, 066, 067 | Board | On the library's Board. A failed move puts the card back with a translated toast, and a cancelled drag restores it. "+" on a column creates the task **in that column** (by section id, not by guessing from its title). The Archive column stays when it's open. Reordering under a search sends the absolute neighbours. Each card opens from its title button, from the keyboard too. Column titles are shown as written. One status→tone map (the status matrix). The sheet mounts once for the board, not per card. | Board, Menu, StatusBadge, Avatar, IconButton | T2 and T3 pass, including the fault-injected move and the keyboard move; axe 0 on the board in 5 languages × 2 themes |
| FS-TASKS-6 | 009, 010, 011, 033, 037, 038, 039, 040, 041 | A task (sheet) | One Sheet (`side="end"`, so it's on the left in Arabic), with editing inside it. Edit no longer stacks a second sheet. The due date and the header fields save, or they aren't editable. Mark complete and Share work, or they go. After Delete, the sheet closes and the board is usable. The attachment's remove is `type="button"`, with a ConfirmDialog that names the file. The deep link loads the task by id, with not-found and no-access states. The reaction toggle reads the current person's reaction. Mentions link to nothing that doesn't exist. Attachments use one card. The download proxy sends the token only to the API's own origin. New tasks have no due date unless one is picked. | Sheet, Tabs, Field, DatePicker, FileField, ConfirmDialog, Card, ListStates | T4 passes; the board is usable after a delete; a stale deep link shows "This task no longer exists" |
| FS-TASKS-7 | 014, 042, 045, 046, 053, 054 | Lists (My tasks, project) | Lists become DataTables grouped by section, with URL state for the search, filters and sort. Rows are rows. Reordering is the board's job, so lists get a "Move to…" menu instead of row dragging. "+" on a section creates the task in that section and in that project; My tasks asks which project. The project Lists tab comes back. The hydration error goes (no stray text in rows). `search=undefined` stops. | DataTable, Menu, FilterChips, Select | Reload keeps filters; "+" on a section adds the task there |
| FS-TASKS-8 | 043, 047, 052 | Calendars (My tasks, project) | On the library's CalendarGrid. Due dates are days in the organisation's time zone. The project filter really filters (or goes). Locale week start. | CalendarGrid, Select, Popover | T8 passes in en and ar; a task due on the 3rd shows on the 3rd in Cairo and in Zurich |
| FS-TASKS-9 | 013, 048, 050, 068 | Home, My tasks overview | Charts on `@orgtik/ui/charts`, each with a table view; progress rings become Progress with a text value. Up Next links to the task's project with `?task-id=`. Charts read the API's keys, not translated names, so German isn't all zeros. Metric copy says what the number is. | charts, Stat, Card, Progress | vs1 clean on `/` and `/my-tasks/overview` in en/ar × light/dark; the priority chart has data in de |
| FS-TASKS-10 | 015, 044, 057 | Projects | After Create, the list shows the new project (the default filter is "All", in the URL), and a toast offers "Open project". Status is one Select (the workflow editor goes, see defaults). Create and Edit share one form and one set of rules. | DataTable or Card grid, Dialog, Field, Select, toast | T5 passes |
| FS-TASKS-11 | 022, 023, 024, 025, 060, 062 | Teams | The team's name is the link to its overview, and the row has a named Menu. `/teams/:id` redirects to its overview, and the breadcrumb names the team. Team pages have not-found, no-access and error states. The status filter has three real options (All, Active, Inactive). Copy fixes. Delete is a ConfirmDialog with its impact, not "type DELETE". Hooks move out of cells. | DataTable, Menu, ConfirmDialog, ListStates, Tabs | T6 passes; `/teams/999` shows "Team not found" |
| FS-TASKS-12 | 017, 049, 051, 058, 059 | Notifications, realtime | The sockets read the token correctly, so live notifications appear, and the badge counts them. One socket client for the app. The date filter is sent as days (no `toISOString` shift). Row actions are always visible (a named Menu), and the row is a link to a target that exists: the task's sheet on its board. "Delete all" becomes "Mark all as read". | Menu, Badge, DateRangePicker, ListStates | A notification sent from the mock appears without a reload; every target opens |
| FS-TASKS-13 | 028, 029, 036, 063 | Languages, cleanup | ar, fr and it catalogs at parity (Arabic in MSA, D-015; glossary terms; the status matrix's labels). Every hard-coded string goes through next-intl, including zod messages. Dates and numbers come from the formatter with the locale. Physical classes become logical. lucide and iconify go to Phosphor. `components/ui/*`, Radix, sonner, framer-motion, next-themes and dead code are removed, and the token bridge last (D-020). | — | The counts are at 0; `glossary_check.py tasks` 0 rows; no English in the ar walk |

## Order

1. **Align and foundations:** link `@orgtik/ui` (yalc), the token bridge, root layout (lang, dir, ThemeScript, provider, Toaster), five locales in routing with empty catalogs filled from en, then FS-TASKS-1.
2. **Shell** (FS-TASKS-2), with the user from the server (no hydration error).
3. **Hand-off and permissions** (FS-TASKS-3, FS-TASKS-4).
4. **Projects** (FS-TASKS-10), then **Teams** (FS-TASKS-11).
5. **Home and My tasks overview** (FS-TASKS-9).
6. **Board** (FS-TASKS-5), on the library's Board, then **the task sheet** (FS-TASKS-6).
7. **Lists** (FS-TASKS-7) and **Notifications** (FS-TASKS-12).
8. **Calendars** (FS-TASKS-8), on CalendarGrid.
9. **Languages and cleanup** (FS-TASKS-13). Then the flows run in en and ar, vs1 runs on every route, and the issues are closed.

## Golden flows (to become `flows/tasks.mjs`)

| Flow | Who | Steps |
|---|---|---|
| T1 Open Tasks from the suite | Mona (super admin) | SOS home → Tasks in the launcher → Tasks home, with no token in its history |
| T2 Add a task to a column | Karim (project manager) | A project's board → "Add task to In review" → title, assignee, due date → saved → the card is in In review |
| T3 Move a task | Salma (developer) | Board → move a card from To do to In progress with the keyboard → announced and saved → reload: still there. With the move failing (mock fault): the card goes back and a toast says so |
| T4 Work inside a task | Salma | Deep link `?task-id=` → change the due date → add a comment → delete the task (confirmed) → the board is usable |
| T5 Start a project | Karim | Projects → Create project → the list shows it → Open project → its board |
| T6 Open a team | Karim | Teams → a team's name → Overview, Priority, Feed, Team tabs → breadcrumb back |
| T7 Read-only | Omar (viewer) | Board without Create, "+", drag or Delete → a team read-only → My tasks shows the no-permission state |
| T8 Plan in the calendar | Salma | My tasks › Calendar → next month with the keyboard → a day's tasks → open one; in ar the week starts on Saturday |

## Progress

Branch `wave3/tasks` of `task-manager-front-main` (local, not pushed, D-044). The mock changes are in `local-dev` (Tasks files only).

| Step | Commit | What landed |
|---|---|---|
| 1–2. Align, foundations, shell | 4307ffb | @orgtik/ui (yalc), token bridge, five languages (458 keys at parity, Arabic MSA), the store seeded from the server's cookies (no hydration error on any route), translated toasts by endpoint and status, crash page, 404, SuiteShell with UserMenu |
| 3. Hand-off, permissions | 40e4631 | One-time code (SOS lists Tasks in CODE_APPS, a500ba4), same-origin redirects only, the dev sign-in page with passwords gone, roles from the task_manager scope, in-app no-access pages; the original middleware matcher kept (Next 15.5 ignores next-intl's) |
| 4a. Projects | f9dbc3c | List with URL state and every project by default, ProjectCard, one Create/Edit form, ConfirmDialog delete; the shared badges on the library |
| 4b. Teams | 57b8d21 | DataTable list, team frame with not-found/no-access/error, overview, priority, activity and people; mock: team status filter (local-dev ab1a28f, with analytics keys) |
| 5. Dashboard, My tasks overview | 25d649f | Stat figures and library charts with table views, from the API's keys (local-dev ab1a28f) |

**Library work in progress:** Board and CalendarGrid on `orgtik-ui` branch `feat/board-calendar` (worktree `orgtik-ui-wt-tasks/`); the releasing session merges it and cuts the release.

**Changed from the plan:** due dates stay instants in the API (5 pm on the day); the app reads their day once, in the organisation's time zone (`lib/dates.ts`, `NEXT_PUBLIC_ORG_TIME_ZONE`, default Africa/Cairo). Analytics answers carry keys (status, month, day, activity code) next to their English labels, a contract for the dev team.

### Steps 6–9 (2026-10-02)

| Step | Commit | What landed |
|---|---|---|
| 7a. Notifications, realtime | c6a19cb | One realtime connection (the old sockets never connected); notifications worded from their type in five languages and linked to pages that exist; Mark all as read; the bell |
| 7b. Project frame, lists | c970b5f | Project header with people and teams, Board/List/Calendar tabs, the List view back, tasks as tables with a Move to menu |
| 6, 8. Board, task sheet, calendars | 37e0520, 83f5173 | The library's Board and CalendarGrid (rc.6, built on `feat/board-calendar`, released by the SOS session); one TaskSheet per project opened by `?task-id=`; one task form; comments, subtasks and activity panels; files; the download proxy fixed |
| 9. Cleanup | cc2e794, cbc960b, 628e6d3 | The person's work sheet; ~90 dead files, `components/ui`, 43 packages and the token bridge removed (D-020); 653 keys at parity; glossary check 0 rows |

**Counts at the end:** `components/ui` imports 0, lucide/iconify 0, sonner 0, physical direction classes 0, raw hex and palette classes 0. Catalogs: en, ar, de, fr, it at parity.

**Issues:** 68 of 69 fixed (`issues.csv`). Still open: TASKS-003 (partly fixed). The token isn't logged any more, but an HttpOnly session has to be set by the real API. TASKS-021 was closed on 2026-10-02 with SOS's new `/go/task_manager?redirect=` route: after signing in again, the person lands on the page they were on (flow T9).

**Dev-only noise, not a defect:** about 1 load in 12 on the Next 15.5 dev server logs "attributes didn't match" for generated ids (the logo gradient, the menu triggers). The stack runs through Next's dev-only segment explorer, and the production build keeps every menu's ids consistent (15 of 15 loads checked). vs1 counts these renders separately.

**Golden flows:** `tools/audit-kit/flows/tasks.mjs` (T1–T9): T1–T8 27/27 in en and ar, T9 2/2 in en and ar, under the shared flow lock.

**vs1 at the end (2026-10-02):** all 14 routes are clean, 280 of 280 renders (5 languages × 2 themes × 390/1440): axe 0/0, no overflow, no English left, no broken images. The only flag is the dev-only id warning above. Before the wave, no render on any route was clean. The run found two problems, fixed in 5ace6b4:
- The library Board's hidden labels widened the page. The library fix is on orgtik-ui main (83201ba); remove Tasks' wrapper when rc.7 is out.
- English names in Arabic breadcrumbs weren't isolated.

**Wave status: done.** Only TASKS-003 remains, and it needs the backend. Follow-up: drop the Board wrapper on rc.7.
