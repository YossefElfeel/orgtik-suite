# A18 — remaining-work replan and implementation stop

**Resumed on 2026-10-08:** the owner requested continuation of the stakeholder UI/UX prototype. CMS alignment is the active first package; security remains outside scope and Vercel stays paused. PR #19 has merged into main `1d8c5df` after its successful checks. The stop and preserved-state table below are historical records of the earlier pause.

2026-10-08. The owner stopped implementation and requested a new plan because elapsed time and token use had not produced sufficiently visible results. All parallel implementation agents are stopped. No further implementation, PR creation, merge or deployment is authorized by this replan alone; resume only after a new user instruction.

This amendment changes delivery priorities and review cadence. It preserves the approved R0 → R1 → R2 → R3 → R4 roadmap, the 72 commitments, existing pricing/access decisions and explicit external deferrals.

**Owner clarification — stakeholder presentation prototype:** the purpose is to present the product as a senior UI/UX designer. Prioritize visual quality, information architecture, realistic mock journeys, responsive behavior and clear interaction states. Security work and production hardening are outside this delivery scope. Reuse the existing runtime and access behavior; do not add a security workstream. The full roadmap remains a product backlog, not a prerequisite for presenting the selected prototype flows.

## Preserved state

| Work | State at the stop |
|---|---|
| R0 code and R1 foundations/people/leave/deadlines | Merged through PRs #14–#17 and earlier R0 packages; full release acceptance remains open |
| Files references in Tasks/Chats | PR #18 merged; recorded main `438c2377c7d8d98259bdcad363a30b8c8bfde68a` |
| Persistent whiteboards | [PR #19](https://github.com/YossefElfeel/orgtik-suite/pull/19) is **open and unmerged**, source `327e895b83a7e7c4fb006b30d8d1612503dca45d`; [CI](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37732109610) and [deployment-pause check](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37732109529) pass |
| Whiteboard local evidence | 436 retained mock checks; 93 bounded browser assertions, 15 captures, 26 matching source hashes. These are package checks, not complete release journeys |
| Diagnostic privacy finding | Recorded and deferred outside the presentation scope. No fix implemented; the isolated checkout has no source changes |
| CMS alignment | Read-only audit begun. Owner confirmed the reference is the **latest merged website code**, excluding canonical checkout WIP |
| Deployment | Vercel remains paused. No production/shared data reset or clock advancement |

Existing local changes and evidence are preserved. The canonical checkout is not clean and must not be reset or bulk-staged. Existing accounts, invoices, sample asset bytes and configured resources remain protected.

## Delivery method after an explicit resume

Work on one visible feature package at a time. Use one implementation owner and at most one independent reviewer; parallel work must have separate file ownership and a clear dependency boundary. Avoid opening several simultaneous feature branches.

Every package ends with a working local flow, a short visible result, representative screenshots, one coherent PR, and a concise statement of what remains. Show the prototype and its changed behavior before opening the next feature package. A PR link or a test count alone is insufficient product evidence.

Use focused type/catalog checks and manually verify the changed presentation flows once the source is stable. Review screenshots, keyboard navigation, layout, loading, empty, error and success states. Repeat checks only after relevant changes or failures. Existing CI remains in place; do not expand security testing or infrastructure as part of this presentation work.

Record implementation, local acceptance, CI, merge and hosted acceptance separately. Do not mark a whole release or an external provider complete from a bounded demo. Vercel stays paused until the owner changes that instruction.

## First packages

| Order | Package and visible outcome | Completion boundary |
|---|---|---|
| 0 | Review the already-built whiteboard result in PR #19 | Show save/reopen, conflict recovery and pinned Files-to-Chats navigation. Preserve the unmerged PR until work is resumed |
| 1 | **CMS alignment to the current website** | Localize Partners sections/fields and current page/entry names in five CMS languages; reflect current legal/footer, account setup and purchasing content; remove misleading presentation of old CHF mirror values and identify platform pricing authority. Preserve website English visual parity |
| 2 | Durable website/CMS source alignment | Regeneration retains current Partners and commerce fields from the monorepo source. Preserve stable IDs, existing edits/drafts, published versions and approved rich-text/placeholder shapes. Prove repeat regeneration does not lose current fields or drift website output |
| 3 | Runtime CMS and publishing connection | Publish a changed field, then observe it on the website. Use the existing publishing behavior and a last-known-good fallback. Show draft, preview and published states clearly. Live Vercel execution remains paused |
| 4 | Stakeholder walkthrough | Prepare a short, repeatable demo using named mock personas/data: website content → CMS edit/preview/publish, purchase → workspace, team/access, and Files/Tasks/Chats. Show the completed screens and interactions, and label simulated or unfinished capabilities accurately |

Orders 1–4 split the CMS request into reviewable outcomes. The first visible result is the CMS editor itself. Current audit findings are specific: missing localized Partners labels/entry names, obsolete pricing-authority wording and values, and a seed generator still pinned to the older sibling website revision. The current committed seed and website snapshot already agree; do not claim a live seed/snapshot mismatch.

## Remaining product backlog

The entries below retain the longer roadmap. They do not all have to be completed before the stakeholder presentation. Select the next vertical flow by its presentation value and current UX gaps; defer security recovery, production hardening and comprehensive operational certification.

| Release | Remaining implementation or acceptance | Suggested coherent packages |
|---|---|---|
| R0 | Hosted checkout/invoice agreement, pricing endpoint and touched shell/flow acceptance | Reuse merged code and existing regression evidence; run hosted acceptance when deployment resumes |
| R1 | Remaining people, seats, billing and access UX | Present workspace switching, invitations, seat availability, ownership transfer and HR lifecycle using existing mock foundations. Staff authority recovery/reappointment is deferred outside this presentation scope |
| R2 Files | PR #19 integration and full J8 acceptance | Review existing whiteboards rather than rebuild them; keep generic file versions/comments and uploads separately tracked |
| R2 Notifications/search | Suite notification delivery/read state/deep links and permission-filtered search | Notifications first, search separately; recheck current recipient/source/workspace permissions and counts. Reuse existing platform/Tasks surfaces and workspace handoff |
| R2 Chats | Remaining persistent channel/message/membership/read-state and polling acceptance | Audit merged persistent foundations, then implement only identified gaps |
| R2 CRM | Website leads/orders in OrgTik CRM; authorized staff provisioning from won deals | Separate routing and provisioning packages; preserve customer CRM isolation and D-059 managed-service requests |
| R2 Preferences/catalog | Cross-domain language/theme/digits/timezone and sign-out; expanded catalog/trial entry | Separate preferences/revocation and catalog/trial packages; immutable paid-order currency and four-term offer arithmetic remain platform-owned |
| R2 Attribution | OrgTik Marketing/WM/Sales attribution | Connect actual mock workflows with customer-workspace boundaries |
| R3 shared foundations | Usage/limits, invoice PDF, audit retrieval and functional mock 2FA | Four bounded foundations with visible flows and consumer tests |
| R3 tool commitments | Retain all eight commitments for each of the nine tools; most remain unaccepted or unfinished | Audit each register item against R1/R2/R4, link overlaps, then deliver remaining vertical flows. Track implemented/simulated/external-deferred evidence separately |
| R4 operations | Currency migration, dunning administration, onboarding, usage, billing contacts, refunds/credit notes, invoice series, metrics, pay links, support SLA/merge/replies and launch checks | Use the existing ten R4 packages and extend earlier foundations; keep tax-ID/e-invoice behavior deterministic mock |
| Retirement/closure | D-055 replacements, final evidence and all 15 hosted journeys | Retire only after replacements pass. Keep Vercel project deletion a separate explicit decision. Update gaps, benchmarks, backlog and Arabic readout from actual evidence |

The maintained [package register](../backlog/release-packages.csv) retains 129 package IDs and the 72-feature register. This ordering does not remove any commitment or infer completion from existing screen presence.

## Acceptance and scope controls

- CMS/website changes check WM, website, content contracts, parity/build output and the actual edit → publish → read flow. Include Admin when platform-pricing contracts change, and Sales/Marketing when form routing or attribution changes.
- Preserve existing backend/auth behavior and avoid unrelated changes. Use the runtime dependency map if a presentation flow actually requires a shared API change; no new security workstream.
- Demonstrate clear saving, success, failure and retry behavior in selected flows. Preserve existing purchased-seat quantities, per-tool quote totals and pricing calculations.
- Suite prototype flows use English/Arabic, light/dark and responsive widths. CMS has five-language catalogs. Public Arabic website launch, live integrations, live media, arbitrary binary uploads and regulatory submission stay explicitly deferred.
- The original 15 hosted journeys remain future roadmap acceptance, not a blocker for a local stakeholder walkthrough. Deployment remains paused and existing data/clocks remain unchanged.

## الخلاصة بالمصري

الشغل البرمجي والفرق المتوازية اتوقفوا بطلب المالك. PR19 للسبورات نجح في CI لكنه لسه ما اتدمجش. بعد طلب استئناف جديد، أول نتيجة ظاهرة هتكون CMS مطابق لآخر كود ويبسايت مدموج، بعدها مصدر المحتوى والنشر والـ fallback، ثم باقي R1/R2 والـ ٧٢ التزام وR4. كل حزمة لازم يكون لها تجربة محلية واضحة وصور وPR واحد قبل الانتقال للي بعدها. مفيش نشر Vercel أو تغيير للبيانات القديمة، وقبول الرحلات المنشورة لسه مفتوح.

توضيح المالك: الهدف بروتوتايب لعرضه على أصحاب المصلحة بصفته Senior UI/UX Designer. الأولوية لجودة الشاشات والرحلات والتفاعلات والمحاكاة الواضحة. شغل الأمن والتجهيز للإنتاج خارج النطاق الحالي، ومش هنبدأه. الخطة الكبيرة محفوظة كباك لوج؛ مش لازم تخلص كلها قبل العرض.
