# CRM P4 inventory

Inventory from the isolated CRM branch after shared P2/P3 base `e569e38`; 2026-10-10. This is a remaining-work map, not a completion claim. The service catalog and delivery implementation belongs to P3 and has separate browser evidence.

| Commitment | Ordinary incumbent | Remaining integration |
|---|---|---|
| R3-SALES-01 follow-up Tasks | Customers/deals have ordinary IDs, owners and detail routes. Shared `/api/suite/tasks` resolves the source record. | Add `ConnectedFeature` + persisted task action to customer/project inspectors. Remove `demoRequest` from ordinary workflow. |
| R3-SALES-02 import/export/bulk | Ordinary customer queries already persist records with scoped visibility and lead owners. | Move `ContactImport` mapping/review to `/customers`, use real create/update callbacks, selection + bulk assignment, and export the current scoped records. |
| R3-SALES-03 stages/probability/forecast | `/customers/pipeline` is an actual lead board using the D-028 fixed stages. `/projects` is the actual deal domain. | Editable persisted pipeline definitions/probabilities and deal forecast; migrate `StageEditor` from the presentation-only client scene. |
| R3-SALES-04 timeline/logging | Customer notes and meeting mutation endpoints already exist; ordinary `/activity-feed` is present. | Bring attributed call/email/meeting events into current contact detail; use shared timeline and stable server time. |
| R3-SALES-05 routing/automations | Assigned salespeople and website intake are actual CRM records. | Persist source-to-owner rules and their run logs, apply through CRM-owned record writes, with pending/error/saved states. |
| R3-SALES-06 offers/PDF/validity/signature | Ordinary `/offers` and `/offers/[id]` use existing offer/contract records and price resolver. | Attach value-aware PDF/print preview, validity controls and clearly simulated signature to real offer IDs. Preserve money confirmations and immutable paid snapshots. |
| R3-SALES-07 companies/custom fields/tags | Ordinary customer records contain companyName/website; actual contacts own their notes. | Persist company entities, contact relation, tags and field definitions rather than reuse the separate `SalesScene` dataset. Migrate CompanyDirectory to an ordinary `/companies` route. |
| R3-SALES-08 targets/reports | Ordinary dashboard/commissions/project queries already aggregate actual sales data. | Persist targets and add funnel/source/lost-reason/forecast views based on the current scoped records. |

Tier B adds multiple pipelines, duplicate merge, WhatsApp/click-to-call simulation, and structured call/email/meeting logging. None of these may execute real provider traffic. Their present equivalents are either absent or client-only presentation controls, and still require bounded CRM-owned mock contracts.

The new shared shell has one search and one notification center, removes the Presentation item from navigation, exposes current workspace/billing state, and uses signed SOS handoff. `/admin/[[...section]]` hosts the standard eight ToolAdminScreen sections. Broader P4 still needs CRM-specific admin pipeline/routing/field/offer-template controls, first-run checklist/sample data, every connection gate, six-state checks, all five catalogs, and ordinary-route evidence.

Static source inventory finds **159 files** with local UI/shared-kit/sonner/iconify imports in `apps/sales/app` and `apps/sales/components`; **117 files** import `@/components/ui` across Sales (including retired source). The retired SaaS pages remain guarded; they must not be revived. P4 removal should eliminate dead retired kit consumers, then migrate the remaining live consumers rather than blindly rewrite unsupported component props. The app still installs iconify, lucide, react-day-picker and sonner and mounts a legacy Toaster alongside the library Toaster.

`ActivityFeedList` currently wraps `dayHeading(group.date, tag)` in `suppressHydrationWarning`. The helper uses current client/server time for relative day names; P4 must use the shared frozen/current workspace clock and remove the suppression once a genuine hydration check passes.

The presentation page stores a separate `SalesScene` in sessionStorage and imports `demoRequest` for bridge tasks/leads. Its eight feature surfaces are not ordinary API coverage. Root owns new backend adapters; this CRM stream will wire them after the Tasks pilot establishes the accepted pattern.
