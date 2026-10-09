# CRM service catalog and delivery checkpoint

2026-10-10; isolated CRM worktree, shared source base `44d58ab`. This checkpoint implements the ordinary CRM catalog, price grid and service delivery surfaces. Publication preview/history/scheduling and packaged delivery references are still being completed with the root-owned adapter; the full P4 CRM cycle is mapped in [p4-inventory.md](p4-inventory.md).

Ordinary routes are `/[locale]/service-catalog`, `/service-catalog/pricing`, `/service-requests`, and the shared eight-section `/admin/[[...section]]`. The local frame now uses shared SuiteFrame/bootstrap/search/notifications/workspace banners, one search and one bell, current-role administration gates and signed SOS handoff. The Presentation and retired SaaS groups are removed from navigation. Retired routes are not revived.

Catalog offer and bundle Sheets use RHF/zod and the actual persisted service mutations. Five-language names/descriptions/capabilities, department/icon/availability, CHF anchors, regional/country override drafts and recommendation/membership edits use the existing platform store. Failed writes retain form values. Invalid translations open the first failing language. Publishing uses a confirmation and one operation reference across retries, updates new public quotes and clears saved drafts. The monthly duration/count policy is read from the shared public resolver; no second calculator is introduced.

Delivery uses authoritative per-request capabilities and eligible active CRM service staff. Review, quote with amount/currency/validity confirmation, assignment, hold/resume, milestones, messages, cancellation and note delivery run actual scoped callbacks. Staff names resolve from the eligible DTO. Customer CRM admins cannot edit OrgTik public services; denial is verified using a subscribed customer CRM owner with the actual `admin` role.

Validation:

- **154 checks / 37 captures** in [report.json](report.json): the three ordinary routes, EN/AR × light/dark × 1440/768/390, no serious/critical axe, document overflow or runtime errors; actual draft → publish → loaded reload and review → EGP quote → message.
- **21 checks / 5 captures** in [depth-report.json](depth-report.json): UI regional/country price edits, France public quote resolving its EUR432 country override, eligible staff assignment, hold/resume, milestone update, note delivery entering customer review, EN/AR customer-admin no-access, and a one-read network error with successful Retry.
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
```

The failed attempts remain recorded: `setup-failure.json` is an expired handoff during the initial 100 second auth compilation; `stale-injected-package-failure.json/png` records the old injected notification default before a library build synchronized the fix; `reload-loading-assertion-failure.json/png` records a test reading skeleton rows; `customer-fixture-not-subscribed-failure.json` records an unsuitable Nour fixture after all 36 route captures passed. These do not count as successful evidence. The final report used waits for actual loaded records and resumed only the corrected permission case with `--permission-only`, preserving the complete matrix instead of repeating it.

Before this checkpoint can be called full P3 completion, add publication preview/schedule/history and the permission-checked packaged service delivery references, with their focused route evidence. Website price data/parity and platform source-role regression evidence belong to the root-owned P3 package.
