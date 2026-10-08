# OrgTik stakeholder prototype

This guide tracks the working presentation under [D-073](decisions/D-073.md). Payments, mail, AI, signatures and external delivery are simulated. Existing backend foundations are frozen; the prototype is a design reference for the PM and development team.

## Run locally

From the repository root, run `pnpm demo`. It starts SOS at `http://localhost:3500/en/auth/login` and Tasks at `http://localhost:3501`. Use an existing synthetic persona in a private browser window; the fixture accounts are documented in `mock/README.md`. This guide does not reproduce passwords.

`pnpm demo wm,website` starts the CMS/website demonstration. `pnpm demo tasks,files` selects tools; `pnpm demo --list` prints addresses without starting anything. [Launcher details](../tools/demo/README.md) explain the isolated dataset, occupied-port behavior and Ctrl+C. Restart for a fresh backend seed. No online deployment is enabled.

## Available walkthroughs

| Surface | Show | Status |
|---|---|---|
| CMS / website | Edit Partners, submit, approve, publish, reload website; last-good content during an outage | Selected mock flow completed in PR20/21 |
| Shared Demo Panel | Six states, language, light/dark, scene descriptions and local reset across nine shells | Implemented; feature adapters connect per tool |
| Tasks → Presentation workflow | Search, quick add, edit labels/watchers/reminder, repeat a task, use template, CSV mapping/review/result, select/bulk edit, export, reset | First local UI increment; broader tool integration pending |
| Files / whiteboards | Existing packaged samples/references and structured whiteboard version flows | Earlier scoped evidence retained; new tool feature wave pending |
| Other tools / final 15 journeys | See maintained release register | Remaining work |

## Tasks presentation script

1. Sign in to SOS as Nour and open Tasks through the existing launcher. Choose **Presentation workflow** in the sidebar.
2. Add “Stakeholder review”, open it, set a label and date, select watchers and enable the reminder. Show the **Simulated** recipients preview and save.
3. Search the task title, select the visible task, complete it in the bulk bar and export the filtered CSV.
4. Use the onboarding template, save it and complete it. The next weekly occurrence appears. Edit another task's Repeat to Monthly to show the same pattern through editor completion.
5. Import CSV: paste header/text, map title/assignee, review the rows, import and show the result. Text import is bounded to 200 rows/100 KB; arbitrary binary uploads are deferred.
6. In Demo controls, select OrgTik to show its fixture title, or a new workspace to show the empty state. The persona affects the assignee in this presentation surface. It does not sign in as that person.
7. Demonstrate loading/error/retry/no-access/read-only/success with the shared controls, then restore Normal. **Reset scene** restores selectors; **Reset demo tasks** restores the page's fixtures.

## Developer handoff

Tasks uses `PresentationTask {id,title,status,owner,label,due,recurrence,watchers,reminder}` in `apps/tasks/lib/presentation-tasks.ts`. The adapter is client memory; this increment adds no HTTP endpoint. Changes disappear on reload or workspace scene switch. Existing Tasks API data remains separate.

The eventual backend needs scoped list/filter/create/update operations, stable person/label IDs, recurring schedules, notification delivery and import result IDs. The reference UI currently demonstrates the create/edit, next-occurrence, recipients-preview and import-result shapes. It does not establish production delivery guarantees. The existing Tasks/Files reference surface remains the integration reference until this new presentation screen connects to it.

The complete nine-tool screen map, shared search/notifications, remaining 72-feature acceptance and all 15 scripted journeys are still pending. Track them in [the maintained roadmap](plan-v2-execution.md) and `backlog/release-packages.csv`; a working mock flow does not complete an external capability.
