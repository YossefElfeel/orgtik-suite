# OrgTik stakeholder prototype

This guide tracks the working presentation under [D-073](decisions/D-073.md). Payments, mail, AI, signatures and external delivery are simulated. Existing backend foundations are frozen; the prototype is a design reference for the PM and development team.

## Run locally

From the repository root, run `pnpm demo`. It starts SOS at `http://localhost:3500/auth/login` and Tasks at `http://localhost:3501`. Use an existing synthetic persona in a private browser window; the fixture accounts are documented in `mock/README.md`. This guide does not reproduce passwords.

`pnpm demo wm,website` starts the CMS/website demonstration. `pnpm demo tasks,files` selects tools; `pnpm demo --list` prints addresses without starting anything. [Launcher details](../tools/demo/README.md) explain the isolated dataset, occupied-port behavior and Ctrl+C. Restart for a fresh backend seed. No online deployment is enabled.

## Available walkthroughs

| Surface | Show | Status |
|---|---|---|
| CMS / website | Edit Partners, submit, approve, publish, reload website; last-good content during an outage | Selected mock flow completed in PR20/21 |
| Shared Demo Panel | Six states, language, light/dark, scene descriptions and local reset across nine shells | Implemented; feature adapters connect per tool |
| Tasks → Presentation workflow | Search, quick add, edit labels/watchers/reminder, repeat a task, use template, CSV mapping/review/result, select/bulk edit, export, reset | First local UI increment; broader tool integration pending |
| SOS → Account presentation | Sample usage/limits, onboarding checklist, attributed activity, simulated data export and fixed-code verification/recovery | Local UI increment; no sign-in or account changes |
| HR → People presentation | Policy/balances, profile request/approval, CSV text import, CH/UAE payroll samples, onboarding tasks and expiry/mailbox previews | First UI increment merged in PR27; task provisioning/bank submission/external mail pending or deferred |
| Sales → Sales presentation | Pipeline/probability/forecast, contacts/bulk/CSV, routing, timeline/follow-up IDs, tags/fields, offer expiry/signature and reports | First UI increment merged in PR28; provisioning/PDF/sign providers pending or deferred |
| Marketing → Marketing presentation | Consent/delivery/attribution, RTL email/export, social replies, queue/reschedule, journey dry runs and template AI→editor | First UI increment merged in PR29; external/cross-app delivery pending or deferred |
| WM → Website studio presentation | Packaged media/variants, translation review, form outcomes, notices and release bundle transitions | First UI increment merged in PR30; existing actual CMS publisher remains separate |
| ADM → Operations presentation | Recovery/credit notes, subscription totals, sample invoices/contacts/series, pay links/tax examples, support/audit/export | First UI increment merged in PR31 |
| Files → Presentation workflow | Packaged samples, per-person simulated access, comments/versions, conflicts, quota, bulk and drag moves, filters | First UI increment merged in PR25; existing authorized reference/whiteboard surfaces retained |
| Chats → `/presentation` | Channels/read state, composition, saved/reminder/scheduled items, mock task IDs, sample file names and simulated call stage | First UI increment merged in PR24; new cross-app provisioning/provider delivery pending |
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

Connected presentation runtime: `pnpm demo tasks,chats,sales,marketing` starts a separate synthetic-record service alongside the unchanged mock backend. In Chats, create a task from a message; `Ctrl+K` finds it and opens the exact task in Tasks through the existing handoff. In Marketing, create campaign CRM leads; suite search opens their exact Sales presentation detail. Notification links carry the same scene. This runtime stores only mock connection records; existing backend accounts/invoices/content are separate.

Presentation workspace/persona, locale, theme, digits and timezone travel as landing metadata. Demo controls expose digits/timezone choices. A tool’s actual access is still decided by its existing session. These first connections are locally verified; HR onboarding and Sales follow-ups also create assigned Tasks; WM accepted form samples create OrgTik CRM leads with Partners attribution. Files records feed versioned Tasks/Chats picks. Final15 journey acceptance remains open.

Account presentation uses client state plus shared `UsageMeter`, `AuditLogTable` and `TwoFactorScreens`. Demonstrate onboarding completion → Activity history → search, then Verification demo → Start setup → enter the displayed fixed code → sample recovery download. The exported JSON is tagged `prototype` and `simulated`; it is not a regulatory data export. Existing team, ownership, billing and invoice screens retain their own working mock flows.

Tasks uses `PresentationTask {id,title,status,owner,label,due,recurrence,watchers,reminder}` in `apps/tasks/lib/presentation-tasks.ts`. The adapter is client memory; this increment adds no HTTP endpoint. Changes disappear on reload or workspace scene switch. Existing Tasks API data remains separate.

The eventual backend needs scoped list/filter/create/update operations, stable person/label IDs, recurring schedules, notification delivery and import result IDs. The reference UI currently demonstrates the create/edit, next-occurrence, recipients-preview and import-result shapes. It does not establish production delivery guarantees. The existing Tasks/Files reference surface remains the integration reference until this new presentation screen connects to it.

The [72-feature map](prototype-feature-map.md) and [15 walkthrough scripts](prototype-journeys.md) are available. Remaining feature acceptance and all 15 final connected walkthroughs are still pending. Track them in [the maintained roadmap](plan-v2-execution.md) and `backlog/release-packages.csv`; a working mock flow does not complete an external capability.
