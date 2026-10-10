# Account P4 and adaptive Home

Account source: `e00b489`, `057a9e4`, `90845e0`, `3f19548`, `ee438e6` and `f05bbf6`. The package owns `apps/sos`, `mock/apps/sos/workspace-features.js`, and this evidence directory. The shared authority adapters, UI library, ecosystem feeds, frozen financial reducers, other tool checkouts and website are root-owned. Final source/contract references and accepted captures are recorded in `manifest.json`.

The ordinary Account uses the adopted DS v2 frame, graphite surfaces, violet actions, aubergine rail, Montserrat headings and IBM Plex body text. Native SOS URLs have no locale prefix. The shared frame supplies exactly one search and notification control. `/presentation` is absent from navigation. Business data comes from the current identity, workspace and owner-domain APIs.

## Tier A placement

| Commitment | Ordinary route and behavior |
|---|---|
| R3-USR-01 | `/account/security`: person-scoped 2FA enrollment/recovery preview, workspace policy preview, explicit simulated tag and displayed mock verification code. Actual authentication strength is unchanged. |
| R3-USR-02 | `/team`: retained ownership dialogue, current eligible successor, existing request reference/recovery and actual role change. The source owner's seats remain unchanged. Leave/delete continue to enforce ownership and invoice protections. |
| R3-USR-03 | `/account/audit`: actual scoped workspace records, search and View-as filter, real actor/effective identity and start/exit records supplied by the root adapter. |
| R3-USR-04 | `/usage`: actual admitted-tool usage, current purchased/assigned seats, metered limits and other plan limits. No invented client metrics. |
| R3-USR-05 | `/account/data`: structured visible tool exports/snapshots plus actual profile, preferences, notifications and scoped audit; administrators receive team/configuration, owners receive billing/invoices/contacts/refund requests. Credentials and key hashes are excluded. No regulatory/compliance claim. |
| R3-USR-06 | `/account/setup` and first-run Home: checklist derived from actual profile, membership, subscriptions, billing and first task; persisted person-scoped dismissal. |
| R3-USR-07 | `/billing/invoices/:id`: actual invoice document and native Print or save PDF action. `/billing/contacts` persists owner-only contacts. |
| R3-USR-08 | `/team`: actual current people/invitations, search, purchased capacity, reservation/assignment state and existing invitation delivery/recovery controls. |

## Platform Tier B

Security includes simulated email verification and SSO settings plus actual realm session lists and sign out all. Integrations save explicitly mock API-key scope/revocation metadata and webhook configuration/test receipts. Keys reveal their mock secret once and store a redacted list; no key authenticates a real API and webhook tests send no external request.

Preferences persist on the current real person. In-app/category notification choices affect the ordinary shared bell and Home feed; re-enabling returns the same source notices. Email/desktop choices remain labeled mock configuration. A menu theme choice, Arabic language and compact density follow the actual signed Account-to-Tasks handoff.

Team adds bulk invitations with genuine per-row outcomes and stable batch references, canonical custom roles and actual suspension/restoration. Guarded effects use `actions.execute`, supplied by the root boundary. Owner/self protections, capacity checks and membership epochs remain authoritative.

`/account/danger` creates and selects a second empty workspace, leaves the selected membership, and deletes the current personal account with its exact email and current password. Ownership and actual outstanding invoices are protected. Leaving the last workspace opens `/account/identity`, which consumes `/api/auth/account` and preserves actual session/workspace/create/delete controls. Password input is transient and never stored in the configuration module or evidence.

Invoice refund requests persist as pending mock requests against an actual paid invoice and available balance. Subscription pause uses the actual period-end cancellation action; win-back resumes that same renewal. The existing cancellation review exposes connected-tool consequences and current-tool export. No provider refund, payment or discount is claimed.

`/product/help`, `/product/status`, `/product/changelog`, `/product/announcements` and `/product/feedback` use ordinary product projections. Help is localized guidance; status describes actual mock access, releases/announcements show only existing visible publication records, and feedback persists with the current actor. Empty publication collections stay honest.

The existing customer service route also consumes the actual CRM-delivery projection. Its download uses the returned signed `contentPath` with current token/workspace headers; a paid-service customer member receives real packaged PDF bytes without a Files seat.

## Adaptive Home and connections

Home lists only admitted tools with actual plans/state and signed launch links. A new workspace has real first-tool/setup controls. Multiple-tool workspaces have real waiting/activity feeds and connection cards. Tool activity links preserve the exact record path through the signed launch route; internal account-setting logs remain in the workspace audit. Missing tools expose owner trials or current-person access requests. `/tools` exposes the same ordinary action; `/team` administrators approve or decline the persisted request and assignments respect capacity. `/connections` saves real connector enablement. Cancellation review includes actual connection impact and export.

There are **142 passing browser/API assertions and 44 accepted captures** across the nine reports. The final Home recapture includes the real Tasks activity projection and translated Free-plan state.

## Verification

The harness uses an owned offset500 demo (`tasks,files,sales`) with a frozen workspace clock and in-memory journal/accounts. Synthetic proof records are arranged through ordinary APIs; no production data, other demos or external services are changed. Authentication timestamps still reflect the real session clock.

- SOS typecheck and production build pass; ordinary Account, usage, connections, help, contact and identity routes are emitted.
- `i18n:check` passes for all ten SOS catalog groups and EN/AR/DE/FR/IT keys/placeholders.
- Existing authority/team/mailbox and shared suite endpoint regressions pass, including real View-as exit, last-workspace identity access and notification preference projection.
- `functional.json`: ordinary security, scoped export, billing, pause/resume, team roles/suspension/bulk, connections, usage, Home, product and onboarding flows.
- `lifecycle.json`: first tool, actual preference handoff, second workspace, ownership, leave-last, identity deletion and sign out all.
- `access.json`: member requests, actual owner approval/decline and narrower member export.
- `services.json`: actual customer PDF download with no Files seat and no asset keys in the customer projection.
- `states.json`: loading, empty, error, forbidden, read-only and success from real pending/failing requests or current authority, without Demo Panel state overlays.
- `visual.json` and `catalogs.json`: EN/AR × light/dark × 1440/390/768/1024, plus DE/FR/IT at1024. Zero document overflow, direction/theme failures, critical/serious axe findings or page exceptions.
- `workspace-gates.json`: actual server-signed staff authentication state tests a missing-workspace chooser and actual ownership/member identity eligibility; no business fixture data is supplied to the frontend.
- `preferences-effect.json`: actual bell/Home/category effects, exact source notice restoration, tool activity, ordinary mock-key revocation and setup dismissal, with application console errors checked.

The harness warms auth before minting handoff codes and waits for intended component content. Earlier timeout/locator probes are excluded from accepted captures. Success states survive retained-data refreshes; verification inputs clear before the action and remain disabled during it. Usage/connections show genuine loading/error states while shared bootstrap data is unavailable. The final visual review preserves the adopted world and finds no material hierarchy, RTL, theme or mobile obstruction. Disposition: **ship** for this ordinary frontend/mock Account scope; provider behavior remains explicitly simulated.

Run `$env:ORGTIK_DEMO_PORT_OFFSET='500'; pnpm demo tasks,files,sales`, then `node program/audits/v3-p4-account/verify.mjs <mode>`. Modes are functional, lifecycle, services, access, states, visual, catalogs, preferences-effect and workspace-gates. No deployment or PR is created by this package.
