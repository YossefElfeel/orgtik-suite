# OrgTik v3 stakeholder and developer guide

The v3 prototype places the approved Tier A/B features in ordinary signed workspace screens. Account/Home adapts to the actual tool set; shared search, notifications, activity, preferences and connections read current owner-domain records. The original 72 commitment IDs remain in [the feature map](prototype-feature-map.md). [The twenty journeys](prototype-journeys.md) describe native paths and their evidence limits.

This is a frontend and persisted mock prototype under D-073/D-075. Payments, email/push, AI, analytics, social delivery, signatures, calls and regulatory checks are labelled simulations. Arbitrary uploads, production providers and public Arabic website launch remain deferred. The user's October 11 instruction authorizes the remaining merge and Vercel deployment; final integration CI and hosted smoke identify the released revision separately from tool-cycle local acceptance.

## Run the ordinary prototype

Use an isolated checkout of the final integrated branch. `pnpm demo --list` shows the addresses; `pnpm demo <tools>` starts SOS and selected ordinary tools with a private memory store and frozen `2026-10-07T09:00:00Z` business clock. `ORGTIK_DEMO_PORT_OFFSET` selects unused ports. Sign in through SOS with the existing synthetic accounts documented in `mock/README.md`; this guide does not reproduce credentials.

The launcher stages its own source and dependencies. Warm the target auth page before minting its short-lived one-use handoff. The native handoff exchanges the code for a current signed person/workspace/tool context. A purchase, trial or assigned seat opens the actual tool; a new customer receives an empty workspace.

The [Suite](https://orgtik-suite-sos.vercel.app), [Website](https://orgtik-suite-website.vercel.app) and [internal Website Manager](https://orgtik-suite-wm.vercel.app) use existing hosted resources. Do not reset hosted data or advance its clock to reproduce a local scenario. Deployment health/login checks do not establish production business/provider acceptance.

Historical `/presentation` pages are isolated references, absent from ordinary navigation. Demo Panel/persona/state selectors cannot authorize native records or permissions. Acceptance uses genuine source rows, actual readonly actors and controlled transport failures in owned local browser contexts.

## Ordinary screen map

| Tool | Main ordinary surfaces | Native ownership and connections |
| --- | --- | --- |
| Tasks | Dashboard, My tasks, project list/board/timeline, inspector, tool Admin | Tasks/templates/labels/rules/time; pinned Files and current Chats/HR connections. |
| Account | Home, tools, team, usage, account settings, billing, product help | Canonical identity/membership/capacity, person preferences, guarded actions and owner-domain projections. |
| HR | Employees, self-service/directory/My team, attendance, leave, payroll, recruiting, reports, Admin | Employee-owned records/current directory; actual onboarding Tasks, guarded Files and hire/departure custody. |
| CRM | Contacts/companies/projects/pipelines, activity/reports, service catalog/delivery, Admin | Canonical contact/consent; real follow-up Tasks, immutable quote samples, actual won/customer workspace and paid-service receipt. |
| Chats | `/hq/office`, conversations, meetings, whiteboard, settings/setup/Admin | Native history/membership, original-operation recovery, actual Tasks, pinned Files/vector boards and bounded anonymous meeting lobby. |
| Files | Library/folders/detail, shared/starred/recent/trash, protected share/request entry, Admin | Immutable packaged bytes/versions, per-person ACL, comments/quota and protected visitor sample submission. |
| Marketing | Current project dashboard, campaigns/email, social inbox/queue, journeys, brand/writing, Admin | Fresh canonical CRM references/consent, native leads/results/journey Tasks, explicit local send/analytics/AI samples. |
| OrgTik Console | Billing, software catalog/plans/pricing, workspaces, reports/tickets/staff, releases/setup/ecosystem | Platform staff, software and native financial reducers; actual customer pay-link/invitation and readonly View as handoffs. |
| Website Manager | Content/editor/review, media/forms/analytics/releases, staff settings/catalog mirrors | Internal OrgTik CMS. Guarded CRM/Console owner links; mirrors cannot edit their owners' masters. |

Customer service requests/delivery belong to CRM under D-079. Account exposes the actual customer projection. A paid managed-service order retains its original period/receipt and does not require a second quote. Retired Console service routes explain ownership and link to CRM.

## Connections and authority

Cross-tool controls use current connection state: ready, tool absent, access needed or connector disabled. An absent tool offers its actual trial; an unadmitted member submits a pending access request; a disabled connector links to Administration → Connections. A trial or approved request refreshes the signed grant before source writes.

Customer tool Admin supplies overview, members/seats, roles, settings, connections, import/export, audit and billing, with native tool settings/import. Platform staff administration stays in Console. Existing authority rechecks person, effective actor, workspace, source audience and readonly ceiling, including before replaying a prior success.

CRM owns contact/company masters and service prices, zones/countries, 1/3/6/12-month policy, quantities, bundles/publication. Console owns software lifecycle/prices. Internal Website Manager consumes readonly mirrors. The bounded website purchase-catalog overlay reads published native data; website markup/CSS/design stay frozen and require strict before/after parity.

## Review and handoff

Cycle READMEs/manifests link ordinary functional checks, native six states, source hashes, five catalogs and EN/AR × light/dark ×390/768/1024/1440 captures. Diagnostics, failed harness attempts and superseded captures are excluded. Shared reports are not independent end-to-end assertion totals.

The [P5 evidence policy](audits/v3-p5/evidence-policy.md) and criterion register preserve all407 original IDs/details. Individual dispositions identify accepted v3 mock behavior, external deferral, retained frozen contract, superseded owner/policy or functionality outside the adopted scope. Reviewed finding count does not mean new-feature or production-acceptance count.

D-071 immutable Files and D-072 board/version/CAS/custody remain mandatory. D-073 financial bytes stay unchanged; narrow actual-screen adapters and the documented lossless checkpoint codec preserve existing money/session/journal rules.

Ordinary UI uses current signed owner APIs. Shared useSuite/SuiteFrame collects visible native source links and current person preferences; owner adapters validate actual writes and relations. Synthetic demoRequest bridges remain isolated historical walkthroughs.

Future production work can follow these source/receipt/access contracts. External delivery/media/storage/conversion, production scheduling, security/regulatory hardening and native-language editorial review are separate. Optional Figma-from-code is outside required P5 unless requested.
