# OrgTik Suite — revised hosted-mock roadmap

Maintained execution roadmap · 2026-10-08 · amendments A11, [A12](phase-f/amendment-A12.md), [A13](phase-f/amendment-A13.md), [A14](phase-f/amendment-A14.md), [A15](phase-f/amendment-A15.md), [A16](phase-f/amendment-A16.md) and [A17](phase-f/amendment-A17.md) · decisions D-063–D-072 (D-072 local acceptance passes; package CI/hosted acceptance pending).

Source: `C:/Users/yosse/.claude/plans/we-have-old-plan-quiet-turing.md`, refined by the approved roadmap and the owner's request for parallel delivery of a senior UI/UX-quality prototype. This repository document is maintained from here; the external Claude plan is historical input.

R1 foundations merged in [PR14](https://github.com/YossefElfeel/orgtik-suite/pull/14), main e74134f, after [Linux and Windows CI](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37691408296). People journeys merged in [PR15](https://github.com/YossefElfeel/orgtik-suite/pull/15), main4dbb6db, after [CI37699827826](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37699827826); [A13](phase-f/amendment-A13.md) and [the package evidence](phase-f/README.md) record their limits. Approved leave merged through PR16; trusted due transitions merged through [PR17](https://github.com/YossefElfeel/orgtik-suite/pull/17), main `496a0e2`, after [CI37715489730](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37715489730). Full R1 integrated acceptance, deliberate staff reappointment/recovery, hosted release acceptance and R2–R4 remain open. The R0 snapshot below remains historical evidence, not a claim that the full roadmap is complete.

## الخلاصة بالمصري

تحديث السبورات: الحفظ الدائم ونسخ الرسم وربطه بسجل Files اتراجعوا محليًا؛ ٤٣٦ فحص mock و٩٣ فحص واجهة محدد مع ١٥ لقطة و٢٦ بصمة مصدر مطابقة. الرسم القديم يفضل ثابت حتى بعد حفظ نسخة جديدة، واسترجاع الرد الضائع ما بيرجعش النسخة الحالية للخلف. قبول CI للحزمة والـ ١٥ رحلة المنشورة وباقي الخطة لسه مفتوحين، والنشر متوقف.

- الهدف **بروتوتايب متكامل محفوظ البيانات**: الدفع والبريد والتحليلات والـ AI والتكاملات الخارجية محاكاة، مع رحلات عميل وفريق OrgTik واضحة ومفيدة.
- الترتيب **R0 → R1 → R2 → R3 → R4**، والـ ٧٢ التزام محفوظين. كود R0 وأساس R1 اتدمجوا بعد CI ناجح؛ **ده مش قبول release**، وباقي R1 وR2–R4 لسه مفتوحين.
- لقطة الدمج الحالية **main `438c237`**، وحزمة الإجازات والتقويم اتدمجت بعد ٣٣٩ فحص mock وCI ناجح. دليل المالية فيه ٤٠٦ فحوص تاريخية، وبعدها ٧٩ فحص recovery؛ الأرقام مش بتتجمع كإعادة كاملة على نفس revision.
- المالك سمح بدمج الكود قبل قبول الـ hosted ووقف نشر Vercel صراحةً. Native Git مقفول لكل الـ ١٢ مشروع، وworkflow النشر disabled. **مفيش نشر جديد، وقبول الـ ١٥ رحلة على revision منشور لسه مفتوح**.
- PR #3/work order اتدمج بعد التصالح مع main وCI ناجح، مع الحفاظ على adapter الدفع الجديد. تطبيع نهايات السطور لسه حزمة منفصلة.
- أسعار الويبسايت من المنصة مع مدد 1/3/6/12 شهر والخصومات الحالية؛ منطقة الزائر MOCK تلقائية مع Switzerland بديل واختبار override، من غير country selector جديد.
- الواجهات تستخدم `@orgtik/ui` وخمس لغات وRTL وثيمين وموبايل، مع حالات تحميل وفراغ وخطأ وصلاحيات وقراءة فقط، وهوية الويبسايت الحالية محفوظة.

## 1. Product outcome, readiness and delivery

Deliver one persistent hosted prototype for customer workspaces and OrgTik staff, retaining **R0 → R1 → R2 → R3 → R4**. Preserve the approved 72 tool commitments. A working mock journey is acceptance for this prototype; it does not make an external integration production-ready.

### Agreed defaults

- Simulate payments, mailbox delivery, analytics, AI responses, signatures and external integrations. Keep live providers, live call media and regulatory submission deferred (D-063).
- Preserve website terms, renewal choices, offer savings and presentation; platform code calculates the offers (D-058, D-064).
- Detect visitor region automatically through the mock resolver, fall back to Switzerland, and expose controlled test overrides without a new country selector. Signed-in customers use their workspace's billing region and currency (D-065).
- Package sample file bytes; persist metadata, access, references, comments and versions. Whiteboards persist structured drawing state and a Files record with seeded previews. Arbitrary binary uploads remain deferred (D-066).
- WM is OrgTik's internal CMS. A website-management purchase opens a managed-service request; it never grants the purchaser internal CMS access (D-002, D-059).

### Readiness and merged-code snapshot — hosted release acceptance open

**Current recorded main: `438c2377c7d8d98259bdcad363a30b8c8bfde68a` (2026-10-08).** Files source `a35a9f0` merged through [PR18](https://github.com/YossefElfeel/orgtik-suite/pull/18) after [CI37724544919](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37724544919), which verified402 mock checks; scoped local UI163 assertions/28 captures and23 source hashes pass. Full J8 whiteboards and release acceptance remain open. Trusted deadline source `ab9849d` passed [CI37715489730](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37715489730), and PR17 merged with372 mock checks and69 scoped HR UI assertions (late recovery is a controlled projection). Leave source `6b5cf54` passed [CI37708774116](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37708774116), and PR16 merged with339 mock checks and scoped HR/Tasks/Chats acceptance. People source `2ab930e` passed [CI37699827826](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37699827826), and PR15 merged with325 mock checks and local browser evidence. R1 foundation source `025c834` passed [CI37691408296](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37691408296), including Linux checks and Windows library acceptance, before PR14 merged. PR #3 source`2364841` previously passed [CI37650247042](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37650247042) (Linux5m58s and Windows library15m18s) and [pause configuration37650247008](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37650247008). Earlier main`998d821` also passed CI37649449943. The owner authorized code merges while explicitly pausing Vercel deployment and waived hosted preview acceptance **before these code merges**. This operational exception does not waive release acceptance. Native Git deployment is disabled for all **12 projects**; deployment workflow **377190291** is disabled. No Vercel workflow run occurred after that disable. Existing resources, accounts and historical invoices remain in place.

| Coherent package | Source → main merge | Successful CI evidence |
|---|---|---|
| PR #10 foundation/journal | `e1d01c3 → 1f3d662` | [37643491731](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37643491731), Linux and strict Windows library checks |
| PR #11 review/plan ancestors | `a651010 → d4e3f4a` | [37646536091](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37646536091) |
| PR #4 focused auth/runtime extraction | `a9f628c → a1bc0b8`; runtime source equivalent to repaired `4fea6a4` | [37644928271](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37644928271) |
| PR #1 D-059 managed-service reconciliation | `df09d5d → a1b01b1` | [37646357048](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37646357048) |
| PR #6 R0 backend/contracts | `3d13cc4 → e1216c6` | [37647486335](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37647486335), **141 mock checks passed** |
| PR #9 HR currency, honest Chats copy and rails | `bb9fc84 → ccccbcf` | [37642637117](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37642637117) |
| PR #12 finance UI and recovery | `c60c92e → 087db6e` | [37644363153](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37644363153) |
| PR #7 server-paid website offers | `03bf11c → 998d821` | [37642581278](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37642581278) |

PR #2 plan records and PR #8 deployment-pause controls have also landed. The foundation and review ancestors were extracted first; the original combined PR #4 integration diff was **not** merged as a shortcut. Its focused runtime package landed after those ancestors.

**PR #3/work order is code-accepted and merged:** source`2364841 → main0ba265e` resolves the three overlaps and preserves the newer server-paid adapter. All implementation PRs #1, #2, #3, #4, #6, #7, #8, #9, #10, #11 and #12 are merged with successful code checks. The final source2364841 CI confirms **148 mock regressions**: authentication17 + journal8 + pricing20 + Node103. This includes seven additional work-order content/idea cases beyond prior141. The22 tooling regressions are separate, and the website49+10 cases are unique even when rerun by a consumer check. Earlier141 at source3d13cc4 remains historical R0 proof. Dedicated line-ending normalization remains a separate package; hosted release acceptance is open.

### Historical readiness evidence

At inspected `64cd6c5`, SOS/website deployments succeeded but mock authentication failed with `ECONNRESET` and artifact verification failed on an HLS `.ts` segment; the old 16 pricing checks passed locally. Repair `53562b9` introduced fresh `node:http` loopback dispatch, explicit 503 transport failures, copied reviewed sample bytes after tracing and binary HLS attributes.

[Hosted verification 37611824291](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37611824291) passed with test code `993248a` against **mock/SOS `33bd33e`** and **website `b35f55c`**. [CI 37612798844](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37612798844) passed Linux checks, **264 strict Windows library comparisons** and interactions. The reviewed references/38 renderer pairs retain threshold 0.1 and zero changed pixels, with fixed Cairo/locale/clock and semantic/layout/font validation. These prove only the named earlier builds, not current R0 hosted journeys.

Build-only runs [37638044509](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37638044509) and [37639070714](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37639070714) succeeded at byte checks but originally logged **48 TypeScript diagnostics** because the HLS exclusion was project-relative. The subsequent `4fea6a4` repair matches repository/project trace bases with `**/apps/files/assets/hls/**/*.ts`; the corrected extraction now has green source CI. Six artifact guards protect packaged samples/frozen financial bytecode; the foundation's **22 tooling regressions** passed. Keep those historical limitations distinct from the repaired code. The earlier Vercel **100-deployments/day** limit is historical context; the owner's current explicit pause applies independently of quota.

| Setup/dependency | Recorded state | Remaining work |
|---|---|---|
| Redis | Existing free Frankfurt Redis/persistent sandboxes; earlier hosted auth/persistence proof | Preserve configured bindings, accounts and invoice history; no new database |
| Credentials/projects | Existing Actions credential and project IDs; configuration checks pass; native Git/workflow deployment paused | Preserve setup; do not recreate resources or deploy without a new owner instruction |
| Auth/assets/library | Corrected source, byte guards and strict visual harness landed through coherent PRs with green CI | Prove current release flows on a revision-specific isolated hosted deployment when deployment is authorized |
| Website/work order | R0 offer adapter and PR #3/work order merged | Preserve website/WM work and visual identity; keep normalization separate |
| Release gate | Code/CI accepted for R0 and R1 foundation packages; **no full release or all-journey hosted acceptance** | All 15 journeys, consuming-app access/persistence and website parity at the release revision; remaining R1–R4 stay open |

### R0 implementation and local evidence

The final merged mock suite passed **148** checks on source2364841 (CI37650247042): authentication17 + journal8 + pricing20 + Node103. The earlier R0 source3d13cc4 passed141 before seven work-order content/idea cases were included. Current source contains pricing20, lifecycle4, R0 endpoint24, website-offer20 and term/proration3 cases; these and the six persistence endpoint checks are overlapping subsets of the full suite. Do not add subset or tooling counts to148. The generated contract is **102 paths / 120 operations / 40 schemas**.

[Local finance evidence](audits/r0-prototype/finance-clean-20261007/README.md) records **406 checks/57 captures** against an earlier API generation; it predates held quotes/uncertainty recovery and is not a full rerun of the final revision. [Later checkout recovery evidence](audits/r0-prototype/checkout-recovery-20261007/README.md) records **65 recovery + 14 edge checks**, with nine capture metadata entries and three representative tracked images. Neither proves hosted release acceptance. The [R0 readout](audits/r0-prototype/readout.md) records provenance and limits.

The implementation includes scheduled/affected-cell repricing, stored per-tool capacity, eligible discounts/proration/credit ledgers, regional tax/Gulf routing, downgrade metadata, assigned-only service reads and D-067 scoped private plans activated only after payment. Public offers retain immutable server-priced paid orders and claim linking. New workspaces keep currency unlocked until a paid purchase. Held subscription quotes are scoped to workspace/actor and request/billing context for at most **900 seconds** (shortened at relevant period boundaries); successful authorized nonce receipts recover the same paid result after response loss. Full workspace/tool isolation, runtime usage integration, sessions and invitations still require the R1/R3 foundations.

### Delivery rules retained

- One PR per coherent package and one owner for shared APIs/library/shell. The current merged stack preserves the foundation/review-before-runtime requirement.
- PR #3/work-order has landed; line-ending normalization remains a separate PR. Preserve binary sample/frozen bytes throughout.
- Deployment remains explicitly paused. When authorized again, deploy affected projects only, at most two concurrently; serialize the shared-preview deployment and acceptance. Runtime consumer testing is separate from deployment selection.
- Green CI and preview acceptance remain the normal merge rule; the owner's current code-only waiver is recorded above. Production deployment uses validated main and requires deployment authorization. Preserve accounts, historical invoices and ownership; never reset production data or advance its shared clock for verification.
- A skipped **Preview acceptance** check is not acceptance. Package code merge, simulated behavior, external deferral and release acceptance are recorded separately in `backlog/release-packages.csv`.

### Runtime test dependency map

This map defines the **minimum consuming apps to test**, even when only `mock` needs deployment. App-only edits also test that app and its directly connected journey. Shared contract changes widen this map rather than relying only on Turborepo's package graph.

| Backend/shared change | Runtime consumer tests |
|---|---|
| Identity, handoff, refresh, sessions, workspace context, entitlements | SOS/USR, ADM, Tasks, Files, HR, Sales, Marketing, Chats, WM and website auth/checkout; include legacy Content while it remains |
| Platform catalog, prices, offer quotes, checkout, invoices, seats, lifecycle | ADM, SOS/USR, website and relevant consuming tool access/write flows; billing or entitlement changes test all customer tools |
| Files metadata, permissions, references or whiteboards | Files, Tasks and Chats |
| HR hire/leave/offboarding | HR, SOS/USR, Tasks, Files, Sales, Marketing, Chats, ADM and WM; also verify another workspace retains access |
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

The [workspace/runtime/session contract](phase-f/workspace-runtime-contract.md) and its foundation landed in PR14. People journeys landed through A13/PR15, and [A14](phase-f/amendment-A14.md)/PR16 added JSON/staged leave and calendar propagation with339 mock checks, local UI evidence and successful CI. [A15](phase-f/amendment-A15.md)/PR17 records trusted deadlines, durable staff revocation and372 retained/new mock checks with successful package CI. Remaining integrated R1 acceptance, deliberate staff recovery/reappointment, R2–R4 and hosted release gates stay open; the checklist below retains their required behavior.

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
- Public `/v1/public/catalog`, `/v1/public/website-quotes` and `/v1/public/website-orders` use platform-resolved region/prices and explicit currency minor units. Persist region/policy in an immutable payment snapshot. Authenticated `/v1/app/website-orders` linking accepts only `{reference, claimToken}`, is idempotent, and cannot change paid currency or let browser receipt/totals mint invoices. Public requests allow optional bearer workspace context; signed-in confirmation requires the owner.
- D-067 custom quotes allocate full-term prices per tool with an exact rounded sum. Acceptance prepares scoped private plans for ordinary checkout; repeated acceptance is idempotent. A successful mock payment creates active lines, and foreign workspaces cannot see or buy those private plans.
- Ordinary checkout optionally accepts `Idempotency-Key`; a receipt can be reused only for the same actor/workspace/body after current role/read-only guards pass. Cycle changes credit unused website terms and future prepaid periods. First guest-order billing initialization is restricted to a signup-marked, otherwise unused single-owner workspace; existing workspace currencies and paid snapshots are preserved.
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

Update the gap matrix, benchmarks, original backlog evidence, Arabic readout and this roadmap/package register after verification. Leave an item open while its evidence is absent or stale; record simulation and external deferral separately. Preserve the source plan and earlier amendments as history. Final closure includes A11 and D-063–D-067 and keeps live integrations and public Arabic website launch visibly deferred.
