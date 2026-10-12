# OrgTik stakeholder prototype

Nine tools and all72 approved UI commitments are mapped under [D-073](decisions/D-073.md). The fifteen walkthroughs now have local presentation coverage with explicit limits. This is a senior UI/UX reference for the PM and developers; full production release acceptance remains pending. [A36](phase-f/amendment-A36.md) records the hosted stakeholder rollout and its scoped verification. Payments, mail, AI, analytics, signatures and calls are labelled simulations.

Validated merge baseline: `0337413` through PR38 (2026-10-08). Final implementation PR38 passed CI and merged. The maintained amendments A33/A34 record this boundary; this guide does not imply all changes are already on main.

## Run and present

The runnable checkout for this delivery is `C:/Users/yosse/Projects/New sass/orgtik-suite-r2-whiteboards`. The separately maintained `orgtik-suite-v2/program` documents mirror this handoff; its older runtime WIP is preserved.

From the runnable checkout, run `pnpm demo --list` for addresses, then `pnpm demo <tools>` for an isolated memory-backed, fixed-clock dataset. SOS starts with the selected tools; use existing synthetic accounts from `mock/README.md` in a private browser window. No passwords are reproduced here. Existing configured resources and user previews are preserved. The authorized hosted prototype is available at [Suite](https://orgtik-suite-sos.vercel.app/presentation), [Website](https://orgtik-suite-website.vercel.app) and [CMS](https://orgtik-suite-wm.vercel.app/en/content/pages/pg_partners). Use existing synthetic accounts and the Demo Panel; automatic deployment remains paused.

The shared Demo Panel switches presentation persona/workspace, six states, language, theme, digits and timezone. Persona changes are visual simulations, not account impersonation. Reset scene resets selectors; tool reset restores only its presentation records. Never reset existing shared/production business data or advance its clock for a demonstration.

## Screen map

| Tool | Presentation and retained screens | Evidence/limits |
|---|---|---|
| Tasks | `/[locale]/presentation`; retained Dashboard/My Tasks/project views | Filters incl. priority/due, edit/repeat/labels, three presets/save template, CSV/bulk status/priority, Files/search/notices; Tasks depth22/eight captures + template/channel matrix and connected coverage. Task presentation records are separate from actual private Dashboard data. |
| Files | `/[locale]/presentation`; retained workspace Files/whiteboards | Packaged assets, versions/conflicts/access/quota/comments/bulk/drag/filter; versioned Tasks/Chats picks. Arbitrary uploads deferred. |
| Chats | `/presentation`; retained chat/office/whiteboard | History, membership/read-by, formatting, saved/reminders/custom schedule, versioned Files and Tasks; call/media and external delivery simulated. |
| HR | `/[locale]/presentation`; `/employees`, `/calendar`, `/time-off`, payroll/offboarding | Current-directory employee reference → three mock Tasks; retained hire/accept/access/leave/calendar J7 nine; ownership/equipment J15 six with custody fixture limit. Bank/mail samples simulated. |
| Sales | `/[locale]/presentation`; retained CRM details | Connected intake/follow-ups/pipeline/routing/quotes/reports; company/field detail UI accepted with shared feature-detail evidence. Real provisioning/signatures deferred. |
| Marketing | `/[locale]/presentation` | Campaign consent/results, WM/Sales attribution, rich RTL email, inbox/queue, journey/brand-kit source. Focused journey/brand-kit UI acceptance passes shared feature-detail evidence. |
| WM | `/[locale]/presentation`; `/content/pages/pg_partners` | Actual mock CMS publish/reload/fallback retained; studio bundles/media/translation/form outcomes simulated. Internal OrgTik tool; purchase creates a managed-service request. |
| ADM | `/[locale]/presentation`; catalog/pricing/workspaces/reports/invoices/service requests | Dunning/grace/currency/credit/paylink/tax/support/export mock scenes; per-entity series14; customer preview14 preserves staff session. No live financial/regulatory integration. |
| Account | `/presentation`; `/team`, `/mailbox`, `/billing`, `/support`, `/services/requests` | Setup/limits/export/UI verification policy, sample PDF/contacts; account61 package proof; retained invite/ownership/support/service UI. |

## Demonstration routes

Start with [the fifteen scripts and coverage boundaries](prototype-journeys.md), then use [the exact72-feature map](prototype-feature-map.md) for developer detail. J1 verifies an actual mock paid order before account linking, matching CHF16 receipt/invoice and purchased empty Tasks Dashboard; the first task remains a client presentation reference. J2 demonstrates actual invitation acceptance/tool entry. J7 uses the newly hired directory person for onboarding and approved leave. J10 completes the retained support and managed-service round trip.

J3 lifecycle and J12 customer view are expressly simulated UI flows. J11 reuses accepted unchanged CMS source rather than claiming a fresh full-suite run. J15 covers successor ownership, employment and equipment/final-pay; its empty-owned-record fixture does not prove task/file custody or other-workspace protection. Shared reports covering several journeys are not additive assertion totals or independent end-to-end runs.

## Developer handoff

`tools/demo/connections.cjs` provides the local memory-backed bridge. The hosted `/presentation` handler stores synthetic task/lead/File-reference/search/notification records in a separate namespace in the existing configured store. `demoRequest` returns `{simulated:true,data}` and carries the chosen presentation scene. Existing backend accounts, invoices, identity, sessions and CMS publishing remain separate and frozen. HR directory picking reads the existing current-workspace API and copies identity/email/currency into a local onboarding reference; it does not update HR salary or membership.

The feature map specifies each record/action shape and future backend requirement. Existing handoff/refresh/workspace APIs are reused; frontend cold-entry warm-ups avoid issuing short-lived codes before target compilation. The mock transport does not establish production persistence, authorization, delivery, concurrency or regulatory guarantees.

## Deferred acceptance

Focused Sales company and Marketing journey/brand-kit golden UI evidence passes 80 scoped checks and23 captures, including functional paths, locale/theme/width and digit-format checks; its real backend/provider behavior remains pending. Final code integration/CI and independent closure review passed in PR38; [A34](phase-f/amendment-A34.md) records local UI/mock delivery closure. Tasks priority/due filtering, editing and bulk status/priority now have22 scoped checks/eight captures. Hosted acceptance, live media/payment/mail/AI/analytics/social/signature providers, arbitrary binary uploads, regulatory submissions and public Arabic website launch remain deferred. Security/backend hardening is outside this prototype task.

Evidence: [final core/tools/catalog/entity](audits/prototype-final/README.md), [business/public/lifecycle](audits/prototype-business-closure/README.md), [shared Account/customer preview](audits/prototype-shared-account/README.md). Original benchmark ratings and spec statuses remain historical; the new presentation columns/overlays track UI coverage separately.
