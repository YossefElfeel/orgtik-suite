# OrgTik v3 ordinary-screen feature map

The original 72 commitment IDs and titles are preserved. The current implementation uses signed ordinary routes and native owner-domain mock records under D-075/D-076. Historical presentation routes remain isolated references and are absent from ordinary navigation. This map specifies frontend/mock behavior, its tool-cycle evidence and remaining external boundaries; it does not imply production providers or acceptance of every broader historical benchmark.

## Tasks

Evidence: [ordinary cycle](audits/v3-p4-tasks/README.md).

| ID | Original commitment | Ordinary entry | Native behavior | Limits |
| --- | --- | --- | --- | --- |
| R3-TASKS-01 | Filters + search across tasks | Project list and My tasks | Current visible task query, assignee/priority/date/label filters, saved views and shared source search. | No production search service. |
| R3-TASKS-02 | Reminders/overdue alerts + watchers | Task inspector | Stored watchers and reminder settings create actual local notification receipts; overdue uses workspace time. | External email/push delivery deferred. |
| R3-TASKS-03 | Recurring tasks | Task inspector and completion | Current stored recurrence produces the next native task once on completion. | Production scheduling remains separate. |
| R3-TASKS-04 | Templates | Task inspector and quick add | Three sample templates plus persisted save/reuse, with actual task fields and owner checks. | No cross-provider template import. |
| R3-TASKS-05 | Files attach | Task inspector → Attach from Files | Current Files permission, source audience and exact workspace/file/version reference; open resolves protected bytes. | Approved packaged assets; arbitrary uploads deferred. |
| R3-TASKS-06 | Labels | Project list and task inspector | Current label picker/filter and persisted task labels. | Prototype workspace label contract. |
| R3-TASKS-07 | CSV import/export | Project toolbar → Import / Export | Text CSV mapping, per-row errors/outcomes and filtered RFC4180 export of native rows. | Arbitrary binary and external Asana/Trello import deferred. |
| R3-TASKS-08 | Quick add + bulk edit | Project toolbar and list | Native quick add, selection and bulk outcomes; blocked dependencies remain enforced for board moves. | No fabricated client-only task IDs. |

## HR

Evidence: [ordinary cycle](audits/v3-p4/hr/README.md).

| ID | Original commitment | Ordinary entry | Native behavior | Limits |
| --- | --- | --- | --- | --- |
| R3-HR-01 | Offboarding + equipment | /employees/:id → Offboard | Retained departure flow preserves identity, source custody, equipment and settlement records. | Payroll/provider execution is simulated. |
| R3-HR-02 | Leave policies/accruals + own balances | /people/policies, /calendar/leave-balances and tool Admin | Actual leave policy/accrual/balance projection, employee request/cancel and manager approval. | No legal payroll-compliance claim. |
| R3-HR-03 | Self-service profile + directory | /people/profile, /people/directory, /people/team | Current canonical employee profile/directory and approved contact/bank change requests; private salary stays guarded. | External email is a local mailbox sample. |
| R3-HR-04 | Bulk import | /people/import | CSV mapping/validation stores actual employee records and pending native invitations with bounded outcomes. | Seat assignment remains explicit; arbitrary XLSX upload deferred. |
| R3-HR-05 | Bank files CH/UAE + currency per employee | /payroll and employee editor | Current employee currency and recorded payroll export produce explicit CH/UAE sample formats. | Bank submission/provider/regulatory acceptance deferred. |
| R3-HR-06 | Onboarding checklists as Tasks | /people/onboarding | Current source employee creates exact native Tasks in eligible projects/sections, with original operation recovery. | External reminder delivery deferred. |
| R3-HR-07 | Document expiry reminders | /people/documents and employee detail | Stored document expiry and current source reminders use packaged immutable Files references. | Arbitrary document uploads deferred. |
| R3-HR-08 | Email notifications | /people/mailbox and HR activity | Actual mock notifications/mailbox records for the scoped HR events, with current recipient permissions. | No real email provider. |

## Files

Evidence: [ordinary cycle](audits/v3-p4-files/README.md).

| ID | Original commitment | Ordinary entry | Native behavior | Limits |
| --- | --- | --- | --- | --- |
| R3-FILES-01 | Attach in Tasks/Chats | /file/:id and native Tasks/Chats pickers | Current source permissions and pinned file/version references resolve the original immutable content. | Arbitrary uploads deferred. |
| R3-FILES-02 | Version history + upload new version + name clash | /file/:id → Versions | Packaged new versions, conflict resolution, keep-both/replace/restore, retaining exact historical bytes and custody. | No arbitrary upload/conversion provider. |
| R3-FILES-03 | Notify on share | /file/:id → Sharing | Canonical per-person grant and actual source recipient notification with exact deep link. | External email/push deferred. |
| R3-FILES-04 | Per-person access | /file/:id → Access | Effective view/comment/edit grants, inherited/protected source ACL, removal and readonly ceilings. | No client-side permission authority. |
| R3-FILES-05 | Storage quota | / and /admin/settings | Current retained byte usage, storage policy, warnings and admission-time blocking for new samples/versions. | Packaged-assets quota is the prototype safety contract. |
| R3-FILES-06 | Bulk select + drag move | / and folder routes | Native selection, drag/destination move and per-item conflict outcomes; archive/restore keep identities. | ZIP/provider storage extensions outside scoped evidence. |
| R3-FILES-07 | Comments | /file/:id → Comments | Actual attributed source comments under current grant/read-only rules. | Live external notification delivery deferred. |
| R3-FILES-08 | One search with filters + sort | / and /my-files | Current-visible file/folder query, type and order, native saved views, actual suite search/activity. | No external index. |

## CRM

Evidence: [ordinary cycle](audits/v3-p4-crm/README.md).

| ID | Original commitment | Ordinary entry | Native behavior | Limits |
| --- | --- | --- | --- | --- |
| R3-SALES-01 | Follow-up tasks via Tasks | /customers/:id and projects → Follow-up | Actual source-owned Task creation in native project/section and exact retained relation. | External reminders deferred. |
| R3-SALES-02 | Import/export/bulk | /customers and CRM toolbar | Current native CSV import/export and per-row assignment/stage/delete outcomes. | No arbitrary provider import. |
| R3-SALES-03 | Deal board with editable stages, probability, forecast | Customer/project pipeline routes | Owner-configured pipelines/stages, probabilities and forecast from current native deals. | No external revenue prediction. |
| R3-SALES-04 | Contact timeline + logging | /customers/:id → Activity | Current notes, call/email/meeting logs, offers and stage events in one source timeline. | Call/WhatsApp/email actions are explicit simulations. |
| R3-SALES-05 | Lead routing + simple automations | /admin/settings and current leads | Stored lead routing and bounded source rules apply to current native records. | Provider automation deferred. |
| R3-SALES-06 | Offer PDF/validity/e-sign | Offer detail and compatibility constructor | Immutable authenticated offer PDF, validity and explicit local signature; retained price/contract semantics stay intact. | Real e-signature/regulatory acceptance deferred. |
| R3-SALES-07 | Companies, custom fields, tags | /companies, /customers, /admin/settings | Actual company masters, typed fields/tags and prospect duplicate merge, without copied Marketing masters. | No production CRM synchronization provider. |
| R3-SALES-08 | Targets + funnel/source/lost-reason reports | /reports and targets | Native target/progress, stage/source/lost-reason projections from visible CRM records. | Historical contracts keep their preserved money semantics. |

## Chats

Evidence: [ordinary cycle](audits/v3-p4/chats/README.md).

| ID | Original commitment | Ordinary entry | Native behavior | Limits |
| --- | --- | --- | --- | --- |
| R3-CHATS-01 | Stored history | /hq/chat/:id | Current native channels/messages/history, exact source scope, immutable retries and reload recovery. | Production real-time gateway is deferred. |
| R3-CHATS-02 | Files sharing | /hq/chat/:id and call/board detail | D071 exact pinned Files references and protected packaged previews; D072 real vector board versions/CAS. | Arbitrary media uploads deferred. |
| R3-CHATS-03 | Desktop/email notifications | Shared bell, /hq/chat/catch-up and settings | Current source notices and personal reminders are native records, with visible local delivery semantics. | Desktop push and real email remain deferred. |
| R3-CHATS-04 | Calls with real media | /hq/meetings/:id/call and office huddles | Signed host/participant controls, actual anonymous guest lobby/admission and source-owned recording state. | Real microphone/camera/screen transport is explicitly simulated. |
| R3-CHATS-05 | Create task from message | Message → Create Task | Current source-aware native Tasks picker and audience check, verified link and actual Tasks handoff. | No synthetic demo-bridge Task. |
| R3-CHATS-06 | Rich text | /hq/chat/:id → Formatted message | Shared RHF/Zod rich editor saves source content; original body and operation survive uncertain responses. | Prototype rich-content format; no external editor service. |
| R3-CHATS-07 | Browse/join channels | /hq/chat/:id → Browse public channels | Current discovery and actual public membership; private/DM history stays guarded. | No public client-channel expansion. |
| R3-CHATS-08 | Scheduled messages, remind me, save for later | Message controls and catch-up | Stored workspace-zone scheduled message, explicit sample delivery, personal save/reminder and current source receipts. | External timed delivery deferred. |

## Marketing

Evidence: [ordinary cycle](audits/v3-p4-marketing/README.md).

| ID | Original commitment | Ordinary entry | Native behavior | Limits |
| --- | --- | --- | --- | --- |
| R3-MARKETING-01 | CRM sync + attribution | Current project campaign and CRM contact selector | Fresh canonical CRM references/consent and guarded campaign/page lead attribution; no duplicated contact masters. | Live CRM provider sync deferred. |
| R3-MARKETING-02 | Consent/unsubscribe + delivery stats | Campaign audience and send controls | Unknown/opted-out suppression, current opt-in provenance and fresh approval/template checks before native mock delivery. | External email tracking/delivery is simulated. |
| R3-MARKETING-03 | Campaign results | Campaign → Results | Current CRM lead/deal outcomes and currency-separated estimates; deterministic mock engagement is visibly labelled. | Production tracking/pixel providers deferred. |
| R3-MARKETING-04 | RTL email designer | Campaign email editor | Shared RTL-safe design blocks, current brand kit, export and actual native approval state. | Email renderer/provider delivery deferred. |
| R3-MARKETING-05 | Social inbox | Social inbox | Native source thread/reply state with an explicitly local send. | Real Facebook/Instagram providers deferred. |
| R3-MARKETING-06 | Posting queue + drag reschedule | Posting queue and calendar | Stored native order/time, drag/move schedule and re-approval gates when content changes. | Provider posting and real best-time analytics deferred. |
| R3-MARKETING-07 | Simple journeys | Campaign journey | Current ready/approved source steps and actual source-owned Tasks in eligible project/section; exact operation receipts. | Provider-triggered automation deferred. |
| R3-MARKETING-08 | AI writing with brand kit | Writing and brand kit | Persisted native brand guidance and labelled deterministic writing samples. | No real AI provider claim. |

## Website Manager

Evidence: [ordinary cycle](audits/v3-p4-wm/README.md).

| ID | Original commitment | Ordinary entry | Native behavior | Limits |
| --- | --- | --- | --- | --- |
| R3-WM-01 | Publish updates the site | /content/pages/:id → Review / Publish | Actual CMS draft/review publication and runtime website reload with last-known-good fallback. | Website markup/CSS/design remain frozen; public Arabic launch deferred. |
| R3-WM-02 | Real analytics | /overview → Analytics | Source-owned deterministic local analytics samples, clearly labelled. | Real traffic provider deferred. |
| R3-WM-03 | Reviewer/lead notifications | Shared staff bell and content review | Actual owner/reviewer/lead projections and guarded CRM launch for the current effective staff person. | External delivery deferred. |
| R3-WM-04 | Form spam protection | Public form endpoint and form settings | Retained bounded spam rules/rate outcomes with explicit local source records. | Production anti-abuse acceptance deferred. |
| R3-WM-05 | Media tags + bulk upload + replace | /media | Packaged asset tags, bounded batch/replace operations preserve references/uses. | Arbitrary upload and conversion provider deferred. |
| R3-WM-06 | Responsive images | /media and native editor preview | Current packaged responsive renditions/focal metadata and editor preview. | Website markup/srcset redesign and arbitrary image service deferred. |
| R3-WM-07 | AI translation drafts into review | Entry → Translation draft | Explicit deterministic translation draft goes through the actual review/publication gate. | Real AI translation provider deferred. |
| R3-WM-08 | Release bundles | /releases | Native retained release versions, review/four-eyes policy and guarded rollback to published content. | No invented snapshot or website-design replacement. |

## OrgTik Console

Evidence: [ordinary cycle](audits/v3-p4-console/README.md).

| ID | Original commitment | Ordinary entry | Native behavior | Limits |
| --- | --- | --- | --- | --- |
| R3-ADM-01 | Dunning retries + emails + card-expiry warnings | /billing | Current native failed invoices, policy, retry pause/recovery, local dunning/card-expiry notices. | Live gateway/email deferred; existing financial reducers preserved. |
| R3-ADM-02 | Invoice PDF + series per entity | /billing and invoice document | Immutable invoice PDF bytes and per-entity/year number series from native issued snapshots. | Regulatory e-invoicing deferred. |
| R3-ADM-03 | Edit a single subscription | /workspaces/:id → Subscription line | One exact line uses native server preview/confirm, quantity/plan/cycle/cancel/resume and original attempt recovery. | Existing quotation/proration policies retained. |
| R3-ADM-04 | SaaS metrics | /reports | Current native recurring MRR, actual source movement deltas and cohorts, with scoped CSV. | Historical trend data is not fabricated. |
| R3-ADM-05 | Tax IDs + ZATCA | /tax/checks | Explicit UID/VAT mock checks and labelled regulatory preview. | Live VIES/ZATCA/ETA/submission deferred. |
| R3-ADM-06 | Pay-by-link | /billing → Pay link and Account /billing/pay/:id | Actual current invoice/owner/link/method and exact replay/revocation guards. | Payment provider remains mock. |
| R3-ADM-07 | CSV/accounting exports | /billing and /reports → Export | Native invoice/payment/credit/accounting rows and formula-safe CSV. | Real accounting connector deferred. |
| R3-ADM-08 | Staff 2FA + full audit log | /staff/security and audit | Mock staff 2FA configuration plus current actual staff action/read-only audit projections. | Authentication-strength/identity hardening deferred. |

## Account

Evidence: [ordinary cycle](audits/v3-p4-account/README.md).

| ID | Original commitment | Ordinary entry | Native behavior | Limits |
| --- | --- | --- | --- | --- |
| R3-USR-01 | 2FA per person + workspace rule | /account/security | Person-scoped local 2FA enrollment/recovery/policy previews with explicit mock code. | Real authentication-strength changes deferred. |
| R3-USR-02 | Transfer ownership | /team → Transfer ownership | Actual eligible successor, existing stable command and native ownership change. | Frozen seats and financial behavior retained. |
| R3-USR-03 | Workspace audit log incl. view-as | /account/audit | Current workspace activity/filter and true actor/effective identity including View as start/exit. | Prototype audit retention contract. |
| R3-USR-04 | Usage and limits page | /usage | Current admitted-tool usage, purchased/assigned capacity and metered limits. | No fabricated provider usage. |
| R3-USR-05 | Data export (nFADP/GDPR) | /account/data | Structured current-visible owner-domain records with secrets/hashes excluded. | No regulatory-compliance or full production archive guarantee. |
| R3-USR-06 | Onboarding checklist | /account/setup and adaptive Home | Checklist derives from actual membership/lines/billing/source records, with person-scoped dismissal. | No fake presentation onboarding state. |
| R3-USR-07 | Invoice PDF + billing contacts | /billing/invoices/:id and /billing/contacts | Actual document/print-PDF and guarded native billing contacts. | External receipt email deferred. |
| R3-USR-08 | Team basics | /team | Canonical native membership/invitations/capacity, bulk outcomes, custom roles and suspension/recovery. | External invitation delivery remains local mailbox. |

## Approved Tier B and shared ownership

| Owner | Ordinary additions | Evidence |
| --- | --- | --- |
| Tasks | Timeline/Gantt, typed custom fields, bounded native rules, source time tracking, project archive and actual first-run sample project. | [Cycle](audits/v3-p4-tasks/README.md) |
| HR | Employee/manager self-service, web clock and correction→payroll, reviews/goals, careers/scorecards/offer→Hire, country holiday sets, letters and headcount/turnover reports. | [Cycle](audits/v3-p4/hr/README.md) |
| Files | Current Shared with me/starred/recent, retention-based due purge, protected write-only sample request links and immutable packaged sheet/slide PNG previews. | [Cycle](audits/v3-p4-files/README.md) |
| CRM | Actual call/email/meeting logs, multiple pipelines, duplicate merge, targets/funnel, explicit local WhatsApp/click-to-call. | [Cycle](audits/v3-p4-crm/README.md) |
| Chats | Actual sample typing/read receipts, @channel/@here audiences, native polls, simulated voice and bounded anonymous meeting guest lobby across browsers. | [Cycle](audits/v3-p4/chats/README.md) |
| Marketing | Fresh canonical CRM contact browse/reference/consent, native sender/domain mock verification and self-test delivery receipts. | [Cycle](audits/v3-p4-marketing/README.md) |
| Website Manager | Source draft autosave with revision conflict handling, element comments and bounded signed webhook configuration/test logs. | [Cycle](audits/v3-p4-wm/README.md) |
| OrgTik Console | Current source MRR movements/cohorts/CSV, actual registered staff invitations, ticket SLA configuration and current-visible global search. | [Cycle](audits/v3-p4-console/README.md) |
| Account | Mock email verification/SSO/API-key/webhook settings, actual session list/sign-out, notification preferences, bulk invites/custom roles/suspend/leave, second workspace/personal deletion, refund request/pause/win-back and product help/status/release/feedback surfaces. | [Cycle](audits/v3-p4-account/README.md) |

All tools use the shared SuiteFrame, current access/connector states, eight owner-aware Admin sections, data-derived first run, native loading/empty/error/no-access/readonly/success evidence, five catalogs and the adopted EN/AR × light/dark ×390/768/1024/1440 matrix. CRM owns services and delivery; Console owns software and platform operations; internal Website Manager exposes readonly mirrors and actual guarded owner handoffs. Account/Home adapts to the current admitted tool set.

Payments, email/push, AI, analytics, social delivery, signatures, calls, regulatory submission, arbitrary uploads and public Arabic website release remain explicit Tier C boundaries. Existing D-073 financial bytes, D-071 pinned Files and D-072 vector board CAS/custody are retained.
