# OrgTik Suite — revised hosted-mock roadmap

Maintained execution roadmap · 2026-10-07 · amendment A11 · decisions D-063–D-066.

Source: `C:/Users/yosse/.claude/plans/we-have-old-plan-quiet-turing.md`, refined by the approved roadmap and the owner's request for parallel delivery of a senior UI/UX-quality prototype. This repository document is maintained from here; the external Claude plan is historical input.

## الخلاصة بالمصري

- الهدف **بروتوتايب متكامل على Vercel**: رحلات حقيقية بين الأدوات، وداتا الموك محفوظة. الدفع والإيميلات والتحليلات والـ AI والتكاملات الخارجية محاكاة؛ ربط مزوّدين حقيقيين مؤجل.
- الترتيب **R0 → R1 → R2 → R3 → R4**. بنقدّم الأساس اللي كل مرحلة محتاجاه: حساب المقاعد والـ proration في R0، والتجديد وفشل الدفع واسترجاع الوصول في R1، والـ limits وPDF و2FA قبل فيتشرز R3 اللي بتعتمد عليهم.
- **بوابة التجهيز لسه مفتوحة**: أعطال authentication بـ `ECONNRESET` وملف HLS عند `64cd6c5` اتصلحت في `53562b9`. فحوص Linux ونشر الموك والـ smoke نجحوا، لكن اختبار تسجيل الدخول والـ shell كامل على hosted preview والـ library visual gate لسه محتاجين قبول.
- Redis والمشاريع وبيانات نشر Actions متجهزين بالفعل. ما بنطلبش إعادة إنشائهم. اللي ناقص إصلاح الأعطال وإثبات تسجيل الدخول والـ shell على Linux والـ hosted preview.
- أسعار الويبسايت من المنصة، مع الحفاظ على مدد **1/3/6/12 شهر** والخصومات الحالية. تحديد منطقة الزائر محاكاة تلقائية، وSwitzerland هي البديل؛ مفيش country selector جديد.
- كل فيتشر لازم تبقى رحلة مفيدة، مع حالات تحميل وفراغ وخطأ وصلاحيات وقراءة فقط، ومكوّنات `@orgtik/ui`، وخمس لغات وRTL وثيمين وموبايل. تصميم الويبسايت الحالي محفوظ.
- شغل متوازي بملكية واضحة للملفات، PR لكل حزمة، والنشر بحد أقصى مشروعين في نفس الوقت. الـ preview المشترك يتفحص بالتتابع؛ production يتفحص من غير reset أو تغيير الساعة.

## 1. Product outcome, readiness and delivery

Deliver one persistent hosted prototype for customer workspaces and OrgTik staff, retaining **R0 → R1 → R2 → R3 → R4**. Preserve the approved 72 tool commitments. A working mock journey is acceptance for this prototype; it does not make an external integration production-ready.

### Agreed defaults

- Simulate payments, mailbox delivery, analytics, AI responses, signatures and external integrations. Keep live providers, live call media and regulatory submission deferred (D-063).
- Preserve website terms, renewal choices, offer savings and presentation; platform code calculates the offers (D-058, D-064).
- Detect visitor region automatically through the mock resolver, fall back to Switzerland, and expose controlled test overrides without a new country selector. Signed-in customers use their workspace's billing region and currency (D-065).
- Package sample file bytes; persist metadata, access, references, comments and versions. Whiteboards persist structured drawing state and a Files record with seeded previews. Arbitrary binary uploads remain deferred (D-066).
- WM is OrgTik's internal CMS. A website-management purchase opens a managed-service request; it never grants the purchaser internal CMS access (D-002, D-059).

### Readiness snapshot — gate open

Historical inspected revision `64cd6c5ec205dbbf2f8279d63bf84fe28a5db8f7`, on `fix/vercel-auth-layout`, had successful SOS/website deployments but failed mock authentication with `ECONNRESET` and HLS transport-stream artifact verification. The existing 16 pricing checks passed locally.

The integration owner has now pushed **`53562b9`**: fresh `node:http` loopback dispatch with explicit 503 transport failure, copied reviewed Files assets after tracing, and marked binary HLS assets. Reported verification: local authentication **17**, journal **8**, transport/artifact **6** pass; Linux CI checks, mock deployment and hosted smoke are successful. **Full hosted authentication/layout acceptance and the library visual gate remain pending.** [PR #4](https://github.com/YossefElfeel/orgtik-suite/pull/4) still serves as an integration preview. These observed checks do not close the release gate or mark any R0–R4 package complete.

| Setup or dependency | Verified state / evidence | Remaining work |
|---|---|---|
| Redis persistence | Existing free Frankfurt Redis connected to both mock projects, recorded in `audits/auth-layout/readout.md`; D-053 journal implementation is present | Prove cold-start persistence and error behavior in the corrected hosted preview; do not create another database |
| Deployment credentials | Existing `VERCEL_TOKEN` Actions secret used by successful SOS/website deployments; credential values are never copied into program records | Correct failing jobs using the existing credential; do not recreate or print it |
| Project configuration | `tools/vercel/projects.json` records 12 existing projects and the preview mock project; deploy workflow already limits concurrency to 2 and serializes the preview group | Validate configuration and affected targets; do not create replacement projects |
| Auth/runtime artifact | Historical failures at `64cd6c5` corrected in `53562b9`; integration owner reports local auth17/journal8/transport-artifact6 and Linux CI checks successful | Preserve the fixes through extracted PRs; attach revision-specific acceptance evidence |
| Hosted acceptance | Mock deployment and smoke successful at `53562b9`; full hosted auth/layout and library visual acceptance pending | Verify cold starts, sign-in, handoff, refresh, account persistence and desktop/mobile shell behavior on the release revision |
| Existing website work | PR #3/work-order changes and local website work remain carried into this checkout | Complete or rebase work-order delivery before dedicated line-ending normalization |

**Before R0:** require green Linux mock artifact verification, hosted authentication, and desktop/mobile shell checks. Updating this roadmap and investigating readiness may run in parallel; release implementation/deployment must respect the gate. Evidence and dependency status live in `backlog/release-packages.csv`; blank acceptance evidence means not accepted.

### Stack and delivery rules

- Preserve the existing stack and work. Reconcile PR #1 with D-059 before landing it. Land foundation/review ancestors in dependency order, then extract the auth/deployment changes from PR #4 into coherent PRs. Do not merge its combined integration diff as a shortcut.
- Preserve PR #3 and the 2026-10-06 work order; complete/rebase that work before a separate line-ending normalization PR. Binary `.ts` HLS assets must remain binary, including in Linux checkout and Vercel tracing.
- One PR per coherent package. Parallel agents own disjoint app areas. The integration owner owns shared APIs, `mock/lib`, server dispatch, shells and `@orgtik/ui`; coordinate shared edits through that owner.
- Deploy affected projects only, at most two concurrently. Serialize preview deploy plus verification against the shared preview sandbox. Backend consumer testing is selected separately from deployment selection.
- Require CI and preview acceptance before merge; production deploys validated `main`. Preserve existing accounts, IDs, ownership and historical invoices. Never reset production business data or advance its shared clock for verification.
- Retain earlier acceptance evidence as history. Close a package only with revision-specific CI, preview URLs and flow/visual evidence, distinguishing implemented behavior, simulated behavior and deferred external capability.

### Runtime test dependency map

This map defines the **minimum consuming apps to test**, even when only `mock` needs deployment. App-only edits also test that app and its directly connected journey. Shared contract changes widen this map rather than relying only on Turborepo's package graph.

| Backend/shared change | Runtime consumer tests |
|---|---|
| Identity, handoff, refresh, sessions, workspace context, entitlements | SOS/USR, ADM, Tasks, Files, HR, Sales, Marketing, Chats, WM and website auth/checkout; include legacy Content while it remains |
| Platform catalog, prices, offer quotes, checkout, invoices, seats, lifecycle | ADM, SOS/USR, website and relevant consuming tool access/write flows; billing or entitlement changes test all customer tools |
| Files metadata, permissions, references or whiteboards | Files, Tasks and Chats |
| HR hire/leave/offboarding | HR, SOS/USR, Tasks, Files, Sales and Chats; also verify another workspace retains access |
| CRM intake/provisioning/attribution | Sales, website, WM, Marketing and SOS/USR |
| WM publish/content/media | WM and website, plus Marketing when landing-page attribution is touched |
| Notifications, search or preferences | All suite shells; filter results/deep links by current workspace and access |
| `@orgtik/ui`, shell, theme or catalog changes | Every consuming app; library visual/accessibility gate, EN/AR RTL, light/dark and responsive checks |

## 2. Release implementation

### R0 — money correctness and immediate flow fixes

**Platform packages:** scheduled publishing changes quotes only at `effectiveAt`; existing-now repricing touches only affected zone/currency cells and emits notices, including new cells. Validate bundle status/membership, apply bundle → coupon → proration → tax, credit unused periods on monthly/yearly switches, use workspace currency and recorded USD payment rates, apply regional tax display/reverse charge (D-060), route Gulf payments through Tap/HyperPay (D-062), apply scheduled downgrades at period end with over-limit data listed, materialize accepted custom plans, and restrict Service Team to assigned requests.

**Quantity and proration contract:** per-tool purchased capacity is stored on subscription lines. Ordinary repricing uses stored quantities; explicit seat purchases use requested quantities validated server-side against plan minima and assigned/reserved seats. Deliver the shared proration calculation here so cycle changes and later seat purchases use the same rule. Set `seatModel` to B and regenerate the platform contract.

**Public website adapter brought forward:** expose the minimum platform catalog/offer quote and simulated checkout confirmation required by the website. The platform resolves prices and records the paid mock order **before** account linking. Client totals or a receipt cannot create a paid invoice. Keep authenticated linking idempotent, preserve the paid order's currency, and register service offers individually with their own fulfilment mappings; apply D-059.

**Website offer policy (D-064):** terms 1/3/6/12 months receive duration savings 0/5/10/15%; distinct-item counts 1/2/3–4/5+ receive 0/5/10/15%. Choose the greater saving, duration wins ties, and round once per full-period line using currency precision. Keep this policy separate from subscription bundle → coupon → proration → tax. Use platform-resolved regional base prices and D-065 region detection; preserve renewal choices and presentation.

**UI/copy package:** complete SR-006 accessible “Open {tool}” labels; SR-010 narrow invoice column ordering; SR-011 one cached Home tools request; SR-012 active/trial tool actions through `/go`; remaining SR-004 purchase-to-sign-up prefill and SR-005 honest account/service onboarding wording; rail translations; Chats saving copy that describes what persists today; and HR employee currency display. Preserve SR-002 and its manual-renewal wording. Keep the mock payment context clear without falsely describing functional account access as simulated.

**Exit:** pricing worked examples and actual publish/checkout endpoint regressions pass; checkout and invoices agree; invalid/altered client totals, failed payment and repeated linking are covered. Touched flows, accessibility and website EN visual parity pass with documented wording/price/mock-region changes only.

### R1 — workspace, access, people and billing foundations

Build packages in this order; app storage adapters can run in parallel after the workspace interface is stable.

1. **Workspace context/stores:** centrally resolve and validate selected workspace membership; carry it through login, refresh, switching and one-time handoff. Scope Tasks, Files, HR, Sales, Marketing and Chats data to that workspace. New workspaces begin empty; existing seeded fixtures remain independent. WM/ADM internal access stays separate.
2. **Entitlements/roles:** launcher, UI role helpers and APIs use one current-workspace access calculation. No union of identity scopes across tenants may grant access in the selected workspace. Distinguish member/tool roles, seats and line state. Preserve staff grants independently. Useful no-access/ask-owner and read-only states accompany API enforcement.
3. **Sessions:** persist revocation needed for deactivation and cross-domain sign-out. Temporary outages preserve valid sessions but do not report successful writes. Preserve read-only impersonation, actor attribution and audit retrieval.
4. **Seats/invitations:** distinguish per-tool purchased capacity, assigned seats, pending reservations and availability. Reserve on invitation; release on cancel/expiry; accept once by converting the reservation. Validate competing invitations atomically across mock instances. Ownership never bypasses seats; initial purchase assigns the owner an available seat. Deliver acceptance metadata, mailbox, resend/cancel, team allocation, seat purchase using R0 proration, leave/deactivation and ownership transfer.
5. **Billing lifecycle lifted from R4:** renewal, failed-payment progression, retry scheduling, payment recovery and seat changes. Keep the configured **7-day grace** and cancellation at **day 37**; retries follow the approved mock schedule (days 1/3/5). A failed payment during grace does not immediately block writes; writes stop when a line becomes read-only. Repeated lifecycle runs must not duplicate charges, invoices or notices. Recovery restores access consistently.
6. **HR lifecycle:** hire reuses/creates a person through identity storage and issues a workspace invitation with seat reservations. Approved leave appears in the relevant calendar. Offboard at the end date by revoking only that workspace's membership/seats, transferring ownership and tracking equipment/final-pay actions. Preserve access to other workspaces.

**Prototype UI acceptance:** workspace name/switcher, owner/member guidance, invitation errors and recovery, real empty-workspace primary actions, seat capacity explanations, useful read-only states and audit-visible “View as”. Avoid reseeding a new customer's workspace with shared demo data.

**Exit:** J1, J2, J3 billing/access portion, J7, J12 and J15 pass, including isolation, concurrent reservations, leave visibility, ownership transfer, offboarding and revocation. J3 refund/credit-note completion remains tracked in R4. Preserve golden flows against seeded workspaces.

### R2 — connected applications

- **Files/whiteboards:** shared Files picker/references in Tasks and Chats, authorizing every reference in its workspace. Persist whiteboard drawing state and a Files record with seeded previews; prove save/reopen/reference permission behavior (D-066).
- **Notifications/search:** shared notification center and permission-filtered grouped search. Deep links preserve workspace and use existing handoff. No cross-workspace or unauthorized result leakage.
- **Chats:** persistent workspace channels, messages, membership and read state; use polling on Vercel.
- **CRM:** route public website leads/orders into **OrgTik's CRM workspace**, preserving source and fulfilment. Only authorized OrgTik staff provision a customer workspace from a won deal. Keep customer CRM separate.
- **CMS:** runtime published-content loading with last-known-good fallback; website-only SEO rebuild on publish. Confirm internal CMS access never follows a service purchase.
- **Preferences/session:** language, theme, digits and timezone cross domains; complete cross-domain revocation using the R1 session foundation.
- **Website catalog/trial:** expand R0 catalog consumption across plans/product pages and implement trial entry. Preserve four-term offer presentation and signed-in billing context.
- **Attribution:** connect OrgTik Marketing campaign/WM page/source data to Sales; keep customer CRM/Marketing boundaries.

**Exit:** J4, J5, J6, J8, J9, J11, J13 and J14 pass on preview, including references, live mock publishing, deep links, preferences and sign-out. Website parity and outage fallback pass.

### R3 — the approved 72 tool commitments

Retain every original eight-feature register below. Each numbered commitment has its original identity; the delivery column identifies a shared base, mock boundary or external deferral. **All entries are planned until package acceptance evidence is recorded**; a cross-reference is not a completion claim.

First deliver shared usage/limit evaluation, invoice PDF generation, audit retrieval and functional mock 2FA. Implement overlapping behavior once in R1/R2/R4, then complete the R3 tool surface. Every feature follows: specification → existing `@orgtik/ui` components → five catalogs → loading/empty/error/permission/read-only states → mock/authorized API contract → meaningful flow test → visual/accessibility acceptance.

| Tasks | Commitment | Delivery |
|---|---|---|
| 1 | Filters + search across tasks | R3 Tasks; reuse R2 search |
| 2 | Reminders/overdue alerts + watchers | R3 Tasks; R2 notifications + mailbox |
| 3 | Recurring tasks | R3 Tasks; persisted mock-clock behavior |
| 4 | Templates | R3 Tasks |
| 5 | Files attach | R2 Files/reference base; complete Tasks surface |
| 6 | Labels | R3 Tasks |
| 7 | CSV import/export | R3 Tasks; validate scoped records |
| 8 | Quick add + bulk edit | R3 Tasks |

| HR | Commitment | Delivery |
|---|---|---|
| 1 | Offboarding + equipment | R1 lifecycle base; complete R3 checklist |
| 2 | Leave policies/accruals + own balances | R3 HR; R1 approved-leave visibility |
| 3 | Self-service profile + directory | R1 identity/membership base; R3 HR surface |
| 4 | Bulk import | R3 HR; workspace-scoped validation |
| 5 | Bank files CH/UAE + currency per employee | R0 currency display; R3 mock export, live banking deferred |
| 6 | Onboarding checklists as Tasks | R3 HR/Tasks; R1 hire/invitation base |
| 7 | Document expiry reminders | R3 HR; R2 notification base |
| 8 | Email notifications | Persistent mock mailbox; live email deferred |

| Files | Commitment | Delivery |
|---|---|---|
| 1 | Attach in Tasks/Chats | R2 references/picker base |
| 2 | Version history + upload new version + name clash | R3 metadata/version workflow chooses packaged sample assets; arbitrary upload deferred |
| 3 | Notify on share | R3 Files; R2 notifications |
| 4 | Per-person access | R1 workspace base; R3 Files permission surface |
| 5 | Storage quota | Shared R3 usage/limit foundation; packaged-asset accounting |
| 6 | Bulk select + drag move | R3 Files |
| 7 | Comments | Persisted R3 metadata |
| 8 | One search with filters + sort | R3 Files; R2 search base |

| Sales | Commitment | Delivery |
|---|---|---|
| 1 | Follow-up tasks via Tasks | R3 Sales/Tasks; shared workspace authorization |
| 2 | Import/export/bulk | R3 Sales |
| 3 | Deal board with editable stages, probability, forecast | R3 Sales; deterministic mock forecast |
| 4 | Contact timeline + logging | R3 Sales |
| 5 | Lead routing + simple automations | R2 CRM intake base; persisted R3 mock rules |
| 6 | Offer PDF/validity/e-sign | Shared PDF foundation; mock signing/expiry flow, live signature provider deferred |
| 7 | Companies, custom fields, tags | R3 Sales |
| 8 | Targets + funnel/source/lost-reason reports | R3 mock reports over scoped records |

| Marketing | Commitment | Delivery |
|---|---|---|
| 1 | CRM sync + attribution | R2 OrgTik attribution base; scoped R3 surfaces |
| 2 | Consent/unsubscribe + delivery stats | Persist consent and mock delivery events; live sending deferred |
| 3 | Campaign results | Deterministic mock analytics; identify sample data |
| 4 | RTL email designer | R3 five-locale content/preview workflow |
| 5 | Social inbox | Persistent simulated external messages; live providers deferred |
| 6 | Posting queue + drag reschedule | Mock queue with persisted schedules; live posting deferred |
| 7 | Simple journeys | Persisted mock automation flow |
| 8 | AI writing with brand kit | Useful deterministic draft/review flow; live AI provider deferred |

| Chats | Commitment | Delivery |
|---|---|---|
| 1 | Stored history | R2 polling/persistence base |
| 2 | Files sharing | R2 authorized reference base |
| 3 | Desktop/email notifications | In-app/mailbox and browser-permission mock flow; external delivery deferred |
| 4 | Calls with real media | Prototype call/join/leave/failure states are simulated; live media/LiveKit provider deferred |
| 5 | Create task from message | R3 Chats/Tasks with authorized reference |
| 6 | Rich text | R3 Chats |
| 7 | Browse/join channels | R2 membership base; complete R3 surface |
| 8 | Scheduled messages, remind me, save for later | Persisted mock clock and read-state workflow |

| WM | Commitment | Delivery |
|---|---|---|
| 1 | Publish updates the site | R2 runtime CMS/SEO base |
| 2 | Real analytics | Original benchmark commitment retained; prototype uses labelled mock analytics, live measurement deferred |
| 3 | Reviewer/lead notifications | R2 notification + mailbox base |
| 4 | Form spam protection | Deterministic validation/mock spam outcomes; live provider deferred |
| 5 | Media tags + bulk upload + replace | R3 metadata workflows on packaged sample assets; arbitrary upload deferred |
| 6 | Responsive images | Packaged responsive variants and meaningful preview |
| 7 | AI translation drafts into review | Mock draft/review workflow; public language release and live AI deferred |
| 8 | Release bundles | Persisted R3 release/publish workflow |

| ADM | Commitment | Delivery |
|---|---|---|
| 1 | Dunning retries + emails + card-expiry warnings | R1 lifecycle base; R4 administration/mailbox warnings |
| 2 | Invoice PDF + series per entity | Shared R3 PDF base; R4 invoice series |
| 3 | Edit a single subscription | R0 proration + R1 lifecycle base; R3 admin surface |
| 4 | SaaS metrics | R4 deterministic mock metrics |
| 5 | Tax IDs + ZATCA | D-060 tax display; deterministic mock checks/e-invoice examples, regulatory submission deferred |
| 6 | Pay-by-link | R4 simulated payment/recovery path |
| 7 | CSV/accounting exports | R3 scoped exports; external accounting provider deferred |
| 8 | Staff 2FA + full audit log | Shared R3 functional mock 2FA/audit retrieval; preserve impersonation attribution |

| USR | Commitment | Delivery |
|---|---|---|
| 1 | 2FA per person + workspace rule | Shared R3 functional mock 2FA; session rules from R1 |
| 2 | Transfer ownership | R1 ownership base |
| 3 | Workspace audit log incl. view-as | Shared R3 audit retrieval; R1 actor attribution |
| 4 | Usage and limits page | Shared R3 usage evaluation + R4 dashboard completion |
| 5 | Data export (nFADP/GDPR) | R3 scoped prototype export; no claim of regulatory compliance |
| 6 | Onboarding checklist | R4 onboarding surface; R1 first-run guidance |
| 7 | Invoice PDF + billing contacts | Shared R3 PDF base; R4 billing contacts |
| 8 | Team basics | R1 invitations, allocation and membership base |

**Exit:** each commitment has revision-specific acceptance evidence or an explicit external deferral; simulated behavior is labelled as such in evidence. J10 and existing tool flows remain green. R4-linked commitments remain open until R4 evidence; they are not silently counted complete at R3.

### R4 — SaaS core completion

- Extend the R1 engine with currency migrations, dunning administration, grace extension, expiry warnings and mailbox notices; preserve historical invoice currency and idempotent lifecycle behavior.
- Complete onboarding, usage dashboards, billing contacts, refunds/credit notes, invoice series, deterministic SaaS metrics, simulated pay links, ticket SLA/merge/replies and tool-launch checks/waitlist notices. Reuse R0 proration, R1 sessions and R3 limits/PDF/2FA/audit services.
- Keep tax-ID checks and e-invoice examples deterministic mock behavior. Retain live gateway/email/accounting/AI/signature/analytics/regulatory integrations as visibly deferred.
- Apply D-055 retirements only after replacement acceptance: frozen Sales/SOS routes redirect to replacements; retire legacy shell dependencies, UI shims and finally Content after CMS publishing works. **Vercel project deletion is a separate explicit user decision.**

**Exit:** remaining ADM/USR register entries and full J3 refund/credit-note journey pass. No duplicate renewal/recovery/refund effects; currency changes preserve paid orders and historical invoices.

## 3. Interfaces and persistence

- Shared workspace context contains workspace, member role, tool roles, access state and impersonation actor. Validate any selected-workspace hint against membership centrally. Handoff/refresh preserve it; scopes describe only that selected workspace.
- Team responses expose per-tool capacity, assigned, reserved and available counts. Invitation metadata/acceptance and ownership-transfer operations enforce allocation and actor rules server-side.
- Public catalog/offer quotes and simulated order confirmation use platform-resolved region/prices. Persist resolved region and pricing policy with the order. Authenticated linking is idempotent and cannot change a paid order's currency or let receipt/client totals mint paid invoices.
- Shared file references identify workspace-scoped Files records. Whiteboard records persist structured state; sample previews do not substitute for the saved drawing. Downloads retain packaged asset bytes.
- Generate shared/tool contracts alongside the existing platform contract, including authorization metadata. Preserve the existing API envelope unless a versioned route requires change.
- Cross-app operations journal once through shared services. Persistence failure returns failure; replay cannot repeat provisioning, seat allocation, transfers, charges or notifications. Validate concurrency across mock instances, not only one in-memory server.

## 4. Prototype quality, acceptance and closure

### Senior UI/UX prototype gate

Acceptance is task-based: a customer or staff persona can complete the relevant journey and understand the next action. Reuse the existing OrgTik design system, Phosphor icons, tokens, status vocabulary and `@orgtik/ui` states; do not introduce a separate visual kit or a new website identity.

Every touched suite flow has useful loading, empty, validation, error/retry, permission and read-only states, keyboard/focus behavior, accessible action names and honest saving/delivery feedback. Check all five locale catalogs (EN/AR/DE/FR/IT), with visual walkthroughs in **EN and AR**, **light and dark**, **390/768/1440** widths, plus 320px on touched website commerce. Arabic RTL, digits and pluralization must remain correct. Preserve the public English website's visual identity except recorded wording, pricing and mock-region display changes; public Arabic launch remains deferred.

### Per-PR checks and required regressions

- Affected typechecks, catalogs, appropriate tests, secret scan, contract generation/check and Vercel configuration check. Library changes run the visual/accessibility gate. Test runtime consumers using the map above even when they need no deployment.
- Cross-workspace reads/writes, roles, search results and file references; last-seat races; invitation cancel/expiry/repeated acceptance; ownership without seats.
- Cold starts, single-use handoff, refresh, revocation, persistence outages and replay; signed-in workspace currency/region, absent/controlled visitor region.
- Every pricing worked example plus real publish/checkout endpoints, all four website terms, distinct-item bands, tie policy, currency precision, altered totals, failed payment and repeated paid-order linking.
- Billing grace/read-only boundaries, scheduled changes, repeated lifecycle execution, recovery, seat changes and offboarding without revoking another workspace.
- Real UI flows for new empty workspaces, member/owner/staff restrictions, failed actions and recovery, cross-app navigation, locale/theme persistence and responsive layout.

### Release closure

Run all 15 journeys on an **isolated hosted verification deployment built from the release revision**. Use reset/clock/failure controls there only. Production receives non-destructive smoke checks; it must not reset business data or advance the clock. Capture revision, identity, workspace, URL, locale/theme/width and result alongside flow evidence.

Update the gap matrix, benchmarks, original backlog evidence, Arabic readout and this roadmap/package register after verification. Leave an item open while its evidence is absent or stale; record simulation and external deferral separately. Preserve the source plan and earlier amendments as history. Final closure includes A11 and D-063–D-066 and keeps live integrations and public Arabic website launch visibly deferred.
