# Tasks P4 pilot

Source: `2fdee39` + `5406402`, based on root contracts/library `44d58ab` and merged P2 `e8a9c57`. Scope is the ordinary Tasks frontend and its evidence. Shared mock, auth/session/journal, other worktrees and the website were not edited by this package.

The approved DS v2 world is preserved: graphite surfaces, violet actions, aubergine rail, Montserrat headings, IBM Plex UI text, hybrid radius, shared Toolbar/DataTable/SuiteFrame/ToolAdminScreen. Historical `/presentation` stays outside navigation. The ordinary screens do not import fixture people/tasks or call `demoRequest`.

## Feature placement

| Commitment | Ordinary screen and behavior |
|---|---|
| R3-TASKS-01 | Project and My tasks lists: real query data, search/status/assignee/priority/label/due filters, saved views, density, column chooser and sort. Shared suite search finds visible Tasks records. |
| R3-TASKS-02 | Inspector: persisted watchers, reminder settings and recipient preview, overdue dates, explicit/due in-app mock delivery with actual notification receipts and duplicate prevention. External delivery remains simulated. |
| R3-TASKS-03 | Inspector repeat setting; ordinary completion creates one persisted occurrence. Monthly recurrence clamps to the target month end in the root-owned mock. |
| R3-TASKS-04 | Quick-add presets and project templates; inspector Save as template and admin template removal. Watchers/reminder/labels/custom fields/description/dates survive reuse. |
| R3-TASKS-05 | Retained D-071 Files picker/attachment/reference recovery with ConnectedFeature, owner trial and member requests. Real pinned workspace/version references remain intact. |
| R3-TASKS-06 | Inspector TagInput, persisted labels, list column and filter. |
| R3-TASKS-07 | Text CSV source/mapping/review/result with genuine per-row outcomes; filtered RFC4180 CSV export. Up to 200 rows/100 KB. Arbitrary binary uploads remain deferred. |
| R3-TASKS-08 | Explicit project/section quick add; selected status/priority/assign-to-me writes with failed selections retained. |

All Tasks Tier B items are on ordinary routes: project month timeline/Gantt with dates, dependency waiting badges and exact inspector links; configured text/number/checkbox fields; enabled overdue/status rules with priority/label actions and persisted runs; time entries plus an inspector timer; archive/restore and an Archived projects filter; a real first-run checklist and idempotent sample project with three tasks.

`/[locale]/admin/[[...section]]` exposes overview, members/seats, roles, settings, connections, import/export, audit and billing through the shared owner-aware tool administration component. Task-owned configuration/import extend settings/import-export. The Tasks role helper reads the refreshed suite snapshot so billing or role changes affect ordinary write controls. HR calendar projection is gated by the subscribed/enabled connector; it does not require an HR seat and guests receive no projection.

Below 640px, project description/people/teams and their controls remain available inside a native Project details disclosure. Extra filters and quick add open on demand. DataTable and timeline use their own keyboard-accessible horizontal scroll regions.

## Validation

All commands ran in this dedicated worktree and its owned offset200 in-memory demo, with a frozen mock clock. Only that demo's synthetic proof records were arranged/reset.

- `pnpm --filter somion-task-manager typecheck` — pass.
- `pnpm --filter somion-task-manager i18n:check` — EN/AR/DE/FR/IT keys and placeholders match.
- `pnpm --filter somion-task-manager build` — pass; ordinary admin and timeline routes emitted. The compiled chunk includes the final Project details refinement.
- [functional.json](functional.json) — 34 assertions: actual persistence/recurrence/watchers/templates/time/reminder receipts, pinned Files, CSV/bulk/filter/export/saved views, custom fields/rules, all admin routes, archive/restore and first-run Tasks-only → Files trial.
- [visual.json](visual.json) — 53 assertions; EN/AR × light/dark × 1440/390/768/1024. Zero document overflow, direction/theme failures, critical/serious axe violations or application runtime errors.
- [catalogs.json](catalogs.json) — 10 assertions; ordinary DE/FR/IT at 1024, including axe/direction/theme/overflow.
- [templates.json](templates.json) — five focused actual inspector → persisted template → quick-add checks for dates, recurrence, watchers, reminder, description and configured values.
- [details-states.json](details-states.json) — 9 assertions and eight authoritative recaptures, including a 390 inspector and intended component readiness. These replace premature session-loading captures from the initial visual run.

There are 31 unique accepted screenshots. Loading/error/forbidden use controlled pending/failing GET responses in the owned browser context. Empty uses a genuine unmatched filter, read-only uses actual project archival, and success follows persisted time/settings changes. No Demo Panel overlay supplies these states. In-app reminders use actual mock notification records; this evidence does not claim external delivery or hosted/provider acceptance.

The capture harness warms `/auth` before minting a handoff code because cold development compilation can exceed the code's one-minute lifetime. Route waits also account for compilation; expired warmup attempts were not application defects or acceptance evidence.

## Representative evidence

- [Desktop list](workbench-en-light-1440.png), [Arabic dark mobile](workbench-ar-dark-390.png), [Arabic tablet](workbench-ar-dark-768.png).
- [Actual inspector](task-inspector.png), [Mobile inspector](task-inspector-en-light-390.png), [Timeline](timeline.png), [Task configuration](admin-settings.png).
- [First-run connection](first-run-connected-inspector.png).
- [Loading](state-loading.png), [Empty](state-empty.png), [Error](state-error.png), [Forbidden](state-forbidden.png), [Read-only](state-read-only.png), [Success](state-success.png).

## Visual review record

The Impeccable finish review was performed inline; the team's agent slots were occupied. This was an extension of the adopted plan/P1 specimens and shared P2 library, not a new visual world or comp reproduction. No Tasks PRODUCT.md/DESIGN.md existed; that pre-existing documentation gap was not repaired outside this package's scope.

The first review requested one mobile refinement: project metadata consumed the first viewport. The post-fix captures show the Project details disclosure preserving the content/actions and making task controls easier to reach. Typography, materials and ground match DS v2; primary action/navigation/status treatment remain consistent. The final capture review found no missing or contradicted feature surface. Disposition: **ship** for this scoped frontend/mock pilot. The shared generic settings label currently reads “Connection settings”; that copy is left to the root owner's suite consistency pass.

Reproduce with `ORGTIK_DEMO_PORT_OFFSET=200 pnpm demo tasks,files`, then the `.mjs` harnesses here. They use ordinary API-backed records and a private demo namespace; no deployment is performed.
