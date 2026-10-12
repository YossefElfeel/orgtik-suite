# OrgTik prototype: 72-feature implementation map

Presentation reference, 2026-10-08, under [D-073](decisions/D-073.md). The 72 IDs and titles below come from `backlog/release-packages.csv`; none are removed or renumbered. This map describes visible UI/mock behavior, not production readiness. Fifteen local walkthroughs now have scoped UI coverage with explicit limits; this is not full backend or hosted acceptance. Validated merge baseline `0337413` is through PR38; local UI/mock delivery is closed in A34; backend/hosted acceptance remains deferred. Vercel is paused.

**Status language:** `Local` means the screen/action exists with scoped local evidence; it does not establish complete feature acceptance. `Retained` means an earlier working surface is reused. `Partial` identifies a missing part of the promised interaction. `Focused verification` distinguishes source from accepted UI behavior; external capability stays separate. Live providers, arbitrary binary uploads, real media and regulatory submissions remain external deferrals.

All presentation screens inherit the shared six states: loading, empty, error/retry, no access, read-only and success. Demo persona/state switches simulate presentation, while the existing signed-in session still controls actual retained tool access. Five catalogs and representative EN/AR, light/dark, 1440/390 captures are package evidence; final cross-tool acceptance is separate.

## Shared mock contract

`tools/demo/connections.cjs` is a separate memory-only synthetic-record service. Requests carry `workspace` and `persona`; responses are `{simulated:true,data}`. Existing accounts, invoices, CMS content and identity/session stores remain separate. Presentation routes currently expose task/lead lists and creation, notifications/read, search, workspace sample Files, batched onboarding tasks and presentation-only reset. Tasks/Files/Chats/HR and campaign/WM/Sales connections have local golden evidence. Remaining focused feature detail acceptance is identified per row.

Client adapters use `DemoRuntime` and `demoRequest` from `packages/ui/src/demo/connections.ts`. Local-only tools use the record models listed below, with fixed demonstration dates. Contracts in the table are the **reference record/action shapes**, not claims that a new HTTP endpoint exists. A real backend is a future development requirement; no new backend/security work is authorized by this map.

## Tasks

Screen: `/[locale]/presentation`, sidebar **Presentation workflow**. Source: `apps/tasks/components/presentation/TasksPresentation.tsx`; records: `apps/tasks/lib/presentation-tasks.ts`. Retained attachment source: `apps/tasks/components/task/FilesPicker.tsx` and `apps/tasks/lib/file-references.ts`.

| ID | Exact commitment | Screen/action and status | Deterministic mock contract | Future backend requirement | External deferral |
|---|---|---|---|---|---|
| R3-TASKS-01 | Filters + search across tasks | Local query/status/owner/label/priority and overdue/next-seven/undated filters; suite search; Tasks depth22/eight captures | `PresentationTask[]` + `{query,status,owner,label,priority,dueFilter}` → filtered rows | Scoped indexed list/search with pagination | None |
| R3-TASKS-02 | Reminders/overdue alerts + watchers | Local editor recipients preview/watchers; overdue date styling; delivery partial | `{taskId,due,watchers[],reminder}` → preview recipients | Schedule due reminders and maintain subscriptions | External email/desktop delivery |
| R3-TASKS-03 | Recurring tasks | Local weekly/monthly next occurrence on completion | `{recurrence,due,status}` → next task; month-end clamp | Stable recurrence series and scheduler | None |
| R3-TASKS-04 | Templates | Local: three presets plus save/reuse own template;11 focused UI checks | Template → editable task/watchers/weekly reminder | Store/reuse workspace templates | None |
| R3-TASKS-05 | Files attach | Retained actual picker plus verified workspace/versioned presentation references; final-tools coverage | `{workspace,fileId,versionId}` reference on task | Persist versioned references and resolve previews | Arbitrary binary uploads |
| R3-TASKS-06 | Labels | Local editor/filter label field | `{taskId,label}` update | Workspace label catalog and task-label relation | None |
| R3-TASKS-07 | CSV import/export | Local text → mapping → review → result; filtered export | CSV ≤200 rows/100 KB → validated tasks; RFC4180 output | Import jobs/errors and scoped export | Arbitrary binary uploads |
| R3-TASKS-08 | Quick add + bulk edit | Local quick add, edit priority, selected status/priority, complete/assign; Tasks depth22/eight captures | `{title,owner,priority}` create/edit; `{ids[],status,priority}` bulk | Batched edits with per-record results | None |

## HR

Screen: `/[locale]/presentation`, **People presentation**; source: `apps/hr/app/[locale]/(dashboard)/presentation/page.tsx`, `apps/hr/components/presentation/`, records `apps/hr/mock/presentation.ts`, types `apps/hr/types/presentation.ts`. Retained offboarding: `apps/hr/components/sheets/EmployeeOffboardingSheet/index.tsx`; retained leave: `/[locale]/time-off`, `/[locale]/calendar`.

| ID | Exact commitment | Screen/action and status | Deterministic mock contract | Future backend requirement | External deferral |
|---|---|---|---|---|---|
| R3-HR-01 | Offboarding + equipment | Retained immediate offboarding, successor ownership, equipment/final-pay UI; J15 six steps; owned record reassignment not asserted by empty fixture | `{employeeId,effectiveAt,transfer}` + action records | Maintain employment/access transition and custody records | External payroll/equipment systems |
| R3-HR-02 | Leave policies/accruals + own balances | Local policy/balances; retained approval/calendar | `{annual,carry,accrual}` + employee taken days → fixed-date balance | Persist policies/accrual ledger and approved leave | None |
| R3-HR-03 | Self-service profile + directory | Local profile request → approve/reject; retained employee directory | `{employeeId,email,phone,status}` → approved profile/mail preview | Profile change requests and directory projection | External mail |
| R3-HR-04 | Bulk import | Local source/mapping/review/result | CSV ≤100 rows/100 KB; name/email/CHF-or-AED → employee rows | Import jobs, duplicate outcomes and identity matching | Arbitrary binary uploads |
| R3-HR-05 | Bank files CH/UAE + currency per employee | Local payroll sample CSV/download; retained payroll currency | Employee salary/currency → `NOT-FOR-BANK-SUBMISSION` sample | Country-specific approved payroll export | Bank submission/regulatory certification |
| R3-HR-06 | Onboarding checklists as Tasks | Current HR-directory identity/currency reference → three connected mock Tasks → exact Task; J7 nine steps incl. retained leave/approved calendar | `{employeeId,tasks:[{sourceId,title,owner}]}` → bridge task IDs | Persist onboarding templates/tasks and progress | External notifications |
| R3-HR-07 | Document expiry reminders | Local fixed-date expiry list/send reminder | `{employeeId,documentExpiry}` → expiry mailbox preview | Expiry schedule and document records | External email |
| R3-HR-08 | Email notifications | Local approval/onboarding/expiry mailbox | `{id,employeeId,subjectKey}` → simulated message | Templates, recipients and delivery history | Live email provider |

## Files

Screen: `/[locale]/presentation`, **Presentation workflow**. Source `apps/files/components/presentation/FilesPresentation.tsx`; model `apps/files/lib/presentation-files.ts`; samples `apps/files/public/presentation/`. Earlier authorized pickers and structured whiteboards remain the reference for versioned cross-tool records.

| ID | Exact commitment | Screen/action and status | Deterministic mock contract | Future backend requirement | External deferral |
|---|---|---|---|---|---|
| R3-FILES-01 | Attach in Tasks/Chats | Retained pickers plus verified workspace/versioned scene references; historical v2 stays pinned after v3 with five byte-exact checks | `{workspace,fileId,name,version,source}` → task/message reference | Shared Files record/reference API | Arbitrary binary uploads |
| R3-FILES-02 | Version history + upload new version + name clash | Local packaged versions, rename collision/keep-both, duplicate | File `versions[]`; `{name,folder}` collision resolution | Version metadata/storage and conflict handling | Arbitrary binary uploads |
| R3-FILES-03 | Notify on share | Local sharing notice plus verified shared presentation feed/deep link; external delivery deferred | `{fileId,person,permission,notify}` → simulated notice | Sharing events and recipient delivery | External email/desktop provider |
| R3-FILES-04 | Per-person access | Local view/comment/edit preview and remove access | `shares:[{person,permission}]` | Persist access records and effective permissions | None |
| R3-FILES-05 | Storage quota | Local standard/full usage and blocked add/version | Sum packaged file sizes vs limit | Usage accounting and limit feedback | Arbitrary binary uploads |
| R3-FILES-06 | Bulk select + drag move | Local selection/keyboard destination/drag move; collision rename | `{ids[],destination}` → moved records | Batched folder updates/results | None |
| R3-FILES-07 | Comments | Local attributed comments respecting presented role | `{fileId,author,body}` append | Comment threads/history | External notifications |
| R3-FILES-08 | One search with filters + sort | Local name/folder/type and name/size order | `{query,folder,kind,sort}` → list | Indexed metadata search/pagination | None |

## Chats

Screen `/presentation`, **Chats walkthrough**; source `apps/chats/features/presentation/ChatsPresentation.tsx`, records `scene.ts`. Retained conversation/file picker: `apps/chats/features/chat/FilesPicker.tsx`. The scene uses per-workspace tab storage; existing main conversation/history surfaces remain separate.

| ID | Exact commitment | Screen/action and status | Deterministic mock contract | Future backend requirement | External deferral |
|---|---|---|---|---|---|
| R3-CHATS-01 | Stored history | Local per-workspace tab history/channel read state | `ChatScene {channels[],messages[]}` → stored conversation | Durable conversation/history pagination | None |
| R3-CHATS-02 | Files sharing | Verified workspace/versioned Files record picking and opening packaged preview | Message `{fileId,version,workspace}` reference | Shared Files relation/preview resolution | Arbitrary binary uploads |
| R3-CHATS-03 | Desktop/email notifications | Local in-app/mailbox/browser-delivery simulation; external desktop/email delivery deferred | `{messageId,remind,saved}` → simulated notice | Recipient subscriptions and delivery records | Live desktop/email provider |
| R3-CHATS-04 | Calls with real media | Local call stage/mute/end, clearly simulated | `{participants[],muted,stage}` → mock call UI | Media/session transport and call events | Real microphone/camera/media transport |
| R3-CHATS-05 | Create task from message | First bridge connection locally verified; exact Tasks deep link | `{title,owner,sourceApp:chats}` → bridge task ID | Message-task relation and task creation service | External reminders |
| R3-CHATS-06 | Rich text | Shared bold/italic/bullets editor with preserved lines; custom scheduling flow verified | `{body,bold}` → formatted message | Structured rich-text document storage/rendering | None |
| R3-CHATS-07 | Browse/join channels | Local channel browse/join/read-by;11 focused checks plus separate persona/channel5 evidence | Channel `{id,name,joined,read}` update | Channel membership and read cursor | None |
| R3-CHATS-08 | Scheduled messages, remind me, save for later | Local date/time schedule, past-date refusal, send-now/cancel, reminders/saved; structured call/delivery remains simulated | Message `{scheduled,saved,reminder}` update | Scheduled delivery/reminder timestamps and saved records | Live notification provider |

## Sales

Screen `/[locale]/presentation`, **Sales presentation**. Source `apps/sales/app/[locale]/(dashboard)/presentation/page.tsx`; models `apps/sales/mock/presentation.ts`, `apps/sales/types/presentation.ts`; dialogs `apps/sales/components/dialogs/presentation/PrototypeDialog/index.tsx`. Marketing bridge leads land through `?lead=<id>`.

| ID | Exact commitment | Screen/action and status | Deterministic mock contract | Future backend requirement | External deferral |
|---|---|---|---|---|---|
| R3-SALES-01 | Follow-up tasks via Tasks | Verified simulated follow-up Tasks bridge and exact deep link | `{title,owner,sourceApp:sales}` → bridge task ID | Persist deal/contact-task relation | External reminders |
| R3-SALES-02 | Import/export/bulk | Local mapped import/review, export and selection/bulk; shared Stepper controls reused | Exact name/company/email/value/source CSV ≤50 rows → deals | Import jobs and flexible column mapping | Arbitrary binary uploads |
| R3-SALES-03 | Deal board with editable stages, probability, forecast | Local board, stage/probability/forecast editing; coherent package evidence, stage editor creates/renames/reorders configured stages; deeper backend stage migration pending | `{dealId,stage,probability,value}` → forecast | Workspace stage configuration and deal pipeline | None |
| R3-SALES-04 | Contact timeline + logging | Local attributed timeline/notes | `{dealId,actor,event,at}` append | Activity records and linked communications | External communications |
| R3-SALES-05 | Lead routing + simple automations | Local source→owner rule, manual run | `{source,owner,enabled}` → matching assignments | Persist rules and event execution | External CRM provider |
| R3-SALES-06 | Offer PDF/validity/e-sign | Local value-aware mock quotation print/PDF surface, validity and signature; external signature deferred | `{value,currency,validUntil,signedBy}` → simulated offer | Quote snapshots/PDF generation/signature records | Live signature provider |
| R3-SALES-07 | Companies, custom fields, tags | Company/detail/custom-field/tag UI accepted in shared feature-detail 80 scoped checks/23 captures; backend entity persistence pending | `companies:[{id,name,sector,website,notes,tags[],fields{}}]`; deal `companyId` relation | Company entities and configurable field definitions | None |
| R3-SALES-08 | Targets + funnel/source/lost-reason reports | Local target/attainment and grouped reports | Deals + target → counts/forecast/won | Scoped reporting aggregation | Live analytics provider |

## Marketing

Screen `/[locale]/presentation`, **Marketing presentation**; source `apps/marketing/components/pages/presentation/index.tsx`, `model.ts`, `types.ts`. Campaign → bridge Sales lead is the first connected flow; the full campaign/WM/OrgTik Sales loop has business54 local UI evidence.

| ID | Exact commitment | Screen/action and status | Deterministic mock contract | Future backend requirement | External deferral |
|---|---|---|---|---|---|
| R3-MARKETING-01 | CRM sync + attribution | Verified campaign → WM/page → OrgTik Sales/won receipt → Marketing attribution; business54 scoped checks | `{name,source,campaign}` → bridge lead ID | Campaign/page/contact attribution relation and sync | Live CRM providers |
| R3-MARKETING-02 | Consent/unsubscribe + delivery stats | Local opt-in/out, suppressed recipients, preview unsubscribe | `{personId,consent}` + eligible set → stats | Consent history/suppression and delivery events | Live email provider |
| R3-MARKETING-03 | Campaign results | Local deterministic sent/opened/clicked | Eligible recipients → sample sent/opened/clicked | Campaign result ingestion/aggregation | Live analytics/email provider |
| R3-MARKETING-04 | RTL email designer | Local headline/body/CTA/direction and escaped HTML export | Editor record → RTL/LTR preview, `SIMULATED-NOT-SENT` HTML | Store templates/versions and rendering | Live email delivery |
| R3-MARKETING-05 | Social inbox | Local incoming fixture and reply | `{actor,body}` → reply list | Social conversation adapters | Live social provider |
| R3-MARKETING-06 | Posting queue + drag reschedule | Local create/reorder/column/date changes | `{postId,state,at,beforeId/afterId}` update | Queue scheduling and delivery events | Live social delivery |
| R3-MARKETING-07 | Simple journeys | Editable journey add/remove/reorder/delay/dry-run UI accepted in shared feature-detail 80 scoped checks/23 captures; provider execution deferred | `{steps:[{id,type,days}],active,logs[]}` → ordered deterministic run | Journey graph/events/waits/task links | Live email/automation providers |
| R3-MARKETING-08 | AI writing with brand kit | Editable audience/proposition/voice brand-kit mock draft accepted in shared feature-detail 80 scoped checks/23 captures; live AI deferred | `{topic,company,locale,voice,brandAudience,brandProposition}` → template draft | Brand settings/prompt/draft review service | Live AI provider |

## Website Manager

Screens `/[locale]/presentation` (**Website studio**) and retained `/[locale]/content/pages/pg_partners` (**actual CMS**). Source `apps/wm/components/presentation/Studio.tsx`, `model.ts`; actual editor `apps/wm/app/[locale]/(app)/content/[area]/[id]/page.tsx`. OrgTik staff surface: customer purchases remain managed-service requests under D-059.

| ID | Exact commitment | Screen/action and status | Deterministic mock contract | Future backend requirement | External deferral |
|---|---|---|---|---|---|
| R3-WM-01 | Publish updates the site | Retained actual edit/review/publish→website reload and last-good fallback, PR20/21 | CMS page draft/review/published revision → runtime content | Content publication/SEO rebuild coordination | Hosted deployment currently paused |
| R3-WM-02 | Real analytics | Local 1,240 fixture views/form counters, explicitly simulated | Fixed views + local accepted leads → counters | Analytics ingestion/reporting | Live analytics provider |
| R3-WM-03 | Reviewer/lead notifications | Local review notices plus connected OrgTik form/lead/search/feed; business loop verified | `{id,text,read}` → notice list | Publication/review subscriptions and delivery | Live email provider |
| R3-WM-04 | Form spam protection | Genuine/bot simulated outcomes; accepted OrgTik lead/page attribution verified; no spam hardening claim | `{scenario:genuine/bot}` → accepted/blocked | Implement form validation/spam classification after prototype | Live spam provider; production hardening outside scope |
| R3-WM-05 | Media tags + bulk upload + replace | Local packaged add/selected tags/replace/version | Media `{id,source,alt,tags[],version}` | Media metadata/processing/storage | Arbitrary binary uploads |
| R3-WM-06 | Responsive images | Local 320/640/1280 preview of packaged SVG | `{source,width}` → constrained preview | Image variants/optimization/selection | Arbitrary media processing |
| R3-WM-07 | AI translation drafts into review | Local deterministic phrase/fallback draft/edit/review | `{sourceText,locale}` → `{text,state:draft/reviewed}` | Translation draft/reviewer workflow | Live AI provider |
| R3-WM-08 | Release bundles | Local draft→review→approved→published→rollback; actual CMS separate | `{name,items[],state}` → transition/notice | Atomic publishable revision bundles/rollback | Hosted publishing currently paused |

## OrgTik Admin

Screen `/[locale]/presentation`, **Operations presentation**; source `apps/admin/components/presentation/Operations.tsx`, `model.ts`. Retained metrics `/[locale]/reports`, invoices `/[locale]/invoices`, audit `/[locale]/audit`, catalog/launch `/[locale]/tools`, `/[locale]/waitlist`, pricing `/[locale]/pricing` and migrations `/[locale]/migrations` should be demonstrated, not rebuilt.

| ID | Exact commitment | Screen/action and status | Deterministic mock contract | Future backend requirement | External deferral |
|---|---|---|---|---|---|
| R3-ADM-01 | Dunning retries + emails + card-expiry warnings | Local dunning/retry/grace/card-warning/mailbox controls; simulated notices; no actual clock advancement | Invoice `pastDue/paid`, attempts/paused + notices | Dunning schedule, grace administration/delivery | Live payment/email providers |
| R3-ADM-02 | Invoice PDF + series per entity | Fixed PDF/PNG sample plus per-entity series/prefix/number; entity14 checks; issued backend document generation pending | Packaged PDF + `{series,nextNumber}` reservation | Document snapshots and entity series | Regulatory certification |
| R3-ADM-03 | Edit a single subscription | Local seat/unit/currency total, half-cycle delta/read-only recovery | `{seats,unitPrice,currency,status}` → preview | Effective billing changes and proration/migration | Live payment provider |
| R3-ADM-04 | SaaS metrics | Retained `/reports` MRR/revenue/refunds/trials/churn/tool/country breakdown | Report totals + payment USD snapshot rates | Revenue metric definitions/aggregation | Live analytics provider |
| R3-ADM-05 | Tax IDs + ZATCA | Local CH-DEMO-001/SA-DEMO-001 valid, others invalid; XML sample | Fixed ID → accepted/rejected; `NOT-SUBMITTED` XML | Tax verification/document adapters | Live tax checks/regulatory submission |
| R3-ADM-06 | Pay-by-link | Local pay-link open/fail/expire/pay states; simulated receipt only | `{id,amount,currency,paid}` → simulated payment | Pay-link lifecycle/recovery/order linkage | Live payment gateway |
| R3-ADM-07 | CSV/accounting exports | Local tagged accounting CSV | Invoice records → `SIMULATED-accounting.csv` | Scoped export format/jobs | Live accounting provider |
| R3-ADM-08 | Staff 2FA + full audit log | Local per-person fixed code and attributed searchable audit; retained actual audit | `{actor,enabled}` + `{actor,action,target,at}` | Staff policy, persistent audit retrieval | Live MFA provider |

## Customer Account

Screen `/presentation`, **Account presentation**, source `apps/sos/components/presentation/AccountPresentation.tsx`. Shared components `packages/ui/src/prototype/Account.tsx` and `PdfPreview.tsx`. Retained `/team`, `/mailbox`, `/billing`, `/billing/invoices`, `/support`, `/services/requests` remain functional mock surfaces.

| ID | Exact commitment | Screen/action and status | Deterministic mock contract | Future backend requirement | External deferral |
|---|---|---|---|---|---|
| R3-USR-01 | 2FA per person + workspace rule | Local per-person fixed-code setup/recovery and workspace UI policy; production MFA/session enforcement frozen | `{person,enabled}` → fixed code/recovery sample | Person enrollment and workspace policy | Live MFA provider |
| R3-USR-02 | Transfer ownership | Retained ownership transfer UI verified in J15; no free-seat bypass | `{memberId,operationId}` → owner transfer result | Maintain ownership/membership changes | None |
| R3-USR-03 | Workspace audit log incl. view-as | Local attributed/searchable activity; retained impersonation/audit | `{actor,action,target,at}` list/filter | Persist workspace actor and view-as attribution | None |
| R3-USR-04 | Usage and limits page | Local seats/storage/automation counts and meter warnings | Workspace fixture `{used,limit}` → meters | Metering and limit evaluations | Live usage providers |
| R3-USR-05 | Data export (nFADP/GDPR) | Local tagged JSON download; explicitly not regulatory compliance | `{prototype:true,simulated:true,workspace,...}` | Scoped export jobs and completeness | Regulatory compliance claims |
| R3-USR-06 | Onboarding checklist | Local setup wizard/capacity preview and checklist; account61 package checks | `{steps:[{id,done}]}` → progress | Workspace setup/preferences/invite/tool lifecycle | External mail |
| R3-USR-07 | Invoice PDF + billing contacts | Local fixed PDF/PNG/download and contact add | Packaged sample + `contacts[]` | Billing contact ownership and invoice documents | Regulatory certification |
| R3-USR-08 | Team basics | Retained Team/invite/accept/access seats; J2 six and J7 nine UI steps | Team tools/counts + invitation metadata | Team membership/invitation/seat lifecycle | External invitation email |

## Acceptance and handoff

The [15 walkthrough scripts](prototype-journeys.md) reuse these scenes and retained flows. The fifteen walkthroughs have local UI coverage; a single uninterrupted full backend/hosted release run has not been accepted. Shared gallery checks and individual tool captures are evidence for those packages; they cannot be summed into a claim that all 72 commitments or all journeys pass.

Focused Sales company and Marketing journey/brand-kit UI acceptance now passes 80 scoped checks and23 captures, including functional paths and matrix/digit confirmations in `audits/prototype-final/feature-detail-report.json`. Package evidence covers the remaining visible UI/mock flows; Tasks priority/due filters, editing and bulk status/priority pass22 scoped checks/eight EN/AR/theme/width captures (`audits/prototype-final/task-depth-report.json`). Final implementation CI and evidence review passed in PR38. Future backend requirements are handoff notes, not current tasks. External deferrals stay visible after a successful mock demonstration.


## Latest evidence overlay — 2026-10-08

All72 exact IDs/titles are retained. `implemented_ui_package_coverage` records visible UI plus tool/package evidence, not72 independent exhaustive feature tests. All72 rows now have `implemented_ui_package_coverage`; Sales07/Marketing07/Marketing08 have accepted focused depth evidence. This remains UI/mock coverage, not exhaustive backend/hosted acceptance. Read [walkthrough coverage](prototype-journeys.md), [final evidence](audits/prototype-final/README.md), [business loop](audits/prototype-business-closure/README.md) and [shared Account evidence](audits/prototype-shared-account/README.md).

J12 is an audited, explicitly simulated, read-only customer presentation that preserves the staff tab; it does not repair or complete frozen production impersonation. J15 proves ownership/employment/equipment/final-pay UI with an empty-owned-record fixture; task/file custody and other-workspace protection keep their earlier evidence and remaining backend acceptance.
