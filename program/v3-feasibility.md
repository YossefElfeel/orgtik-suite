# V3 feasibility — P0 source review

Reviewed 2026-10-09 on `origin/main` `c7c7e1fe6771fe487521c03d48bec5608b0747c1`. This is a read-only implementation assessment, not a runtime acceptance test. No frozen file was changed.

| Area | Current evidence | P3/P4 implementation route | Limit |
|---|---|---|---|
| Entitlements | `mock/lib/workspace-context.js`: lines, grants, seats, access/reason/canWrite | Add connector projection and shared UI selectors over this context | No new identity or access authority |
| Cross-tool writes | `mock/lib/workspace-boundary.js:executeCommand` admits shared profile/roles and HR commands only | Owner-domain command with source/target checks, original operation ID, snapshot commit/rollback | Small explicit adapter exception under D-075; no raw writes to another app's module globals |
| Files references/boards | `workspace-file-references.js`, `workspace-files.js`, D-071/D-072 | Keep pinned immutable references and current consumer + Files authorization | Generic uploads/live transport remain deferred |
| Role administration | `workspace-commands.js:ROLE_NAMES` covers only Tasks/Files | Extend from current `TOOL_DEFINITIONS` for each tool | Tool admin is not account owner or OrgTik staff |
| Public service catalog | `mock/apps/admin/website-offers.js`, platform `services/websiteOffers/websiteOfferBundles` | New Sales module operating existing platform-store commands with internal OrgTik catalog permission | Customer CRM permissions cannot write public prices; preserve financial snapshots |
| WM → CRM intake | `mock/server.js:makeCtx` supplies deferred `crm_intake_pending`; WM saves intake status | Explicit internal CRM intake with a stable WM lead/order reference and retry receipt | Choose internal OrgTik destination, never caller-selected customer workspace |
| Search/notifications/activity | `mock/lib/presentation.js` reads a separate presentation namespace and links to `/presentation` | Current workspace read aggregation with filtered providers and ordinary-route deep links | Never import presentation fixtures as real customer records |
| People/contacts | `workspace-context.js` projects members; HR/CRM own domain records | Person key extends membership; CRM owns contacts/companies and Marketing audiences reference them | No wholesale migration/reset of stored workspaces |
| Adaptive login | `apps/sos/app/auth/handoff/page.tsx`, login redirect; tool rail uses a locale Home suffix | Apply one-tool redirect only at entry, respect explicit redirect; rail Home targets SOS root | Avoid a Home redirect loop; staff tools are separate |
| HR Projects | `apps/hr/redux/app/baseProjectApi.ts` sends the HR Redux token to Tasks API | Destination-audience handoff/transport through shared auth adapter and Tasks project source | Do not fix by weakening token audience checks |
| Website parity | `program/tools/qa`, existing public catalog fallback | Same-content control and API overlay captures must have zero design pixel delta; separately assert changed price/text values | Changed visible copy naturally changes pixels; do not call that design drift |

## Findings that affect planning

- D-068 already implements subscription/member/read-only enforcement and private workspace stores. E5 remains a UI explanation gap; it is not evidence that the mock permits billing-blocked writes.
- SR-020 is bounded: Files references and canonical boards exist under D-071/D-072, but broader generic sharing and full J8 acceptance remain open. SR-021 has the workspace-backed Chats adapter, while presentation-only interaction coverage and external live delivery remain separate.
- The external plan cites 192 ordinary routes plus ten presentation pages. A raw tracked `page.tsx` count is larger because it includes retired/redirect/auth routes. P0 retains 192 as the plan's classified audit number, not a newly verified route inventory.
- The 60/9/3 feature split and four integration families are classifications from the supplied audit. Source confirms ordinary-build presentation guards and the isolated bridge; P4 must reclassify commitment by commitment as it ships.
- P0's UI comparison is an illustrative direction beside a real historical capture. Actual DS v2 screenshots and brand/contrast measurements belong to P1/G-DS1.

## P3 entry conditions

G-DS1/G-DS2 precede adoption. Document each connector's owner-domain endpoint, destination audience, membership/seat/read-only behavior, operation receipt, deep link and failure state before coding it. Reuse existing retained regression checks when a frozen adapter is touched. This is scoped prototype verification, not a new backend/security program.
