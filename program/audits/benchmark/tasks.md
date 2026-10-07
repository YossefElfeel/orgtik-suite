# Tasks: feature benchmark (vs Asana, Linear, ClickUp)

Read from the code and the mock on 2026-10-07: `apps/tasks`, `mock/apps/tasks.js` and `mock/apps/tasks/*`, plus the wave records in `program/audits/tasks/`. Nothing was run. In the evidence column, `[d]` is `apps/tasks/app/[locale]/(dashboard)`.

**Summary**
- **Expected and missing: 9.** Project archive, labels, bulk edit, notification preferences and watchers, reminders, recurring tasks, the Files app link, templates, and import/export.
- **Expected and partial: 9.** Subtasks, rich-text description, sections, quick add, live updates, search, filter/sort, team management, and onboarding.
- **Differentiators worth doing: 5.** "Discuss" with Chats, a read-only client view, dependencies done properly, a timeline, and HR availability.

Ratings:
- **Expected:** people coming from Asana, Linear or ClickUp will miss it.
- **Differentiator:** sets a product apart. Marked ★ where it's worth doing for OrgTik.
- **Not for us:** doesn't fit an SMB suite prototype.

| Feature | Area | Rating | OrgTik today | Evidence | Gap & size |
|---|---|---|---|---|---|
| Projects: create, edit, delete | Core objects | Expected | Have | `components/dialogs/projects/ProjectFormDialog`, `components/pages/projects/ProjectCard`; mock `POST/PUT/DELETE /api/projects` | — |
| Project archive (close without deleting) | Core objects | Expected | Missing | Project status is only todo / in_progress / done (`[d]/projects/page.tsx`; mock `PROJECT_STATUSES`) | Add an "Archived" state, hide archived projects by default, add a filter. **S** |
| Tasks: create, edit, delete; detail sheet with deep link | Core objects | Expected | Have | `components/task/TaskFormDialog.tsx`, `components/task/TaskSheet.tsx` (`?task-id=`, 404/403 states); mock `POST /api/tasks/sections/:id`, `PUT/DELETE /api/tasks/:id` | — |
| Task fields: priority, multiple assignees, start and due day | Core objects | Expected | Have | `TaskFormDialog.tsx` (priority Select, MultiSelect limited to project members, two DatePickers); `lib/dates.ts` (date-only, overdue shown) | The mock accepts team assignees; the UI doesn't offer them. |
| Subtasks / checklist | Creation & editing | Expected | Partial | `components/task/subtasks/SubtasksView.tsx`, `SubtaskRow.tsx`; mock `/api/tasks/:id/subtasks` | A checklist only: add, rename, tick, reorder by drag or keyboard. No assignee or due date on a subtask. **M** |
| Rich-text description | Creation & editing | Expected | Partial | `TaskFormDialog.tsx` (plain Textarea); `components/task/RichText.tsx` (renders links and `@[id]` only) | Add basic formatting: bold, lists, links, checklists. **M** |
| Sections / board columns | Core objects | Expected | Partial | `components/dialogs/projects/SectionFormDialog.tsx`; mock section POST/PUT/DELETE | Create, rename, recolour and delete work. Each section maps to one of 5 fixed statuses. No column reordering in the UI, though the mock accepts `order`. **S** |
| Labels / tags | Core objects | Expected | Missing | Not in the UI or in the mock schema | Labels per workspace, a picker on the task, a filter. **M** |
| Custom fields | Core objects | Differentiator | Missing | — | Labels and priority cover most SMB needs. Revisit later. |
| Board (kanban) with drag and drop | Views | Expected | Have | `[d]/projects/[projectId]/board/page.tsx` on `@orgtik/ui` Board; mock `POST /api/tasks/:id/move` | Pointer, touch and keyboard moves; rolls back with a toast on failure; Archive column can be shown. |
| List view | Views | Expected | Have | `[d]/projects/[projectId]/lists/page.tsx`, `components/shared/TaskSections.tsx` (DataTable per section, "Move to…") | Sorting and filtering are covered in their own row. |
| Calendar view (project and My tasks) | Views | Expected | Have | `components/task/TaskCalendar.tsx` (CalendarGrid, month/week, project filter, RTL) | No drag to reschedule and no creating from a day. A good next step, not a gap. |
| My tasks (personal view) | Views | Expected | Have | `[d]/my-tasks/overview`, `/lists`, `/calendar`; mock `GET /api/users/profile/sections`, `/api/analytics/user-dashboard` | — |
| Timeline / Gantt | Views | Differentiator ★ | Missing | `startDate` is stored but no view uses it | A simple timeline from the start and due days. **L** |
| Quick add (inline, keyboard) | Creation & editing | Expected | Partial | The column "+" and the list's "Add task" open the full dialog; only subtasks have an inline field | An inline title field per column or section, plus an "N" shortcut. **S** |
| Bulk edit / multi-select | Creation & editing | Expected | Missing | DataTable has `selectable`, but it's never turned on (`TaskSections.tsx`) | Select rows, then move, assign, set a due day or delete. **M** |
| Comments: replies, reactions, files, @mentions | Collaboration | Expected | Have | `components/task/CommentsPanel.tsx`, `comments/CommentComposer.tsx`, `comments/MentionTextarea.tsx`; mock comments routes and `comment_mention` | — |
| Activity history on a task | Collaboration | Expected | Have | `components/task/ActivityPanel.tsx`; mock `logActivity`, `GET /api/tasks/:id/activities` | — |
| In-app notifications (bell, page, live toast) | Collaboration | Expected | Have | `[d]/notifications/page.tsx`, `components/suite/NotificationBell.tsx`, `components/suite/Realtime.tsx`; mock sends assigned, mention, reply, status, due-date and member notifications | — |
| Notification preferences, email digest, watchers | Collaboration | Expected | Missing | No settings screen. The mock notifies only the creator and assignees (`setStatus` in `mock/apps/tasks.js`) | Follow/unfollow a task; choose what notifies you; a daily email. **M** |
| Live updates of other people's board changes | Collaboration | Expected | Partial | Only notifications are pushed. The wave plan's `board:changed` event isn't in the mock or the app | Push task moves and edits to open boards (a backend contract). **M** |
| Search | Search/filter/sort | Expected | Partial | Projects are searched by name on the server (`[d]/projects/page.tsx`); the board filters by title in the browser; lists have no search | A search across all tasks (title and description) from the top bar. **M** |
| Filter, sort, group | Search/filter/sort | Expected | Partial | Filters exist for project status, the calendar's project and notifications. Task views can't filter by assignee, priority or due day; the DataTable columns don't sort; grouping is fixed by section | Filter chips (assignee, priority, due, label), sortable columns, filters kept in the URL. **M** |
| Reminders and due-soon alerts | Time | Expected | Missing | "Due soon" exists only as a dashboard figure; no notification type for it | A due-soon or overdue notification, plus a per-task reminder. **M** |
| Recurring tasks | Time | Expected | Missing | — | Repeat daily, weekly, monthly or yearly; the next one is created on completion. **M** |
| Dependencies (waiting for) | Time | Differentiator ★ | Partial | Picked in `TaskFormDialog.tsx`; shown in `TaskSheet.tsx`; mock `canComplete` | "Complete" is disabled when blocked, but a board drag to Done skips the check (mock `/move`). Blocked cards have no badge. |
| Time tracking / estimates | Time | Differentiator | Missing | — | Agencies want it; most owners don't on day one. |
| Attachments on tasks and comments | Files | Expected | Have | `components/task/TaskAttachments.tsx`, `comments/AttachmentCard.tsx`, `app/api/attachment-download` | Stored locally by the Tasks mock. |
| Attach from or save to the Files app | Suite integration | Expected | Missing | `mock/apps/tasks/files.js` only generates seed files; no link to Files | Pick from Files; task uploads land in a project folder in Files. **M** |
| Roles, read-only viewers, private projects | Permissions | Expected | Have | `lib/permissions.ts`, `lib/roles.ts`, `components/shared/RoleGate.tsx`, `[d]/auth/not-allowed`; the "private" checkbox in ProjectFormDialog is enforced by the mock (`canSeeProject`) | Roles are managed in SOS, not here. |
| Guest / client access to a project | Permissions | Differentiator ★ | Partial | The mock treats `userType: customer` as a viewer of their own projects; no invite or share link in the UI | A read-only client view by invite. Valuable for agencies and service SMBs. |
| Team pages (people, feed, priority, bookmarks) | Collaboration | Expected | Partial | `[d]/teams/*`, `components/pages/team/*` | No UI to edit a team, remove a member or delete a bookmark, though the mock supports all three. **S** |
| Project and task templates | Templates/automation | Expected | Missing | New projects always get the 5 default sections | Start from a template, or save a project as one. Ship 3–5 SMB templates. **M** |
| Automations / rules | Templates/automation | Differentiator | Missing | — | Later, after templates and recurring tasks. **L** |
| Dashboards (home and my overview) | Reporting | Expected | Have | `[d]/page.tsx`, `[d]/my-tasks/overview/page.tsx` (charts with table views); `mock/apps/tasks/analytics.js` | Fixed reports; no custom reports or export. |
| Workload by person | Reporting | Differentiator | Partial | "Completed by assignee" on the dashboard; the work tab in `components/pages/team/PersonSheet.tsx` | No capacity or load view across people. |
| "Discuss" a task in Chats | Suite integration | Differentiator ★ | Missing | No Chats link in `apps/tasks`. Chats has only a stand-in task page (`apps/chats/features/shell/TaskScreen.tsx`, CHT-042 partly fixed) | Embed Chats' Discuss button and context card in the task sheet. **M** |
| People from HR (profile, leave, availability) | Suite integration | Differentiator ★ | Partial | People come from the shared SOS identity (`identity` in `mock/apps/tasks.js`), with manager links; no HR profile or leave data | Show "on leave" on assignees and link the name to HR. **M** |
| Calendar sync (ICS, Google, Outlook) | Time | Differentiator | Missing | — | An ICS feed of my due days is the cheap first step. **S** |
| Mobile / responsive | Mobile | Expected | Have | VS-1 renders at 390 px with no overflow (`program/audits/tasks/vs1/vs1-tasks-after-*.md`); touch on the Board | A web app only. |
| Accessibility and keyboard | Accessibility | Expected | Have | Keyboard moves on the board, subtasks and mentions; charts have tables; axe 0 critical in the VS-1 after-runs | No app-wide shortcuts like Linear's. That would be a differentiator. |
| Languages and RTL (en, ar, de, fr, it) | Accessibility | Expected | Have | `apps/tasks/messages/*.json` at parity; `dir` set on the server; `lib/bidi.ts` | — |
| Onboarding and empty states | Onboarding | Expected | Partial | ListStates, EmptyState and NoPermissionState on every page | Empty states are good. No first-run guide or sample project for a new workspace. **S** |
| Import / export (CSV, from Asana or Trello) | Import/export | Expected | Missing | — | CSV import with column mapping; CSV export of a project. **M** |
| Goals / OKRs / portfolios | Reporting | Not for us | Missing | `goalsByStatus` is computed in `mock/apps/tasks/analytics.js` but not shown | Too heavy for SMB owners at this stage. |
| Docs/wiki, AI assistant, native apps | Other | Not for us | Missing | — | Out of scope for the prototype. |

## Top 8 to add, by value to an SMB owner

1. **Filters and search across tasks** (assignee, priority, due, label; global search). **M**
2. **Reminders and due-soon/overdue alerts**, with simple notification preferences and watchers. **M**
3. **Recurring tasks** for weekly reports, monthly invoices and payroll checks. **M**
4. **Templates**: SMB starter projects, plus "save as template". **M**
5. **Files app link**: attach from Files, and task files saved to a project folder. **M**
6. **Labels/tags**, with a filter. **M**
7. **CSV import and export**, to move in from spreadsheets or Trello and to report out. **M**
8. **Quick add and bulk edit**: inline add per column, multi-select to move, assign or set due days. **S + M**
