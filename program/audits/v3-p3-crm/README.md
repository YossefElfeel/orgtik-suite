# CRM service catalog and delivery checkpoint

2026-10-10; isolated CRM worktree, shared publication source base `ff9ea42`. This checkpoint implements the ordinary CRM catalog, price grid, publication and service delivery surfaces. Packaged delivery references are still being completed with the root-owned adapter; the full P4 CRM cycle is mapped in [p4-inventory.md](p4-inventory.md).

Canonical ordinary routes are `/[locale]/catalog`, `/catalog/services/[id]`, `/catalog/pricing`, `/catalog/bundles`, `/catalog/publish`, `/service-requests`, and the shared eight-section `/admin/[[...section]]`. `/service-catalog`, `/service-catalog/pricing` and `/service-catalog/publish` remain compatible. Detail IDs resolve both encoded offer IDs and platform service IDs. The local frame uses shared SuiteFrame/bootstrap/search/notifications/workspace banners, one search and one bell, current-role administration gates and signed SOS handoff. Services have their own sidebar group. The Presentation and retired SaaS groups are removed from navigation. Retired routes are not revived.

Catalog offer and bundle Sheets use RHF/zod and the actual persisted service mutations. Five-language names/descriptions/capabilities, department/icon/availability, CHF anchors, regional/country override drafts and recommendation/membership edits use the existing platform store. Failed writes retain form values. Invalid translations open the first failing language. Offer writes include only dirty fields; a price-only edit preserves untouched descriptions/capabilities and website fallback content. Regional controls respect each currency's decimal scale. Publishing uses a confirmation and one operation reference across retries, updates new public quotes and clears saved drafts.

The publication screen shows saved changes, actual server price/card previews for the chosen country/term/group size, the service duration/count policy, captured schedules, cancellation and change history. The policy editor stages service-only discounts through the same resolver. Schedule validation/defaults use `suite.snapshot.now` and the workspace timezone, not the system date. Scheduling captures the saved batch and clears working drafts; cancellation is confirmed, and immediate publication records the current actor and price version. No clock mutation or second price calculator is introduced.

Delivery uses authoritative per-request capabilities and eligible active CRM service staff. Review, quote with amount/currency/validity confirmation, assignment, hold/resume, milestones, messages, cancellation and note delivery run actual scoped callbacks. Staff names resolve from the eligible DTO. Customer CRM admins cannot edit OrgTik public services; denial is verified using a subscribed customer CRM owner with the actual `admin` role.

Validation:

- **154 checks / 37 captures** in [report.json](report.json): the three ordinary routes, EN/AR × light/dark × 1440/768/390, no serious/critical axe, document overflow or runtime errors; actual draft → publish → loaded reload and review → EGP quote → message.
- **21 checks / 5 captures** in [depth-report.json](depth-report.json): UI regional/country price edits, France public quote resolving its EUR432 country override, eligible staff assignment, hold/resume, milestone update, note delivery entering customer review, EN/AR customer-admin no-access, and a one-read network error with successful Retry.
- **51 checks / 13 captures** in [publication-report.json](publication-report.json): canonical catalog/detail/pricing/bundle routes, actual service discount draft, non-mutating price preview, retained software savings, workspace-clock scheduling, unchanged current quotes while scheduled, cancellation, immediate publication/history, and EN/AR × light/dark ×1440/768/390. A final visual-only confirmation updates the same capture/check slots after source edits settle.
- **4 checks / 1 capture** in [price-patch-report.json](price-patch-report.json): a price-only edit PATCHes the intended value, preserves absent fallback metadata and leaves published content unchanged. Across these four reports: **230 checks / 56 captures**.
- CRM typecheck, all five catalog key/placeholder checks and the optimized production build pass. Shared UI build was run solely to synchronize the committed library into pnpm's injected consumers; no shared-library source change is part of this CRM checkpoint.
- A batched visual review inspected the desktop catalog/conversation and Arabic dark mobile pricing/delivery. Table-wide data scrolls inside the named table region; the document itself does not overflow. The approved plum/aubergine brand and Montserrat/Plex typography remain.

The owned launcher uses `ORGTIK_DEMO_PORT_OFFSET=300`: web ports 3800/3803, API ports 7800/7803/7808, icons on 7899 and presentation on 7877. Data/journal are isolated in memory; the private clock stays `2026-10-07T09:00:00Z`. No external provider is contacted, no arbitrary binary is uploaded, and no hosted deployment or website markup/style change occurs in this stream.

Run from the repository root:

```powershell
pnpm --filter @orgtik/ui build
$env:ORGTIK_DEMO_PORT_OFFSET='300'
pnpm demo sales
# Another terminal, after the server is ready:
node program/audits/v3-p3-crm/verify.mjs
node program/audits/v3-p3-crm/depth.mjs
node program/audits/v3-p3-crm/publication.mjs
node program/audits/v3-p3-crm/price-patch.mjs
```

The failed attempts remain recorded: `setup-failure.json` is an expired handoff during the initial 100 second auth compilation; `stale-injected-package-failure.json/png` records the old injected notification default before a library build synchronized the fix; `reload-loading-assertion-failure.json/png` records a test reading skeleton rows; `customer-fixture-not-subscribed-failure.json` records an unsuitable Nour fixture after all 36 route captures passed. These do not count as successful evidence. The final report used waits for actual loaded records and resumed only the corrected permission case with `--permission-only`, preserving the complete matrix instead of repeating it.

Publication attempts are separately preserved: `publication-cold-route-failure` records a cold canonical route that had not rendered within the original wait; `publication-encoded-id-failure` records the encoded URL ID mismatch fixed by catalog lookup; `publication-selector-failure` records an assertion matching both draft and preview headings; `publication-hmr-confirmation-failure` records transient layout chunk errors while hot edits were in progress. The final confirmation runs after edits settle and keeps the successful functional cases without replaying persisted mutations.

Before this checkpoint can be called full P3 completion, add the permission-checked packaged service delivery references and focused evidence. Website price data/parity and platform source-role regression evidence belong to the root-owned P3 package.
